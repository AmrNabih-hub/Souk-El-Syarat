import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';
import { EnterpriseController } from './enterprise.controller';
import { CommandBus, QueryBus, EventBus } from '@nestjs/cqrs';
import { EventStoreService } from './event-store.service';
import { AggregateRootService } from './aggregate-root.service';
import { DomainEventService } from './domain-event.service';
import { SagaService } from './saga.service';
import { EventSourcingService } from './event-sourcing.service';
import { CqrsService } from './cqrs.service';
import { EnterpriseMonitoringService } from './enterprise-monitoring.service';

// Command Handlers
import { CreateUserCommandHandler } from './commands/handlers/create-user.command-handler';
import { UpdateUserCommandHandler } from './commands/handlers/update-user.command-handler';
import { DeleteUserCommandHandler } from './commands/handlers/delete-user.command-handler';

// Query Handlers
import { GetUserQueryHandler } from './queries/handlers/get-user.query-handler';
import { GetUsersQueryHandler } from './queries/handlers/get-users.query-handler';

// Event Handlers
import { UserCreatedEventHandler } from './events/handlers/user-created.event-handler';
import { UserUpdatedEventHandler } from './events/handlers/user-updated.event-handler';
import { UserDeletedEventHandler } from './events/handlers/user-deleted.event-handler';

const CommandHandlers = [
  CreateUserCommandHandler,
  UpdateUserCommandHandler,
  DeleteUserCommandHandler,
];

const QueryHandlers = [
  GetUserQueryHandler,
  GetUsersQueryHandler,
];

const EventHandlers = [
  UserCreatedEventHandler,
  UserUpdatedEventHandler,
  UserDeletedEventHandler,
];

@Module({
  imports: [
    ConfigModule,
    CqrsModule,
  ],
  controllers: [EnterpriseController],
  providers: [
    // Core Services
    EventStoreService,
    AggregateRootService,
    DomainEventService,
    SagaService,
    EventSourcingService,
    CqrsService,
    EnterpriseMonitoringService,
    
    // CQRS Handlers
    ...CommandHandlers,
    ...QueryHandlers,
    ...EventHandlers,
  ],
  exports: [
    EventStoreService,
    AggregateRootService,
    DomainEventService,
    SagaService,
    EventSourcingService,
    CqrsService,
    EnterpriseMonitoringService,
  ],
})
export class EnterpriseModule {}