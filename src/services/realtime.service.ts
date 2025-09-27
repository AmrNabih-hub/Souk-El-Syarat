// Minimal RealtimeService shim used by stores and UI during migration
export class RealtimeService {
  static subscribeToPresence(userId: string, cb: (presence: any) => void): () => void {
    // no-op subscription stub
    const interval = setInterval(() => cb({ userId, online: false }), 60000);
    return () => clearInterval(interval);
  }

  static subscribeToConversations(userId: string, cb: (conversations: any[]) => void): () => void {
    const interval = setInterval(() => cb([]), 60000);
    return () => clearInterval(interval);
  }

  static publishPresence(userId: string, presence: any): Promise<void> {
    return Promise.resolve();
  }
}
