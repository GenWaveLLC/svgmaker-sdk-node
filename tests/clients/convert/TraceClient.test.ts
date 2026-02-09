import {
  createTestClient,
  setupFetchMock,
  cleanupMocks,
  mockFetchJsonResponse,
  mockFetchErrorResponse,
  createMockConvertResultsResponse,
} from '../../setup';
import {
  ValidationError,
  AuthError,
  InsufficientCreditsError,
  RateLimitError,
  EndpointDisabledError,
  APIError,
} from '../../../src/errors/CustomErrors';

describe('TraceClient', () => {
  let fetchMock: jest.Mock;
  let originalExistsSync: any;
  let originalReadFileSync: any;

  beforeEach(() => {
    fetchMock = setupFetchMock();
    const fs = require('fs');
    originalExistsSync = fs.existsSync;
    originalReadFileSync = fs.readFileSync;
    fs.existsSync = jest.fn().mockReturnValue(true);
    fs.readFileSync = jest.fn().mockReturnValue(Buffer.from('fake-file-data'));
  });

  afterEach(() => {
    cleanupMocks();
    const fs = require('fs');
    fs.existsSync = originalExistsSync;
    fs.readFileSync = originalReadFileSync;
  });

  // ==========================================================================
  // .configure()
  // ==========================================================================

  describe('.configure()', () => {
    it('returns a new instance (immutability)', () => {
      const client = createTestClient();
      const original = client.convert.trace;
      const configured = original.configure({ file: '/img.png' });

      expect(configured).not.toBe(original);
    });

    it('merges params across multiple configure calls', async () => {
      const client = createTestClient();
      mockFetchJsonResponse(createMockConvertResultsResponse());

      const configured = client.convert.trace
        .configure({ file: '/img.png' })
        .configure({ preset: 'poster' });

      await configured.execute();

      expect(fetchMock).toHaveBeenCalled();
      const [url] = fetchMock.mock.calls[0];
      expect(url).toContain('/v1/convert/trace');
    });
  });

  // ==========================================================================
  // .execute()
  // ==========================================================================

  describe('.execute()', () => {
    it('sends POST to /v1/convert/trace with FormData', async () => {
      const client = createTestClient();
      mockFetchJsonResponse(createMockConvertResultsResponse());

      await client.convert.trace
        .configure({ file: '/test.png' })
        .execute();

      expect(fetchMock).toHaveBeenCalled();
      const [url, options] = fetchMock.mock.calls[0];
      expect(url).toContain('/v1/convert/trace');
      expect(options.method).toBe('POST');
      expect(options.body).toBeInstanceOf(FormData);
    });

    it('sends API key in headers', async () => {
      const client = createTestClient();
      mockFetchJsonResponse(createMockConvertResultsResponse());

      await client.convert.trace
        .configure({ file: '/test.png' })
        .execute();

      const [, options] = fetchMock.mock.calls[0];
      expect(options.headers['x-api-key']).toBe('test-api-key-123');
    });

    it('appends file and all optional params to FormData', async () => {
      const client = createTestClient();
      mockFetchJsonResponse(createMockConvertResultsResponse());

      await client.convert.trace
        .configure({
          file: '/test.png',
          algorithm: 'vtracer',
          preset: 'bw',
          mode: 'spline',
          hierarchical: 'stacked',
          detail: 50,
          smoothness: 75,
          corners: 30,
          reduceNoise: 5,
        })
        .execute();

      const formData = fetchMock.mock.calls[0][1].body as FormData;
      expect(formData.get('file')).toBeTruthy();
      expect(formData.get('algorithm')).toBe('vtracer');
      expect(formData.get('preset')).toBe('bw');
      expect(formData.get('mode')).toBe('spline');
      expect(formData.get('hierarchical')).toBe('stacked');
      expect(formData.get('detail')).toBe('50');
      expect(formData.get('smoothness')).toBe('75');
      expect(formData.get('corners')).toBe('30');
      expect(formData.get('reduceNoise')).toBe('5');
    });

    it('returns properly shaped ConvertResultsResponse', async () => {
      const client = createTestClient();
      const mockData = createMockConvertResultsResponse();
      mockFetchJsonResponse(mockData);

      const result = await client.convert.trace
        .configure({ file: '/test.png' })
        .execute();

      expect(Array.isArray(result.results)).toBe(true);
      expect(result.results[0].filename).toBe('test-image.png');
      expect(result.summary.total).toBe(1);
      expect(result.metadata).toBeDefined();
    });
  });

  // ==========================================================================
  // Validation
  // ==========================================================================

  describe('validation', () => {
    it('throws ValidationError when file is missing', async () => {
      const client = createTestClient();
      mockFetchJsonResponse(createMockConvertResultsResponse());

      await expect(
        client.convert.trace.execute(),
      ).rejects.toThrow(ValidationError);
    });

    it('throws ValidationError for invalid preset value', async () => {
      const client = createTestClient();
      mockFetchJsonResponse(createMockConvertResultsResponse());

      await expect(
        client.convert.trace
          .configure({ file: '/img.png', preset: 'invalid' as any })
          .execute(),
      ).rejects.toThrow(ValidationError);
    });

    it('throws ValidationError for invalid mode value', async () => {
      const client = createTestClient();
      mockFetchJsonResponse(createMockConvertResultsResponse());

      await expect(
        client.convert.trace
          .configure({ file: '/img.png', mode: 'invalid' as any })
          .execute(),
      ).rejects.toThrow(ValidationError);
    });

    it('throws ValidationError when detail < 0', async () => {
      const client = createTestClient();
      mockFetchJsonResponse(createMockConvertResultsResponse());

      await expect(
        client.convert.trace
          .configure({ file: '/img.png', detail: -1 })
          .execute(),
      ).rejects.toThrow(ValidationError);
    });

    it('throws ValidationError when detail > 100', async () => {
      const client = createTestClient();
      mockFetchJsonResponse(createMockConvertResultsResponse());

      await expect(
        client.convert.trace
          .configure({ file: '/img.png', detail: 101 })
          .execute(),
      ).rejects.toThrow(ValidationError);
    });

    it('throws ValidationError when smoothness > 100', async () => {
      const client = createTestClient();
      mockFetchJsonResponse(createMockConvertResultsResponse());

      await expect(
        client.convert.trace
          .configure({ file: '/img.png', smoothness: 101 })
          .execute(),
      ).rejects.toThrow(ValidationError);
    });

    it('throws ValidationError when corners < 0', async () => {
      const client = createTestClient();
      mockFetchJsonResponse(createMockConvertResultsResponse());

      await expect(
        client.convert.trace
          .configure({ file: '/img.png', corners: -1 })
          .execute(),
      ).rejects.toThrow(ValidationError);
    });

    it('accepts valid params', async () => {
      const client = createTestClient();
      mockFetchJsonResponse(createMockConvertResultsResponse());

      const result = await client.convert.trace
        .configure({
          file: '/img.png',
          preset: 'photo',
          mode: 'polygon',
          detail: 0,
          smoothness: 100,
          corners: 50,
        })
        .execute();

      expect(result).toBeDefined();
    });
  });

  // ==========================================================================
  // Error Handling
  // ==========================================================================

  describe('error handling', () => {
    it('throws AuthError on INVALID_API_KEY', async () => {
      const client = createTestClient();
      const configured = client.convert.trace.configure({ file: '/img.png' });
      mockFetchErrorResponse('INVALID_API_KEY', 401);

      await expect(configured.execute()).rejects.toThrow(AuthError);
    });

    it('throws InsufficientCreditsError on INSUFFICIENT_CREDITS', async () => {
      const client = createTestClient();
      const configured = client.convert.trace.configure({ file: '/img.png' });
      mockFetchErrorResponse('INSUFFICIENT_CREDITS', 402);

      await expect(configured.execute()).rejects.toThrow(InsufficientCreditsError);
    });

    it('throws RateLimitError on RATE_LIMIT_EXCEEDED', async () => {
      const client = createTestClient();
      const configured = client.convert.trace.configure({ file: '/img.png' });
      mockFetchErrorResponse('RATE_LIMIT_EXCEEDED', 429);

      await expect(configured.execute()).rejects.toThrow(RateLimitError);
    });

    it('throws EndpointDisabledError on ENDPOINT_DISABLED', async () => {
      const client = createTestClient();
      const configured = client.convert.trace.configure({ file: '/img.png' });
      mockFetchErrorResponse('ENDPOINT_DISABLED', 503, 'This endpoint is disabled');

      await expect(configured.execute()).rejects.toThrow(EndpointDisabledError);
    });

    it('throws APIError on generic server error', async () => {
      const client = createTestClient();
      const configured = client.convert.trace.configure({ file: '/img.png' });
      mockFetchErrorResponse('INTERNAL_ERROR', 500, 'Something went wrong');

      await expect(configured.execute()).rejects.toThrow(APIError);
    });
  });
});
