import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { GetUserQuery } from '../queries/get-user.query';
import { EventStoreService } from '../../event-store.service';

@QueryHandler(GetUserQuery)
export class GetUserQueryHandler implements IQueryHandler<GetUserQuery> {
  private readonly logger = new Logger(GetUserQueryHandler.name);

  constructor(private readonly eventStoreService: EventStoreService) {}

  async execute(query: GetUserQuery): Promise<any> {
    try {
      this.logger.debug(`Getting user: ${query.id}`);

      // Replay events to get current state
      const userState = await this.eventStoreService.replayEvents(query.id);

      if (!userState || Object.keys(userState).length === 0) {
        return null;
      }

      // Remove sensitive data
      const { password, ...safeUserData } = userState;

      this.logger.debug(`User retrieved: ${query.id}`);
      return safeUserData;
    } catch (error) {
      this.logger.error(`Error getting user ${query.id}:`, error);
      throw error;
    }
  }
}