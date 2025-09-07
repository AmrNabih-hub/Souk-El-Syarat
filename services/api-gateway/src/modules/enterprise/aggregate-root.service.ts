import { Injectable, Logger } from '@nestjs/common';
import { EventStoreService, DomainEvent } from './event-store.service';

export abstract class AggregateRoot {
  private uncommittedEvents: DomainEvent[] = [];
  protected version: number = 0;
  protected id: string;

  constructor(id: string) {
    this.id = id;
  }

  protected addDomainEvent(event: DomainEvent): void {
    this.uncommittedEvents.push(event);
  }

  getUncommittedEvents(): DomainEvent[] {
    return [...this.uncommittedEvents];
  }

  markEventsAsCommitted(): void {
    this.uncommittedEvents = [];
  }

  getId(): string {
    return this.id;
  }

  getVersion(): number {
    return this.version;
  }

  setVersion(version: number): void {
    this.version = version;
  }

  abstract apply(event: DomainEvent): void;
}

export interface UserAggregateData {
  id: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  version: number;
}

@Injectable()
export class AggregateRootService {
  private readonly logger = new Logger(AggregateRootService.name);
  private readonly aggregates = new Map<string, AggregateRoot>();

  constructor(private readonly eventStoreService: EventStoreService) {}

  async save(aggregate: AggregateRoot): Promise<void> {
    try {
      const uncommittedEvents = aggregate.getUncommittedEvents();
      
      if (uncommittedEvents.length > 0) {
        await this.eventStoreService.appendEvents(
          aggregate.getId(),
          uncommittedEvents,
          aggregate.getVersion()
        );
        
        aggregate.markEventsAsCommitted();
        aggregate.setVersion(aggregate.getVersion() + uncommittedEvents.length);
      }
      
      this.logger.debug(`Aggregate ${aggregate.getId()} saved with ${uncommittedEvents.length} events`);
    } catch (error) {
      this.logger.error(`Error saving aggregate ${aggregate.getId()}:`, error);
      throw error;
    }
  }

  async load<T extends AggregateRoot>(
    aggregateType: new (id: string) => T,
    id: string
  ): Promise<T | null> {
    try {
      const stream = await this.eventStoreService.getEventStream(id);
      
      if (stream.events.length === 0) {
        return null;
      }
      
      const aggregate = new aggregateType(id);
      
      // Replay events
      for (const event of stream.events) {
        aggregate.apply(event);
      }
      
      aggregate.setVersion(stream.version);
      
      this.logger.debug(`Aggregate ${id} loaded with version ${stream.version}`);
      return aggregate;
    } catch (error) {
      this.logger.error(`Error loading aggregate ${id}:`, error);
      return null;
    }
  }

  async loadFromSnapshot<T extends AggregateRoot>(
    aggregateType: new (id: string) => T,
    id: string
  ): Promise<T | null> {
    try {
      const snapshot = await this.eventStoreService.getSnapshot(id);
      
      if (!snapshot) {
        return this.load(aggregateType, id);
      }
      
      const aggregate = new aggregateType(id);
      
      // Load from snapshot
      const state = await this.eventStoreService.replayEvents(id, snapshot.version);
      
      // Apply snapshot data to aggregate
      Object.assign(aggregate, state);
      aggregate.setVersion(snapshot.version);
      
      this.logger.debug(`Aggregate ${id} loaded from snapshot at version ${snapshot.version}`);
      return aggregate;
    } catch (error) {
      this.logger.error(`Error loading aggregate from snapshot ${id}:`, error);
      return this.load(aggregateType, id);
    }
  }

  async exists(id: string): Promise<boolean> {
    try {
      const stream = await this.eventStoreService.getEventStream(id);
      return stream.events.length > 0;
    } catch (error) {
      this.logger.error(`Error checking if aggregate exists ${id}:`, error);
      return false;
    }
  }

  async getAggregateHistory(id: string): Promise<DomainEvent[]> {
    try {
      const stream = await this.eventStoreService.getEventStream(id);
      return stream.events;
    } catch (error) {
      this.logger.error(`Error getting aggregate history ${id}:`, error);
      return [];
    }
  }

  async deleteAggregate(id: string): Promise<void> {
    try {
      // In a real implementation, you would mark the aggregate as deleted
      // rather than actually deleting the events
      this.logger.debug(`Aggregate ${id} marked for deletion`);
    } catch (error) {
      this.logger.error(`Error deleting aggregate ${id}:`, error);
      throw error;
    }
  }
}