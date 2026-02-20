import {
  createTestClient,
  setupFetchMock,
  cleanupMocks,
  mockFetchJsonResponse,
  mockFetchErrorResponse,
  createMockAccountInfoData,
  createMockAccountUsageData,
} from '../setup';
import { ValidationError, RateLimitError, APIError } from '../../src/errors/CustomErrors';

describe('AccountClient', () => {
  let fetchMock: jest.Mock;

  beforeEach(() => {
    fetchMock = setupFetchMock();
  });

  afterEach(() => {
    cleanupMocks();
  });

  // ==========================================================================
  // .getInfo()
  // ==========================================================================

  describe('.getInfo()', () => {
    it('sends GET to /v1/account', async () => {
      const client = createTestClient();
      mockFetchJsonResponse(createMockAccountInfoData());

      await client.account.getInfo();

      expect(fetchMock).toHaveBeenCalled();
      const [url, options] = fetchMock.mock.calls[0];
      expect(url).toContain('/v1/account');
      expect(options.method).toBe('GET');
    });

    it('sends API key in x-api-key header', async () => {
      const client = createTestClient();
      mockFetchJsonResponse(createMockAccountInfoData());

      await client.account.getInfo();

      const [, options] = fetchMock.mock.calls[0];
      expect(options.headers['x-api-key']).toBe('test-api-key-123');
    });

    it('returns properly shaped AccountResponse', async () => {
      const client = createTestClient();
      const mockData = createMockAccountInfoData();
      mockFetchJsonResponse(mockData);

      const result = await client.account.getInfo();

      expect(result.email).toBe(mockData.email);
      expect(result.displayName).toBe(mockData.displayName);
      expect(result.accountType).toBe(mockData.accountType);
      expect(result.credits).toBe(mockData.credits);
      expect(result.metadata).toBeDefined();
    });
  });

  // ==========================================================================
  // .getUsage()
  // ==========================================================================

  describe('.getUsage()', () => {
    it('sends GET to /v1/account/usage with no query params when called with no args', async () => {
      const client = createTestClient();
      mockFetchJsonResponse(createMockAccountUsageData());

      await client.account.getUsage();

      expect(fetchMock).toHaveBeenCalled();
      const [url, options] = fetchMock.mock.calls[0];
      expect(url).toContain('/v1/account/usage');
      expect(url).not.toContain('?');
      expect(options.method).toBe('GET');
    });

    it('appends days as query param when provided', async () => {
      const client = createTestClient();
      mockFetchJsonResponse(createMockAccountUsageData());

      await client.account.getUsage({ days: 7 });

      const [url] = fetchMock.mock.calls[0];
      expect(url).toContain('days=7');
    });

    it('appends start and end as query params when provided', async () => {
      const client = createTestClient();
      mockFetchJsonResponse(createMockAccountUsageData());

      await client.account.getUsage({ start: '2025-01-01', end: '2025-01-31' });

      const [url] = fetchMock.mock.calls[0];
      expect(url).toContain('start=2025-01-01');
      expect(url).toContain('end=2025-01-31');
    });

    it('returns properly shaped AccountUsageResponse', async () => {
      const client = createTestClient();
      const mockData = createMockAccountUsageData();
      mockFetchJsonResponse(mockData);

      const result = await client.account.getUsage();

      expect(result.period).toEqual(mockData.period);
      expect(result.summary).toEqual(mockData.summary);
      expect(result.byCategory).toEqual(mockData.byCategory);
      expect(result.metadata).toBeDefined();
    });
  });

  // ==========================================================================
  // .getUsage() validation
  // ==========================================================================

  describe('.getUsage() validation', () => {
    it('throws ValidationError when days is used with start', async () => {
      const client = createTestClient();

      await expect(
        client.account.getUsage({ days: 7, start: '2025-01-01' } as any)
      ).rejects.toThrow(ValidationError);
    });

    it('throws ValidationError when days is used with end', async () => {
      const client = createTestClient();

      await expect(client.account.getUsage({ days: 7, end: '2025-01-31' } as any)).rejects.toThrow(
        ValidationError
      );
    });

    it('throws ValidationError when only start is provided without end', async () => {
      const client = createTestClient();

      await expect(client.account.getUsage({ start: '2025-01-01' } as any)).rejects.toThrow(
        ValidationError
      );
    });

    it('throws ValidationError on unknown property due to .strict()', async () => {
      const client = createTestClient();

      await expect(client.account.getUsage({ foo: 'bar' } as any)).rejects.toThrow(ValidationError);
    });
  });

  // ==========================================================================
  // Error Handling
  // ==========================================================================

  describe('error handling', () => {
    // Note: AccountClient methods use handleRequest() which goes through
    // the retry wrapper. Non-retryable errors (AuthError, InsufficientCreditsError,
    // EndpointDisabledError) are wrapped in AbortError by the retry utility.
    // Retryable status codes (429, 500) are re-thrown as-is after exhausting retries.

    it('throws on INVALID_API_KEY (401)', async () => {
      const client = createTestClient();
      mockFetchErrorResponse('INVALID_API_KEY', 401, 'Invalid API key');

      await expect(client.account.getInfo()).rejects.toThrow('Invalid API key');
    });

    it('throws on INSUFFICIENT_CREDITS (402)', async () => {
      const client = createTestClient();
      mockFetchErrorResponse('INSUFFICIENT_CREDITS', 402, 'Not enough credits');

      await expect(client.account.getInfo()).rejects.toThrow('Not enough credits');
    });

    it('throws RateLimitError on RATE_LIMIT_EXCEEDED (429)', async () => {
      const client = createTestClient();
      mockFetchErrorResponse('RATE_LIMIT_EXCEEDED', 429);

      await expect(client.account.getInfo()).rejects.toThrow(RateLimitError);
    });

    it('throws on ENDPOINT_DISABLED (503)', async () => {
      const client = createTestClient();
      mockFetchErrorResponse('ENDPOINT_DISABLED', 503, 'This endpoint is disabled');

      await expect(client.account.getInfo()).rejects.toThrow('This endpoint is disabled');
    });

    it('throws APIError on generic server error (500)', async () => {
      const client = createTestClient();
      mockFetchErrorResponse('SERVER_ERROR', 500, 'Internal server error');

      await expect(client.account.getInfo()).rejects.toThrow(APIError);
    });
  });
});
