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

describe('BatchConvertClient', () => {
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
      const original = client.convert.batch;
      const configured = original.configure({ files: ['/img.png'] });

      expect(configured).not.toBe(original);
    });

    it('merges params across multiple configure calls', async () => {
      const client = createTestClient();
      mockFetchJsonResponse(createMockConvertResultsResponse());

      const configured = client.convert.batch
        .configure({ files: ['/a.png', '/b.jpg'] })
        .configure({ toFormat: 'svg' })
        .configure({ preset: 'bw' });

      await configured.execute();

      expect(fetchMock).toHaveBeenCalled();
      const [url] = fetchMock.mock.calls[0];
      expect(url).toContain('/v1/convert/batch');
    });
  });

  // ==========================================================================
  // .execute()
  // ==========================================================================

  describe('.execute()', () => {
    it('sends POST to /v1/convert/batch with FormData', async () => {
      const client = createTestClient();
      mockFetchJsonResponse(createMockConvertResultsResponse());

      await client.convert.batch
        .configure({ files: ['/img.png'], toFormat: 'svg' })
        .execute();

      expect(fetchMock).toHaveBeenCalled();
      const [url, options] = fetchMock.mock.calls[0];
      expect(url).toContain('/v1/convert/batch');
      expect(options.method).toBe('POST');
      expect(options.body).toBeInstanceOf(FormData);
    });

    it('sends API key in headers', async () => {
      const client = createTestClient();
      mockFetchJsonResponse(createMockConvertResultsResponse());

      await client.convert.batch
        .configure({ files: ['/img.png'], toFormat: 'svg' })
        .execute();

      const [, options] = fetchMock.mock.calls[0];
      expect(options.headers['x-api-key']).toBe('test-api-key-123');
    });

    it('appends multiple files as separate file fields', async () => {
      const client = createTestClient();
      mockFetchJsonResponse(createMockConvertResultsResponse());

      await client.convert.batch
        .configure({ files: ['/a.png', '/b.jpg'], toFormat: 'svg' })
        .execute();

      const formData = fetchMock.mock.calls[0][1].body as FormData;
      expect(formData.getAll('file').length).toBe(2);
    });

    it('appends toFormat and optional params to FormData', async () => {
      const client = createTestClient();
      mockFetchJsonResponse(createMockConvertResultsResponse());

      await client.convert.batch
        .configure({
          files: ['/img.png'],
          toFormat: 'svg',
          preset: 'poster',
          mode: 'spline',
          detail: 50,
          reduceNoise: 4,
          textToPath: true,
          quality: 90,
        })
        .execute();

      const formData = fetchMock.mock.calls[0][1].body as FormData;
      expect(formData.get('toFormat')).toBe('svg');
      expect(formData.get('preset')).toBe('poster');
      expect(formData.get('mode')).toBe('spline');
      expect(formData.get('detail')).toBe('50');
      expect(formData.get('reduceNoise')).toBe('4');
      expect(formData.get('textToPath')).toBe('true');
      expect(formData.get('quality')).toBe('90');
    });

    it('returns properly shaped ConvertResultsResponse with multiple results', async () => {
      const client = createTestClient();
      mockFetchJsonResponse(
        createMockConvertResultsResponse({
          results: [
            { filename: 'a.png', success: true, url: 'https://x.com/a.svg', urlExpiresIn: '24h', format: 'svg' },
            { filename: 'b.jpg', success: true, url: 'https://x.com/b.svg', urlExpiresIn: '24h', format: 'svg' },
            { filename: 'c.png', success: false, error: 'Processing failed' },
          ],
          summary: { total: 3, successful: 2, failed: 1 },
        }),
      );

      const result = await client.convert.batch
        .configure({ files: ['/a.png', '/b.jpg', '/c.png'], toFormat: 'svg' })
        .execute();

      expect(result.results.length).toBe(3);
      expect(result.summary.total).toBe(3);
      expect(result.summary.successful).toBe(2);
      expect(result.summary.failed).toBe(1);
      expect(result.metadata).toBeDefined();
    });
  });

  // ==========================================================================
  // Validation
  // ==========================================================================

  describe('validation', () => {
    it('throws ValidationError when files is missing', async () => {
      const client = createTestClient();

      await expect(
        client.convert.batch
          .configure({ toFormat: 'svg' } as any)
          .execute(),
      ).rejects.toThrow(ValidationError);
    });

    it('throws ValidationError when files is empty array', async () => {
      const client = createTestClient();

      await expect(
        client.convert.batch
          .configure({ files: [], toFormat: 'svg' })
          .execute(),
      ).rejects.toThrow(ValidationError);
    });

    it('throws ValidationError when files exceeds 10', async () => {
      const client = createTestClient();

      await expect(
        client.convert.batch
          .configure({ files: Array(11).fill('/img.png'), toFormat: 'svg' })
          .execute(),
      ).rejects.toThrow(ValidationError);
    });

    it('throws ValidationError when toFormat is missing', async () => {
      const client = createTestClient();

      await expect(
        client.convert.batch
          .configure({ files: ['/img.png'] })
          .execute(),
      ).rejects.toThrow(ValidationError);
    });

    it('accepts boundary counts (1 file and 10 files)', async () => {
      const client = createTestClient();

      // Test with 1 file
      mockFetchJsonResponse(createMockConvertResultsResponse());
      const result1 = await client.convert.batch
        .configure({ files: ['/img.png'], toFormat: 'svg' })
        .execute();
      expect(result1).toBeDefined();

      // Test with 10 files
      mockFetchJsonResponse(createMockConvertResultsResponse());
      const result10 = await client.convert.batch
        .configure({ files: Array(10).fill('/img.png'), toFormat: 'svg' })
        .execute();
      expect(result10).toBeDefined();
    });
  });

  // ==========================================================================
  // Error Handling
  // ==========================================================================

  describe('error handling', () => {
    it('throws AuthError on INVALID_API_KEY', async () => {
      const client = createTestClient();
      const configured = client.convert.batch
        .configure({ files: ['/img.png'], toFormat: 'svg' });
      mockFetchErrorResponse('INVALID_API_KEY', 401);

      await expect(configured.execute()).rejects.toThrow(AuthError);
    });

    it('throws InsufficientCreditsError on INSUFFICIENT_CREDITS', async () => {
      const client = createTestClient();
      const configured = client.convert.batch
        .configure({ files: ['/img.png'], toFormat: 'svg' });
      mockFetchErrorResponse('INSUFFICIENT_CREDITS', 402);

      await expect(configured.execute()).rejects.toThrow(InsufficientCreditsError);
    });

    it('throws RateLimitError on RATE_LIMIT_EXCEEDED', async () => {
      const client = createTestClient();
      const configured = client.convert.batch
        .configure({ files: ['/img.png'], toFormat: 'svg' });
      mockFetchErrorResponse('RATE_LIMIT_EXCEEDED', 429);

      await expect(configured.execute()).rejects.toThrow(RateLimitError);
    });

    it('throws EndpointDisabledError on ENDPOINT_DISABLED', async () => {
      const client = createTestClient();
      const configured = client.convert.batch
        .configure({ files: ['/img.png'], toFormat: 'svg' });
      mockFetchErrorResponse('ENDPOINT_DISABLED', 503, 'This endpoint is disabled');

      await expect(configured.execute()).rejects.toThrow(EndpointDisabledError);
    });

    it('throws APIError on generic server error', async () => {
      const client = createTestClient();
      const configured = client.convert.batch
        .configure({ files: ['/img.png'], toFormat: 'svg' });
      mockFetchErrorResponse('INTERNAL_ERROR', 500, 'Something went wrong');

      await expect(configured.execute()).rejects.toThrow(APIError);
    });
  });
});
