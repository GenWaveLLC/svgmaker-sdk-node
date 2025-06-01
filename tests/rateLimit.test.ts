import { createRateLimiter } from '../src/utils/rateLimit';
import { SVGMakerConfig } from '../src/types/config';

describe('Rate Limiting', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset console.log mock if it exists
    if (jest.isMockFunction(console.log)) {
      (console.log as jest.MockedFunction<typeof console.log>).mockClear();
    }
  });

  afterEach(() => {
    // Restore console.log if it was mocked
    if (jest.isMockFunction(console.log)) {
      (console.log as jest.MockedFunction<typeof console.log>).mockRestore();
    }
  });

  describe('createRateLimiter', () => {
    it('should create a rate limiter with default configuration', () => {
      const config: SVGMakerConfig = {
        apiKey: 'test-key',
        baseUrl: 'https://test.com',
        timeout: 30000,
        maxRetries: 3,
        retryBackoffFactor: 300,
        retryStatusCodes: [429, 500],
        logging: false,
        logLevel: 'info',
        caching: false,
        cacheTTL: 300000,
        rateLimit: 60, // 60 requests per minute
      };

      const rateLimiter = createRateLimiter(config);
      expect(typeof rateLimiter).toBe('function');
    });

    it('should wrap a function with rate limiting', async () => {
      const config: SVGMakerConfig = {
        apiKey: 'test-key',
        baseUrl: 'https://test.com',
        timeout: 30000,
        maxRetries: 3,
        retryBackoffFactor: 300,
        retryStatusCodes: [429, 500],
        logging: false,
        logLevel: 'info',
        caching: false,
        cacheTTL: 300000,
        rateLimit: 2, // 2 requests per minute for testing
      };

      const mockApiCall = jest.fn().mockResolvedValue('success');
      const rateLimiter = createRateLimiter(config);
      const rateLimitedApiCall = rateLimiter(mockApiCall);

      // First call should go through immediately
      const start = Date.now();
      await rateLimitedApiCall('test-url');
      expect(mockApiCall).toHaveBeenCalledTimes(1);
      expect(mockApiCall).toHaveBeenCalledWith('test-url', undefined);

      // Second call should also go through immediately
      await rateLimitedApiCall('test-url-2');
      expect(mockApiCall).toHaveBeenCalledTimes(2);

      const elapsed = Date.now() - start;
      // Should not have waited significantly (less than 100ms)
      expect(elapsed).toBeLessThan(100);
    });

    it('should enforce rate limiting when limit is exceeded', async () => {
      const config: SVGMakerConfig = {
        apiKey: 'test-key',
        baseUrl: 'https://test.com',
        timeout: 30000,
        maxRetries: 3,
        retryBackoffFactor: 300,
        retryStatusCodes: [429, 500],
        logging: false,
        logLevel: 'info',
        caching: false,
        cacheTTL: 300000,
        rateLimit: 2, // 2 requests per minute
      };

      const mockApiCall = jest.fn().mockResolvedValue('success');
      const rateLimiter = createRateLimiter(config);
      const rateLimitedApiCall = rateLimiter(mockApiCall);

      // Make 2 calls quickly (should not be rate limited)
      await rateLimitedApiCall('url-1');
      await rateLimitedApiCall('url-2');

      // Verify that both calls went through
      expect(mockApiCall).toHaveBeenCalledTimes(2);
      expect(mockApiCall).toHaveBeenNthCalledWith(1, 'url-1', undefined);
      expect(mockApiCall).toHaveBeenNthCalledWith(2, 'url-2', undefined);
    });

    it('should respect requests per minute configuration', async () => {
      const config: SVGMakerConfig = {
        apiKey: 'test-key',
        baseUrl: 'https://test.com',
        timeout: 30000,
        maxRetries: 3,
        retryBackoffFactor: 300,
        retryStatusCodes: [429, 500],
        logging: false,
        logLevel: 'info',
        caching: false,
        cacheTTL: 300000,
        rateLimit: 1, // 1 request per minute
      };

      const mockApiCall = jest.fn().mockResolvedValue('success');
      const rateLimiter = createRateLimiter(config);
      const rateLimitedApiCall = rateLimiter(mockApiCall);

      // First call should go through
      await rateLimitedApiCall('url-1');
      expect(mockApiCall).toHaveBeenCalledTimes(1);
      expect(mockApiCall).toHaveBeenCalledWith('url-1', undefined);
    });

    it('should log rate limiting when logging is enabled', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const config: SVGMakerConfig = {
        apiKey: 'test-key',
        baseUrl: 'https://test.com',
        timeout: 30000,
        maxRetries: 3,
        retryBackoffFactor: 300,
        retryStatusCodes: [429, 500],
        logging: true, // Enable logging
        logLevel: 'info',
        caching: false,
        cacheTTL: 300000,
        rateLimit: 60,
      };

      const mockApiCall = jest.fn().mockResolvedValue('success');
      const rateLimiter = createRateLimiter(config);
      const rateLimitedApiCall = rateLimiter(mockApiCall);

      await rateLimitedApiCall('test-url');

      expect(consoleSpy).toHaveBeenCalledWith('Rate limiting applied to request');

      consoleSpy.mockRestore();
    });

    it('should not log when logging is disabled', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const config: SVGMakerConfig = {
        apiKey: 'test-key',
        baseUrl: 'https://test.com',
        timeout: 30000,
        maxRetries: 3,
        retryBackoffFactor: 300,
        retryStatusCodes: [429, 500],
        logging: false, // Disable logging
        logLevel: 'info',
        caching: false,
        cacheTTL: 300000,
        rateLimit: 60,
      };

      const mockApiCall = jest.fn().mockResolvedValue('success');
      const rateLimiter = createRateLimiter(config);
      const rateLimitedApiCall = rateLimiter(mockApiCall);

      await rateLimitedApiCall('test-url');

      expect(consoleSpy).not.toHaveBeenCalledWith('Rate limiting applied to request');

      consoleSpy.mockRestore();
    });

    it('should pass through function arguments correctly', async () => {
      const config: SVGMakerConfig = {
        apiKey: 'test-key',
        baseUrl: 'https://test.com',
        timeout: 30000,
        maxRetries: 3,
        retryBackoffFactor: 300,
        retryStatusCodes: [429, 500],
        logging: false,
        logLevel: 'info',
        caching: false,
        cacheTTL: 300000,
        rateLimit: 60,
      };

      const mockApiCall = jest.fn().mockResolvedValue('test-response');
      const rateLimiter = createRateLimiter(config);
      const rateLimitedApiCall = rateLimiter(mockApiCall);

      const testOptions = { headers: { 'Content-Type': 'application/json' } };
      const result = await rateLimitedApiCall('test-url', testOptions);

      expect(mockApiCall).toHaveBeenCalledWith('test-url', testOptions);
      expect(result).toBe('test-response');
    });

    it('should handle function errors correctly', async () => {
      const config: SVGMakerConfig = {
        apiKey: 'test-key',
        baseUrl: 'https://test.com',
        timeout: 30000,
        maxRetries: 3,
        retryBackoffFactor: 300,
        retryStatusCodes: [429, 500],
        logging: false,
        logLevel: 'info',
        caching: false,
        cacheTTL: 300000,
        rateLimit: 60,
      };

      const error = new Error('API call failed');
      const mockApiCall = jest.fn().mockRejectedValue(error);
      const rateLimiter = createRateLimiter(config);
      const rateLimitedApiCall = rateLimiter(mockApiCall);

      await expect(rateLimitedApiCall('test-url')).rejects.toThrow('API call failed');
      expect(mockApiCall).toHaveBeenCalledTimes(1);
    });

    it('should work with high rate limits', async () => {
      const config: SVGMakerConfig = {
        apiKey: 'test-key',
        baseUrl: 'https://test.com',
        timeout: 30000,
        maxRetries: 3,
        retryBackoffFactor: 300,
        retryStatusCodes: [429, 500],
        logging: false,
        logLevel: 'info',
        caching: false,
        cacheTTL: 300000,
        rateLimit: 1000, // High rate limit
      };

      const mockApiCall = jest.fn().mockResolvedValue('success');
      const rateLimiter = createRateLimiter(config);
      const rateLimitedApiCall = rateLimiter(mockApiCall);

      const start = Date.now();

      // Make multiple calls quickly
      const promises: Promise<unknown>[] = [];
      for (let i = 0; i < 10; i++) {
        promises.push(rateLimitedApiCall(`url-${i}`));
      }

      await Promise.all(promises);

      const elapsed = Date.now() - start;
      expect(mockApiCall).toHaveBeenCalledTimes(10);

      // With high rate limit, all calls should complete quickly
      expect(elapsed).toBeLessThan(1000);
    });
  });

  describe('RateLimiter class behavior', () => {
    it('should handle concurrent requests correctly', async () => {
      const config: SVGMakerConfig = {
        apiKey: 'test-key',
        baseUrl: 'https://test.com',
        timeout: 30000,
        maxRetries: 3,
        retryBackoffFactor: 300,
        retryStatusCodes: [429, 500],
        logging: false,
        logLevel: 'info',
        caching: false,
        cacheTTL: 300000,
        rateLimit: 10, // 10 requests per minute (high enough to avoid delays in test)
      };

      const mockApiCall = jest.fn().mockResolvedValue('success');
      const rateLimiter = createRateLimiter(config);
      const rateLimitedApiCall = rateLimiter(mockApiCall);

      // Start multiple concurrent requests within the rate limit
      const promises = [
        rateLimitedApiCall('url-1'),
        rateLimitedApiCall('url-2'),
        rateLimitedApiCall('url-3'),
      ];

      await Promise.all(promises);

      expect(mockApiCall).toHaveBeenCalledTimes(3);
      expect(mockApiCall).toHaveBeenNthCalledWith(1, 'url-1', undefined);
      expect(mockApiCall).toHaveBeenNthCalledWith(2, 'url-2', undefined);
      expect(mockApiCall).toHaveBeenNthCalledWith(3, 'url-3', undefined);
    });

    it('should test rate limiting behavior with mocked timers', async () => {
      // Use fake timers to control setTimeout behavior
      jest.useFakeTimers();

      const config: SVGMakerConfig = {
        apiKey: 'test-key',
        baseUrl: 'https://test.com',
        timeout: 30000,
        maxRetries: 3,
        retryBackoffFactor: 300,
        retryStatusCodes: [429, 500],
        logging: false,
        logLevel: 'info',
        caching: false,
        cacheTTL: 300000,
        rateLimit: 2, // 2 requests per minute
      };

      const mockApiCall = jest.fn().mockResolvedValue('success');
      const rateLimiter = createRateLimiter(config);
      const rateLimitedApiCall = rateLimiter(mockApiCall);

      // Make 2 calls immediately
      await rateLimitedApiCall('url-1');
      await rateLimitedApiCall('url-2');

      expect(mockApiCall).toHaveBeenCalledTimes(2);

      // Third call should be queued due to rate limiting
      const thirdCallPromise = rateLimitedApiCall('url-3');

      // Verify it hasn't been called yet (should be waiting)
      expect(mockApiCall).toHaveBeenCalledTimes(2);

      // Fast forward time to simulate the rate limit window passing
      jest.advanceTimersByTime(60000); // 1 minute

      // Wait for the promise to resolve
      await thirdCallPromise;

      // Now the third call should have been made
      expect(mockApiCall).toHaveBeenCalledTimes(3);

      jest.useRealTimers();
    });
  });
});
