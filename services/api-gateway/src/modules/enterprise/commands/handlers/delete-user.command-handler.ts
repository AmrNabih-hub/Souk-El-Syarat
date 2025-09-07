import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { DeleteUserCommand } from '../commands/delete-user.command';

@CommandHandler(DeleteUserCommand)
export class DeleteUserCommandHandler implements ICommandHandler<DeleteUserCommand> {
  private readonly logger = new Logger(DeleteUserCommandHandler.name);

  async execute(command: DeleteUserCommand): Promise<void> {
    this.logger.log(`Deleting user: ${command.id}`);
    // Implementation would go here
  }
}