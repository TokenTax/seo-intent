/**
 * Simple rate limiter utility
 */

export class RateLimiter {
  private delayMs: number;
  private lastCall: number = 0;

  constructor(delayMs: number) {
    this.delayMs = delayMs;
  }

  /**
   * Wait if necessary to respect rate limit
   */
  async wait(): Promise<void> {
    const now = Date.now();
    const timeSinceLastCall = now - this.lastCall;

    if (timeSinceLastCall < this.delayMs) {
      const waitTime = this.delayMs - timeSinceLastCall;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    this.lastCall = Date.now();
  }
}

/**
 * Execute a function with rate limiting
 */
export async function withRateLimit<T>(
  fn: () => Promise<T>,
  limiter: RateLimiter
): Promise<T> {
  await limiter.wait();
  return fn();
}
