import {
  createTestClient,
  setupFetchMock,
  cleanupMocks,
  mockFetchJsonResponse,
  mockFetchErrorResponse,
  createOAuthTestClient,
  TEST_ACCESS_TOKEN,
} from '../setup';
import {
  ValidationError,
  AuthError,
  RateLimitError,
  APIError,
} from '../../src/errors/CustomErrors';

const PREPARED_UPLOAD = {
  upload_url: 'https://api.svgmaker.io/v1/upload/signed-temporary-token',
  expires_in: 300,
};

const VALID_PARAMS = { filename: 'panda.png' };

describe('UploadClient', () => {
  let fetchMock: jest.Mock;

  beforeEach(() => {
    fetchMock = setupFetchMock();
  });

  afterEach(() => {
    cleanupMocks();
  });

  describe('.prepare()', () => {
    it('sends a JSON POST to /v1/upload/prepare', async () => {
      const client = createTestClient();
      mockFetchJsonResponse(PREPARED_UPLOAD);

      await client.upload.prepare(VALID_PARAMS);

      const [url, options] = fetchMock.mock.calls[0];
      expect(url).toContain('/v1/upload/prepare');
      expect(options.method).toBe('POST');
      expect(options.headers['Content-Type']).toBe('application/json');
      expect(options.headers['x-api-key']).toBe('test-api-key-123');
      expect(JSON.parse(options.body)).toEqual({ filename: 'panda.png' });
    });

    it('passes an abort signal so a hung request cannot wedge the caller', async () => {
      const client = createTestClient();
      mockFetchJsonResponse(PREPARED_UPLOAD);

      await client.upload.prepare(VALID_PARAMS);

      const [, options] = fetchMock.mock.calls[0];
      expect(options.signal).toBeInstanceOf(AbortSignal);
    });

    it('maps the snake_case envelope to camelCase', async () => {
      const client = createTestClient();
      mockFetchJsonResponse(PREPARED_UPLOAD);

      const result = await client.upload.prepare(VALID_PARAMS);

      expect(result.uploadUrl).toBe(PREPARED_UPLOAD.upload_url);
      expect(result.expiresIn).toBe(PREPARED_UPLOAD.expires_in);
      expect(result.metadata.requestId).toBe('test-req-id');
    });

    it('sends a Bearer token when an access token is configured', async () => {
      const client = createOAuthTestClient();
      mockFetchJsonResponse(PREPARED_UPLOAD);

      await client.upload.prepare(VALID_PARAMS);

      const [, options] = fetchMock.mock.calls[0];
      expect(options.headers.Authorization).toBe(`Bearer ${TEST_ACCESS_TOKEN}`);
      expect(options.headers['x-api-key']).toBeUndefined();
    });
  });

  describe('validation', () => {
    it('throws ValidationError when filename is missing or empty', async () => {
      const client = createTestClient();

      await expect(client.upload.prepare({ filename: '' })).rejects.toThrow(ValidationError);
      await expect(client.upload.prepare({} as unknown as { filename: string })).rejects.toThrow(
        ValidationError
      );
    });
  });

  describe('error handling', () => {
    it('throws AuthError on INVALID_API_KEY', async () => {
      const client = createTestClient();
      mockFetchErrorResponse('INVALID_API_KEY', 401);

      await expect(client.upload.prepare(VALID_PARAMS)).rejects.toThrow(AuthError);
    });

    it('throws RateLimitError on RATE_LIMIT_EXCEEDED', async () => {
      const client = createTestClient();
      mockFetchErrorResponse('RATE_LIMIT_EXCEEDED', 429);

      await expect(client.upload.prepare(VALID_PARAMS)).rejects.toThrow(RateLimitError);
    });

    it('throws APIError on VALIDATION_ERROR from the API', async () => {
      const client = createTestClient();
      mockFetchErrorResponse('VALIDATION_ERROR', 400, 'filename is invalid.');

      await expect(client.upload.prepare(VALID_PARAMS)).rejects.toThrow(APIError);
    });

    it('throws a 408 APIError when the request is aborted', async () => {
      const client = createTestClient();
      const abortError = new Error('aborted');
      abortError.name = 'AbortError';
      fetchMock.mockRejectedValue(abortError);

      await expect(client.upload.prepare(VALID_PARAMS)).rejects.toThrow(/timed out/);
    });

    it('rethrows non-abort network errors unchanged', async () => {
      const client = createTestClient();
      fetchMock.mockRejectedValue(new Error('ECONNREFUSED'));

      await expect(client.upload.prepare(VALID_PARAMS)).rejects.toThrow('ECONNREFUSED');
    });
  });
});
