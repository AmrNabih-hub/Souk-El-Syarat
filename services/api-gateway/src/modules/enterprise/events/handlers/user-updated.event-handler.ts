import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { UserUpdatedEvent } from '../events/user-updated.event';

@EventsHandler(UserUpdatedEvent)
export class UserUpdatedEventHandler implements IEventHandler<UserUpdatedEvent> {
  private readonly logger = new Logger(UserUpdatedEventHandler.name);

  handle(event: UserUpdatedEvent): void {
    this.logger.log(`User updated: ${event.id}`);
    // Implementation would go here
  }
}