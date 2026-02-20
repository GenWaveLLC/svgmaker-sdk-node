import {
  createTestClient,
  setupFetchMock,
  cleanupMocks,
  mockFetchJsonResponse,
  mockFetchErrorResponse,
  createMockEnhancePromptResponse,
} from '../setup';
import {
  ValidationError,
  AuthError,
  InsufficientCreditsError,
  RateLimitError,
  EndpointDisabledError,
  APIError,
} from '../../src/errors/CustomErrors';

describe('EnhancePromptClient', () => {
  let fetchMock: jest.Mock;

  beforeEach(() => {
    fetchMock = setupFetchMock();
  });

  afterEach(() => {
    cleanupMocks();
  });

  // .configure() - 2 tests
  describe('.configure()', () => {
    it('returns a new instance (immutability)', () => {
      const client = createTestClient();
      const original = client.enhancePrompt;
      const configured = original.configure({ prompt: 'A cat' });
      expect(configured).not.toBe(original);
    });

    it('merges params across multiple configure calls', async () => {
      const client = createTestClient();
      mockFetchJsonResponse(createMockEnhancePromptResponse());

      // First configure sets prompt, second overrides it
      const configured = client.enhancePrompt
        .configure({ prompt: 'A cat' })
        .configure({ prompt: 'A dog' });

      await configured.execute();
      expect(fetchMock).toHaveBeenCalled();
      const [url, options] = fetchMock.mock.calls[0];
      expect(url).toContain('/v1/enhance-prompt');
      const body = JSON.parse(options.body);
      expect(body.prompt).toBe('A dog');
    });
  });

  // .execute() - 4 tests
  describe('.execute()', () => {
    it('sends POST to /v1/enhance-prompt with JSON body', async () => {
      const client = createTestClient();
      mockFetchJsonResponse(createMockEnhancePromptResponse());
      await client.enhancePrompt.configure({ prompt: 'A sunset' }).execute();
      const [url, options] = fetchMock.mock.calls[0];
      expect(url).toContain('/v1/enhance-prompt');
      expect(options.method).toBe('POST');
    });

    it('sends API key and Content-Type headers', async () => {
      const client = createTestClient();
      mockFetchJsonResponse(createMockEnhancePromptResponse());
      await client.enhancePrompt.configure({ prompt: 'A sunset' }).execute();
      const [, options] = fetchMock.mock.calls[0];
      expect(options.headers['x-api-key']).toBe('test-api-key-123');
      expect(options.headers['Content-Type']).toBe('application/json');
    });

    it('sends prompt in request body', async () => {
      const client = createTestClient();
      mockFetchJsonResponse(createMockEnhancePromptResponse());
      await client.enhancePrompt.configure({ prompt: 'A mountain scene' }).execute();
      const [, options] = fetchMock.mock.calls[0];
      const body = JSON.parse(options.body);
      expect(body.prompt).toBe('A mountain scene');
    });

    it('returns properly shaped EnhancePromptResponse', async () => {
      const client = createTestClient();
      const mockData = createMockEnhancePromptResponse();
      mockFetchJsonResponse(mockData);
      const result = await client.enhancePrompt.configure({ prompt: 'A sunset' }).execute();
      expect(result.enhancedPrompt).toBe(mockData.enhancedPrompt);
      expect(result.metadata).toBeDefined();
    });
  });

  // validation - 1 test
  describe('validation', () => {
    it('throws ValidationError when prompt is missing', async () => {
      const client = createTestClient();
      mockFetchJsonResponse(createMockEnhancePromptResponse());
      await expect(client.enhancePrompt.execute()).rejects.toThrow(ValidationError);
    });
  });

  // error handling - 5 tests
  describe('error handling', () => {
    it('throws AuthError on INVALID_API_KEY', async () => {
      const client = createTestClient();
      mockFetchErrorResponse('INVALID_API_KEY', 401);
      await expect(client.enhancePrompt.configure({ prompt: 'A cat' }).execute()).rejects.toThrow(
        AuthError
      );
    });

    it('throws InsufficientCreditsError on INSUFFICIENT_CREDITS', async () => {
      const client = createTestClient();
      mockFetchErrorResponse('INSUFFICIENT_CREDITS', 402);
      await expect(client.enhancePrompt.configure({ prompt: 'A cat' }).execute()).rejects.toThrow(
        InsufficientCreditsError
      );
    });

    it('throws RateLimitError on RATE_LIMIT_EXCEEDED', async () => {
      const client = createTestClient();
      mockFetchErrorResponse('RATE_LIMIT_EXCEEDED', 429);
      await expect(client.enhancePrompt.configure({ prompt: 'A cat' }).execute()).rejects.toThrow(
        RateLimitError
      );
    });

    it('throws EndpointDisabledError on ENDPOINT_DISABLED', async () => {
      const client = createTestClient();
      mockFetchErrorResponse('ENDPOINT_DISABLED', 503);
      await expect(client.enhancePrompt.configure({ prompt: 'A cat' }).execute()).rejects.toThrow(
        EndpointDisabledError
      );
    });

    it('throws APIError on generic server error', async () => {
      const client = createTestClient();
      mockFetchErrorResponse('INTERNAL_ERROR', 500);
      await expect(client.enhancePrompt.configure({ prompt: 'A cat' }).execute()).rejects.toThrow(
        APIError
      );
    });
  });
});
