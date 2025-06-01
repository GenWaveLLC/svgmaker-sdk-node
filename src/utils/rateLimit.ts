import { SVGMakerConfig } from '../types/config';
import { RequestOptions } from './httpClient';

/**
 * Simple rate limiter implementation
 */
class RateLimiter {
  private requestTimes: number[] = [];
  private readonly limit: number;
  private readonly windowMs: number;

  constructor(limit: number, windowMs: number) {
    this.limit = limit;
    this.windowMs = windowMs;
  }

  async acquire(): Promise<void> {
    const now = Date.now();

    // Remove old requests outside the window
    this.requestTimes = this.requestTimes.filter(time => now - time < this.windowMs);

    // If we're at the limit, wait
    if (this.requestTimes.length >= this.limit) {
      const oldestRequest = this.requestTimes[0];
      const waitTime = this.windowMs - (now - oldestRequest);

      if (waitTime > 0) {
        await new Promise(resolve => setTimeout(resolve, waitTime));
        return this.acquire(); // Try again after waiting
      }
    }

    // Record this request
    this.requestTimes.push(now);
  }
}

/**
 * Creates a rate limiter for API requests
 * @param config SDK configuration containing rate limit settings
 * @returns Function that wraps API calls with rate limiting
 */
export function createRateLimiter<T>(config: SVGMakerConfig) {
  // Convert requests per minute to interval
  const requestsPerMinute = config.rateLimit;
  const intervalMs = 60 * 1000; // 1 minute in milliseconds

  const rateLimiter = new RateLimiter(requestsPerMinute, intervalMs);

  /**
   * Wraps an async function with rate limiting
   * @param fn Function to throttle
   * @returns Rate-limited function
   */
  return function rateLimitWrapper(
    fn: (url: string, options?: RequestOptions) => Promise<T>
  ): typeof fn {
    return async (url: string, options?: RequestOptions) => {
      await rateLimiter.acquire();

      if (config.logging) {
        console.log('Rate limiting applied to request');
      }

      return fn(url, options);
    };
  };
}
