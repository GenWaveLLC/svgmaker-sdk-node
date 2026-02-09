import { SVGMakerConfig } from '../../src/types/config';
import { SVGMakerClient } from '../../src/core/SVGMakerClient';

// ============================================================================
// Test Constants
// ============================================================================

export const TEST_API_KEY = 'test-api-key-123';
export const TEST_BASE_URL = 'https://svgmaker.io/api';

/**
 * Default test configuration with retries disabled
 */
export const DEFAULT_TEST_CONFIG: Partial<SVGMakerConfig> = {
  baseUrl: TEST_BASE_URL,
  timeout: 30000,
  maxRetries: 0,
  retryBackoffFactor: 300,
  retryStatusCodes: [429, 500],
  logging: false,
  logLevel: 'info',
  caching: false,
  cacheTTL: 300000,
  rateLimit: 9999,
};

// ============================================================================
// Client Factory
// ============================================================================

/**
 * Create a new SVGMakerClient instance configured for testing
 */
export function createTestClient(): SVGMakerClient {
  return new SVGMakerClient(TEST_API_KEY, DEFAULT_TEST_CONFIG);
}

// ============================================================================
// Fetch Mock Helpers
// ============================================================================

let originalFetch: typeof globalThis.fetch;

/**
 * Replace global.fetch with a Jest mock function and return it
 */
export function setupFetchMock(): jest.Mock {
  originalFetch = globalThis.fetch;
  const mock = jest.fn() as jest.Mock;
  globalThis.fetch = mock;
  return mock;
}

/**
 * Restore the original global.fetch and clear all jest mocks
 */
export function cleanupMocks(): void {
  globalThis.fetch = originalFetch;
  jest.restoreAllMocks();
}

// ============================================================================
// Mock Response Builders
// ============================================================================

/**
 * Configure the global fetch mock to return a successful v1 API envelope response
 */
export function mockFetchJsonResponse(
  data: Record<string, any>,
  metadata?: Record<string, any>,
): void {
  const responseBody = {
    success: true,
    data,
    metadata: metadata || {
      requestId: 'test-req-id',
      creditsUsed: 1,
      creditsRemaining: 99,
    },
  };

  (globalThis.fetch as jest.Mock).mockResolvedValue({
    ok: true,
    status: 200,
    headers: new Headers({ 'Content-Type': 'application/json' }),
    json: async () => responseBody,
    text: async () => JSON.stringify(responseBody),
  });
}

/**
 * Configure the global fetch mock to return an error response
 */
export function mockFetchErrorResponse(
  errorCode: string,
  status: number,
  message?: string,
): void {
  const responseBody = {
    success: false,
    error: {
      code: errorCode,
      status,
      message: message || 'Error',
    },
    metadata: {
      requestId: 'test-req-id',
    },
  };

  (globalThis.fetch as jest.Mock).mockResolvedValue({
    ok: false,
    status,
    headers: new Headers({ 'Content-Type': 'application/json' }),
    json: async () => responseBody,
    text: async () => JSON.stringify(responseBody),
  });
}

/**
 * Configure the global fetch mock to return a streaming response
 * with newline-delimited JSON events
 */
export function mockFetchStreamResponse(events: Record<string, any>[]): void {
  const lines = events.map(e => JSON.stringify(e)).join('\n') + '\n';
  const encoded = new TextEncoder().encode(lines);

  let consumed = false;

  const mockReader = {
    read: jest.fn().mockImplementation(async () => {
      if (!consumed) {
        consumed = true;
        return { done: false, value: encoded };
      }
      return { done: true, value: undefined };
    }),
  };

  (globalThis.fetch as jest.Mock).mockResolvedValue({
    ok: true,
    status: 200,
    headers: new Headers({ 'Content-Type': 'text/event-stream' }),
    body: { getReader: () => mockReader },
  });
}
