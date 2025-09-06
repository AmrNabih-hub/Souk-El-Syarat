import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { UserCreatedEvent } from '../events/user-created.event';

@EventsHandler(UserCreatedEvent)
export class UserCreatedEventHandler implements IEventHandler<UserCreatedEvent> {
  private readonly logger = new Logger(UserCreatedEventHandler.name);

  handle(event: UserCreatedEvent): void {
    this.logger.log(`User created: ${event.id} - ${event.email}`);
    // Implementation would go here
  }
}