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

const TICKET = {
  put_url: 'https://storage.example.com/temp-uploads/user/abc.png?X-Goog-Signature=write',
  file_url: 'https://storage.example.com/temp-uploads/user/abc.png?X-Goog-Signature=read',
  content_type: 'image/png',
};

const VALID_PARAMS = { filename: 'panda.png', size: 482113 };

describe('UploadClient', () => {
  let fetchMock: jest.Mock;

  beforeEach(() => {
    fetchMock = setupFetchMock();
  });

  afterEach(() => {
    cleanupMocks();
  });

  describe('.createTicket()', () => {
    it('sends a JSON POST to /v1/upload/ticket with snake_case fields', async () => {
      const client = createTestClient();
      mockFetchJsonResponse(TICKET);

      await client.upload.createTicket(VALID_PARAMS);

      const [url, options] = fetchMock.mock.calls[0];
      expect(url).toContain('/v1/upload/ticket');
      expect(options.method).toBe('POST');
      expect(options.headers['Content-Type']).toBe('application/json');
      expect(options.headers['x-api-key']).toBe('test-api-key-123');
      expect(JSON.parse(options.body)).toEqual({
        filename: 'panda.png',
        content_type: undefined,
        size: 482113,
      });
    });

    it('passes an abort signal so a hung request cannot wedge the caller', async () => {
      const client = createTestClient();
      mockFetchJsonResponse(TICKET);

      await client.upload.createTicket(VALID_PARAMS);

      const [, options] = fetchMock.mock.calls[0];
      expect(options.signal).toBeInstanceOf(AbortSignal);
    });

    it('maps the snake_case envelope to camelCase', async () => {
      const client = createTestClient();
      mockFetchJsonResponse(TICKET);

      const result = await client.upload.createTicket(VALID_PARAMS);

      expect(result.putUrl).toBe(TICKET.put_url);
      expect(result.fileUrl).toBe(TICKET.file_url);
      expect(result.contentType).toBe(TICKET.content_type);
      expect(result.metadata.requestId).toBe('test-req-id');
    });

    it('sends a Bearer token when an access token is configured', async () => {
      const client = createOAuthTestClient();
      mockFetchJsonResponse(TICKET);

      await client.upload.createTicket(VALID_PARAMS);

      const [, options] = fetchMock.mock.calls[0];
      expect(options.headers.Authorization).toBe(`Bearer ${TEST_ACCESS_TOKEN}`);
      expect(options.headers['x-api-key']).toBeUndefined();
    });

    it('forwards an explicit contentType override', async () => {
      const client = createTestClient();
      mockFetchJsonResponse(TICKET);

      await client.upload.createTicket({ filename: 'blob', size: 10, contentType: 'image/png' });

      const body = JSON.parse(fetchMock.mock.calls[0][1].body);
      expect(body.filename).toBe('blob');
      expect(body.content_type).toBe('image/png');
    });
  });

  describe('validation', () => {
    it('throws ValidationError when filename is missing or empty', async () => {
      const client = createTestClient();

      await expect(client.upload.createTicket({ filename: '', size: 10 })).rejects.toThrow(
        ValidationError
      );
      await expect(
        client.upload.createTicket({ size: 10 } as unknown as { filename: string; size: number })
      ).rejects.toThrow(ValidationError);
    });

    it('throws ValidationError when an explicit contentType is empty', async () => {
      const client = createTestClient();

      await expect(
        client.upload.createTicket({ filename: 'panda.png', size: 10, contentType: '' })
      ).rejects.toThrow(ValidationError);
    });

    it('throws ValidationError when size is not a positive integer', async () => {
      const client = createTestClient();

      await expect(client.upload.createTicket({ filename: 'panda.png', size: 0 })).rejects.toThrow(
        ValidationError
      );
      await expect(
        client.upload.createTicket({ filename: 'panda.png', size: 1.5 })
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('error handling', () => {
    it('throws AuthError on INVALID_API_KEY', async () => {
      const client = createTestClient();
      mockFetchErrorResponse('INVALID_API_KEY', 401);

      await expect(client.upload.createTicket(VALID_PARAMS)).rejects.toThrow(AuthError);
    });

    it('throws RateLimitError on RATE_LIMIT_EXCEEDED', async () => {
      const client = createTestClient();
      mockFetchErrorResponse('RATE_LIMIT_EXCEEDED', 429);

      await expect(client.upload.createTicket(VALID_PARAMS)).rejects.toThrow(RateLimitError);
    });

    it('throws APIError on VALIDATION_ERROR from the API', async () => {
      const client = createTestClient();
      mockFetchErrorResponse('VALIDATION_ERROR', 400, 'size exceeds the 25MB limit.');

      await expect(client.upload.createTicket(VALID_PARAMS)).rejects.toThrow(APIError);
    });

    it('throws a 408 APIError when the request is aborted', async () => {
      const client = createTestClient();
      const abortError = new Error('aborted');
      abortError.name = 'AbortError';
      fetchMock.mockRejectedValue(abortError);

      await expect(client.upload.createTicket(VALID_PARAMS)).rejects.toThrow(/timed out/);
    });

    it('rethrows non-abort network errors unchanged', async () => {
      const client = createTestClient();
      fetchMock.mockRejectedValue(new Error('ECONNREFUSED'));

      await expect(client.upload.createTicket(VALID_PARAMS)).rejects.toThrow('ECONNREFUSED');
    });
  });
});
