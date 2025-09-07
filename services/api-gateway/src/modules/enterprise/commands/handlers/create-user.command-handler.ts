import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { CreateUserCommand } from '../commands/create-user.command';
import { EventStoreService } from '../../event-store.service';
import { AggregateRootService } from '../../aggregate-root.service';

@CommandHandler(CreateUserCommand)
export class CreateUserCommandHandler implements ICommandHandler<CreateUserCommand> {
  private readonly logger = new Logger(CreateUserCommandHandler.name);

  constructor(
    private readonly eventStoreService: EventStoreService,
    private readonly aggregateRootService: AggregateRootService,
  ) {}

  async execute(command: CreateUserCommand): Promise<void> {
    try {
      this.logger.log(`Creating user: ${command.email}`);

      // Check if user already exists
      const exists = await this.aggregateRootService.exists(command.id);
      if (exists) {
        throw new Error(`User with ID ${command.id} already exists`);
      }

      // Create domain event
      const userCreatedEvent = {
        id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        aggregateId: command.id,
        aggregateType: 'User',
        eventType: 'UserCreated',
        eventData: {
          id: command.id,
          email: command.email,
          name: command.name,
          role: command.role,
          password: command.password, // In production, this would be hashed
          isActive: true,
          createdAt: new Date(),
        },
        version: 1,
        timestamp: new Date(),
        metadata: {
          commandId: `cmd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userId: command.id,
        },
      };

      // Store event
      await this.eventStoreService.appendEvents(command.id, [userCreatedEvent], 0);

      this.logger.log(`User created successfully: ${command.email}`);
    } catch (error) {
      this.logger.error(`Error creating user ${command.email}:`, error);
      throw error;
    }
  }
}