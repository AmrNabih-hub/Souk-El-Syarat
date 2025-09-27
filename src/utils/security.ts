// Minimal security utilities used by middleware and a few components

export function sanitizeInput(input: string): string {
  // Very small sanitizer for example purposes
  return input.replace(/[<>]/g, '');
}

export function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function generateCSRFToken(): string {
  // Not cryptographically secure; replace with real implementation before production
  return Math.random().toString(36).substring(2);
}

export class RateLimiter {
  private calls: Map<string, number> = new Map();
  private windowMs: number;
  private limit: number;

  constructor(limit = 60, windowMs = 60 * 1000) {
    this.limit = limit;
    this.windowMs = windowMs;
  }

  isAllowed(key: string): boolean {
    const now = Date.now();
    const last = this.calls.get(key) || 0;
    if (now - last > this.windowMs) {
      this.calls.set(key, now);
      return true;
    }
    return false;
  }
}
