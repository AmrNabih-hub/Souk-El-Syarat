import { Controller, Get, Post, Body, Param, Query, Logger } from '@nestjs/common';
import { CommandBus, QueryBus, EventBus } from '@nestjs/cqrs';
import { EventStoreService } from './event-store.service';
import { AggregateRootService } from './aggregate-root.service';
import { CreateUserCommand } from './commands/commands/create-user.command';
import { GetUserQuery } from './queries/queries/get-user.query';

@Controller('enterprise')
export class EnterpriseController {
  private readonly logger = new Logger(EnterpriseController.name);

  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly eventBus: EventBus,
    private readonly eventStoreService: EventStoreService,
    private readonly aggregateRootService: AggregateRootService,
  ) {}

  @Post('users')
  async createUser(@Body() createUserDto: any) {
    try {
      const command = new CreateUserCommand(
        createUserDto.id,
        createUserDto.email,
        createUserDto.name,
        createUserDto.role,
        createUserDto.password,
      );
      
      await this.commandBus.execute(command);
      
      return {
        success: true,
        message: 'User created successfully',
        userId: createUserDto.id,
      };
    } catch (error) {
      this.logger.error('Error creating user:', error);
      return {
        success: false,
        message: 'Failed to create user',
        error: error.message,
      };
    }
  }

  @Get('users/:id')
  async getUser(@Param('id') id: string) {
    try {
      const query = new GetUserQuery(id);
      const user = await this.queryBus.execute(query);
      
      return {
        success: true,
        data: user,
      };
    } catch (error) {
      this.logger.error(`Error getting user ${id}:`, error);
      return {
        success: false,
        message: 'Failed to get user',
        error: error.message,
      };
    }
  }

  @Get('events')
  async getEvents(
    @Query('type') type?: string,
    @Query('aggregateType') aggregateType?: string,
    @Query('limit') limit?: number,
  ) {
    try {
      let events;
      
      if (type) {
        events = await this.eventStoreService.getEventsByType(type, limit || 100);
      } else if (aggregateType) {
        events = await this.eventStoreService.getEventsByAggregateType(aggregateType, limit || 100);
      } else {
        events = [];
      }
      
      return {
        success: true,
        data: events,
        count: events.length,
      };
    } catch (error) {
      this.logger.error('Error getting events:', error);
      return {
        success: false,
        message: 'Failed to get events',
        error: error.message,
      };
    }
  }

  @Get('events/:aggregateId')
  async getEventStream(
    @Param('aggregateId') aggregateId: string,
    @Query('fromVersion') fromVersion?: number,
  ) {
    try {
      const stream = await this.eventStoreService.getEventStream(aggregateId, fromVersion || 0);
      
      return {
        success: true,
        data: stream,
      };
    } catch (error) {
      this.logger.error(`Error getting event stream for ${aggregateId}:`, error);
      return {
        success: false,
        message: 'Failed to get event stream',
        error: error.message,
      };
    }
  }

  @Get('stats')
  async getEventStoreStats() {
    try {
      const stats = await this.eventStoreService.getEventStoreStats();
      
      return {
        success: true,
        data: stats,
      };
    } catch (error) {
      this.logger.error('Error getting event store stats:', error);
      return {
        success: false,
        message: 'Failed to get event store stats',
        error: error.message,
      };
    }
  }

  @Post('replay/:aggregateId')
  async replayEvents(
    @Param('aggregateId') aggregateId: string,
    @Query('fromVersion') fromVersion?: number,
  ) {
    try {
      const state = await this.eventStoreService.replayEvents(aggregateId, fromVersion || 0);
      
      return {
        success: true,
        data: state,
      };
    } catch (error) {
      this.logger.error(`Error replaying events for ${aggregateId}:`, error);
      return {
        success: false,
        message: 'Failed to replay events',
        error: error.message,
      };
    }
  }
}