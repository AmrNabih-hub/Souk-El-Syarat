export class UserUpdatedEvent {
  constructor(
    public readonly id: string,
    public readonly updatedAt: Date,
    public readonly email?: string,
    public readonly name?: string,
    public readonly role?: string,
  ) {}
}