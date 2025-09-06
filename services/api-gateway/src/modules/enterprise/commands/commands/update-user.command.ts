export class UpdateUserCommand {
  constructor(
    public readonly id: string,
    public readonly email?: string,
    public readonly name?: string,
    public readonly role?: string,
  ) {}
}