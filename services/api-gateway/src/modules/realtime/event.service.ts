import { Injectable, Logger } from '@nestjs/common';
import { RealtimeEvent } from './realtime.service';

@Injectable()
export class EventService {
  private readonly logger = new Logger(EventService.name);
  private readonly events: RealtimeEvent[] = [];
  private readonly maxEvents = 10000;

  async storeEvent(event: RealtimeEvent): Promise<void> {
    try {
      this.events.push(event);
      
      // Keep only recent events
      if (this.events.length > this.maxEvents) {
        this.events.splice(0, this.events.length - this.maxEvents);
      }
      
      this.logger.debug(`Event stored: ${event.type}`);
    } catch (error) {
      this.logger.error('Error storing event:', error);
    }
  }

  async storeMessage(message: any): Promise<void> {
    try {
      // Store message as event
      const event: RealtimeEvent = {
        id: message.id,
        type: 'message',
        data: message,
        timestamp: new Date(message.timestamp),
      };
      
      await this.storeEvent(event);
    } catch (error) {
      this.logger.error('Error storing message:', error);
    }
  }

  async getEventHistory(limit: number = 100): Promise<RealtimeEvent[]> {
    try {
      return this.events
        .slice(-limit)
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    } catch (error) {
      this.logger.error('Error getting event history:', error);
      return [];
    }
  }
}