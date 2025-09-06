export class UserDeletedEvent {
  constructor(
    public readonly id: string,
    public readonly deletedAt: Date,
  ) {}
}