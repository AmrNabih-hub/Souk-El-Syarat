import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface DomainEvent {
  id: string;
  aggregateId: string;
  aggregateType: string;
  eventType: string;
  eventData: any;
  version: number;
  timestamp: Date;
  metadata?: any;
}

export interface EventStream {
  aggregateId: string;
  events: DomainEvent[];
  version: number;
}

export interface EventStoreConfig {
  maxEventsPerStream: number;
  snapshotInterval: number;
  retentionDays: number;
  compressionEnabled: boolean;
}

@Injectable()
export class EventStoreService {
  private readonly logger = new Logger(EventStoreService.name);
  private readonly eventStore = new Map<string, DomainEvent[]>();
  private readonly snapshots = new Map<string, any>();
  private readonly config: EventStoreConfig;

  constructor(private readonly configService: ConfigService) {
    this.config = {
      maxEventsPerStream: this.configService.get<number>('EVENT_STORE_MAX_EVENTS', 10000),
      snapshotInterval: this.configService.get<number>('EVENT_STORE_SNAPSHOT_INTERVAL', 100),
      retentionDays: this.configService.get<number>('EVENT_STORE_RETENTION_DAYS', 365),
      compressionEnabled: this.configService.get<boolean>('EVENT_STORE_COMPRESSION', true),
    };
    
    this.logger.log('Event Store Service initialized');
  }

  async appendEvents(aggregateId: string, events: DomainEvent[], expectedVersion: number): Promise<void> {
    try {
      const existingStream = this.eventStore.get(aggregateId) || [];
      
      // Check version conflict
      if (existingStream.length !== expectedVersion) {
        throw new Error(`Version conflict: expected ${expectedVersion}, got ${existingStream.length}`);
      }

      // Assign version numbers
      events.forEach((event, index) => {
        event.version = expectedVersion + index + 1;
        event.timestamp = new Date();
      });

      // Append events
      const newStream = [...existingStream, ...events];
      this.eventStore.set(aggregateId, newStream);

      // Create snapshot if needed
      if (newStream.length % this.config.snapshotInterval === 0) {
        await this.createSnapshot(aggregateId, newStream);
      }

      this.logger.debug(`Appended ${events.length} events to stream ${aggregateId}`);
    } catch (error) {
      this.logger.error(`Error appending events to stream ${aggregateId}:`, error);
      throw error;
    }
  }

  async getEventStream(aggregateId: string, fromVersion: number = 0): Promise<EventStream> {
    try {
      const events = this.eventStore.get(aggregateId) || [];
      const filteredEvents = events.filter(event => event.version > fromVersion);
      
      return {
        aggregateId,
        events: filteredEvents,
        version: events.length,
      };
    } catch (error) {
      this.logger.error(`Error getting event stream for ${aggregateId}:`, error);
      throw error;
    }
  }

  async getEventsByType(eventType: string, limit: number = 100): Promise<DomainEvent[]> {
    try {
      const allEvents: DomainEvent[] = [];
      
      for (const events of this.eventStore.values()) {
        allEvents.push(...events);
      }
      
      return allEvents
        .filter(event => event.eventType === eventType)
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, limit);
    } catch (error) {
      this.logger.error(`Error getting events by type ${eventType}:`, error);
      return [];
    }
  }

  async getEventsByAggregateType(aggregateType: string, limit: number = 100): Promise<DomainEvent[]> {
    try {
      const allEvents: DomainEvent[] = [];
      
      for (const events of this.eventStore.values()) {
        allEvents.push(...events);
      }
      
      return allEvents
        .filter(event => event.aggregateType === aggregateType)
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, limit);
    } catch (error) {
      this.logger.error(`Error getting events by aggregate type ${aggregateType}:`, error);
      return [];
    }
  }

  async createSnapshot(aggregateId: string, events: DomainEvent[]): Promise<void> {
    try {
      const snapshot = {
        aggregateId,
        version: events.length,
        data: this.compressEvents(events),
        timestamp: new Date(),
      };
      
      this.snapshots.set(aggregateId, snapshot);
      this.logger.debug(`Snapshot created for aggregate ${aggregateId} at version ${events.length}`);
    } catch (error) {
      this.logger.error(`Error creating snapshot for ${aggregateId}:`, error);
    }
  }

  async getSnapshot(aggregateId: string): Promise<any> {
    try {
      return this.snapshots.get(aggregateId);
    } catch (error) {
      this.logger.error(`Error getting snapshot for ${aggregateId}:`, error);
      return null;
    }
  }

  async replayEvents(aggregateId: string, fromVersion: number = 0): Promise<any> {
    try {
      const snapshot = await this.getSnapshot(aggregateId);
      let state = snapshot ? this.decompressEvents(snapshot.data) : {};
      
      const stream = await this.getEventStream(aggregateId, fromVersion);
      
      for (const event of stream.events) {
        state = this.applyEvent(state, event);
      }
      
      return state;
    } catch (error) {
      this.logger.error(`Error replaying events for ${aggregateId}:`, error);
      throw error;
    }
  }

  async getEventStoreStats(): Promise<any> {
    try {
      const totalEvents = Array.from(this.eventStore.values())
        .reduce((sum, events) => sum + events.length, 0);
      
      const totalStreams = this.eventStore.size;
      const totalSnapshots = this.snapshots.size;
      
      const eventTypes = new Set<string>();
      const aggregateTypes = new Set<string>();
      
      for (const events of this.eventStore.values()) {
        for (const event of events) {
          eventTypes.add(event.eventType);
          aggregateTypes.add(event.aggregateType);
        }
      }
      
      return {
        totalEvents,
        totalStreams,
        totalSnapshots,
        uniqueEventTypes: eventTypes.size,
        uniqueAggregateTypes: aggregateTypes.size,
        eventTypes: Array.from(eventTypes),
        aggregateTypes: Array.from(aggregateTypes),
        config: this.config,
      };
    } catch (error) {
      this.logger.error('Error getting event store stats:', error);
      return null;
    }
  }

  private compressEvents(events: DomainEvent[]): any {
    if (!this.config.compressionEnabled) {
      return events;
    }
    
    // Simple compression - in production, use proper compression
    return {
      compressed: true,
      data: events,
    };
  }

  private decompressEvents(compressedData: any): any {
    if (!compressedData.compressed) {
      return compressedData;
    }
    
    return compressedData.data;
  }

  private applyEvent(state: any, event: DomainEvent): any {
    // Apply event to state - this would be implemented based on specific domain logic
    return {
      ...state,
      [event.eventType]: event.eventData,
      version: event.version,
      lastUpdated: event.timestamp,
    };
  }
}