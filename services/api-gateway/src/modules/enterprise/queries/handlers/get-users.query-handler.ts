import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { GetUsersQuery } from '../queries/get-users.query';

@QueryHandler(GetUsersQuery)
export class GetUsersQueryHandler implements IQueryHandler<GetUsersQuery> {
  private readonly logger = new Logger(GetUsersQueryHandler.name);

  async execute(query: GetUsersQuery): Promise<any[]> {
    this.logger.debug('Getting users with query:', query);
    return [];
  }
}