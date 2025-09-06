import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { UserDeletedEvent } from '../events/user-deleted.event';

@EventsHandler(UserDeletedEvent)
export class UserDeletedEventHandler implements IEventHandler<UserDeletedEvent> {
  private readonly logger = new Logger(UserDeletedEventHandler.name);

  handle(event: UserDeletedEvent): void {
    this.logger.log(`User deleted: ${event.id}`);
    // Implementation would go here
  }
}