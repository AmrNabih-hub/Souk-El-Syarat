import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class DomainEventService {
  private readonly logger = new Logger(DomainEventService.name);

  constructor() {
    this.logger.log('Domain Event Service initialized');
  }

  async publishEvent(event: any): Promise<void> {
    this.logger.debug('Publishing domain event:', event);
  }
}