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

describe('RasterToRasterClient', () => {
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
      const original = client.convert.rasterToRaster;
      const configured = original.configure({ file: '/img.png' });

      expect(configured).not.toBe(original);
    });

    it('merges params across multiple configure calls', async () => {
      const client = createTestClient();
      mockFetchJsonResponse(createMockConvertResultsResponse());

      const configured = client.convert.rasterToRaster
        .configure({ file: '/img.png' })
        .configure({ toFormat: 'WEBP' })
        .configure({ quality: 80 });

      await configured.execute();

      expect(fetchMock).toHaveBeenCalled();
      const [url] = fetchMock.mock.calls[0];
      expect(url).toContain('/v1/convert/raster-to-raster');
    });
  });

  // ==========================================================================
  // .execute()
  // ==========================================================================

  describe('.execute()', () => {
    it('sends POST to /v1/convert/raster-to-raster with FormData', async () => {
      const client = createTestClient();
      mockFetchJsonResponse(createMockConvertResultsResponse());

      await client.convert.rasterToRaster
        .configure({ file: '/img.png', toFormat: 'PNG' })
        .execute();

      expect(fetchMock).toHaveBeenCalled();
      const [url, options] = fetchMock.mock.calls[0];
      expect(url).toContain('/v1/convert/raster-to-raster');
      expect(options.method).toBe('POST');
      expect(options.body).toBeInstanceOf(FormData);
    });

    it('sends API key in headers', async () => {
      const client = createTestClient();
      mockFetchJsonResponse(createMockConvertResultsResponse());

      await client.convert.rasterToRaster
        .configure({ file: '/img.png', toFormat: 'PNG' })
        .execute();

      const [, options] = fetchMock.mock.calls[0];
      expect(options.headers['x-api-key']).toBe('test-api-key-123');
    });

    it('appends file, toFormat, and optional params to FormData', async () => {
      const client = createTestClient();
      mockFetchJsonResponse(createMockConvertResultsResponse());

      await client.convert.rasterToRaster
        .configure({
          file: '/img.png',
          toFormat: 'WEBP',
          quality: 85,
          width: 1024,
          height: 768,
        })
        .execute();

      const formData = fetchMock.mock.calls[0][1].body as FormData;
      expect(formData.get('file')).toBeTruthy();
      expect(formData.get('toFormat')).toBe('WEBP');
      expect(formData.get('quality')).toBe('85');
      expect(formData.get('width')).toBe('1024');
      expect(formData.get('height')).toBe('768');
    });

    it('returns properly shaped ConvertResultsResponse', async () => {
      const client = createTestClient();
      const mockData = createMockConvertResultsResponse();
      mockFetchJsonResponse(mockData);

      const result = await client.convert.rasterToRaster
        .configure({ file: '/img.png', toFormat: 'PNG' })
        .execute();

      expect(Array.isArray(result.results)).toBe(true);
      expect(result.summary.total).toBe(1);
      expect(result.summary.successful).toBe(1);
      expect(result.summary.failed).toBe(0);
      expect(result.metadata).toBeDefined();
    });
  });

  // ==========================================================================
  // Validation
  // ==========================================================================

  describe('validation', () => {
    it('throws ValidationError when file is missing', async () => {
      const client = createTestClient();

      await expect(
        client.convert.rasterToRaster
          .configure({ toFormat: 'PNG' } as any)
          .execute(),
      ).rejects.toThrow(ValidationError);
    });

    it('throws ValidationError when toFormat is missing', async () => {
      const client = createTestClient();

      await expect(
        client.convert.rasterToRaster
          .configure({ file: '/img.png' })
          .execute(),
      ).rejects.toThrow(ValidationError);
    });

    it('throws ValidationError for invalid toFormat value', async () => {
      const client = createTestClient();

      await expect(
        client.convert.rasterToRaster
          .configure({ file: '/img.png', toFormat: 'SVG' as any })
          .execute(),
      ).rejects.toThrow(ValidationError);
    });

    it('throws ValidationError when quality < 1', async () => {
      const client = createTestClient();

      await expect(
        client.convert.rasterToRaster
          .configure({ file: '/img.png', toFormat: 'PNG', quality: 0 })
          .execute(),
      ).rejects.toThrow(ValidationError);
    });

    it('throws ValidationError when quality > 100', async () => {
      const client = createTestClient();

      await expect(
        client.convert.rasterToRaster
          .configure({ file: '/img.png', toFormat: 'PNG', quality: 101 })
          .execute(),
      ).rejects.toThrow(ValidationError);
    });

    it('throws ValidationError when width is non-positive', async () => {
      const client = createTestClient();

      await expect(
        client.convert.rasterToRaster
          .configure({ file: '/img.png', toFormat: 'PNG', width: 0 })
          .execute(),
      ).rejects.toThrow(ValidationError);
    });

    it('throws ValidationError when height is negative', async () => {
      const client = createTestClient();

      await expect(
        client.convert.rasterToRaster
          .configure({ file: '/img.png', toFormat: 'PNG', height: -10 })
          .execute(),
      ).rejects.toThrow(ValidationError);
    });

    it('accepts all valid toFormat values', async () => {
      const client = createTestClient();

      for (const toFormat of ['PNG', 'JPG', 'WEBP', 'TIFF', 'GIF', 'AVIF'] as const) {
        mockFetchJsonResponse(createMockConvertResultsResponse());
        const result = await client.convert.rasterToRaster
          .configure({ file: '/img.png', toFormat })
          .execute();
        expect(result).toBeDefined();
      }
    });
  });

  // ==========================================================================
  // Error Handling
  // ==========================================================================

  describe('error handling', () => {
    it('throws AuthError on INVALID_API_KEY', async () => {
      const client = createTestClient();
      const configured = client.convert.rasterToRaster
        .configure({ file: '/img.png', toFormat: 'PNG' });
      mockFetchErrorResponse('INVALID_API_KEY', 401);

      await expect(configured.execute()).rejects.toThrow(AuthError);
    });

    it('throws InsufficientCreditsError on INSUFFICIENT_CREDITS', async () => {
      const client = createTestClient();
      const configured = client.convert.rasterToRaster
        .configure({ file: '/img.png', toFormat: 'PNG' });
      mockFetchErrorResponse('INSUFFICIENT_CREDITS', 402);

      await expect(configured.execute()).rejects.toThrow(InsufficientCreditsError);
    });

    it('throws RateLimitError on RATE_LIMIT_EXCEEDED', async () => {
      const client = createTestClient();
      const configured = client.convert.rasterToRaster
        .configure({ file: '/img.png', toFormat: 'PNG' });
      mockFetchErrorResponse('RATE_LIMIT_EXCEEDED', 429);

      await expect(configured.execute()).rejects.toThrow(RateLimitError);
    });

    it('throws EndpointDisabledError on ENDPOINT_DISABLED', async () => {
      const client = createTestClient();
      const configured = client.convert.rasterToRaster
        .configure({ file: '/img.png', toFormat: 'PNG' });
      mockFetchErrorResponse('ENDPOINT_DISABLED', 503, 'This endpoint is disabled');

      await expect(configured.execute()).rejects.toThrow(EndpointDisabledError);
    });

    it('throws APIError on generic server error', async () => {
      const client = createTestClient();
      const configured = client.convert.rasterToRaster
        .configure({ file: '/img.png', toFormat: 'PNG' });
      mockFetchErrorResponse('INTERNAL_ERROR', 500, 'Something went wrong');

      await expect(configured.execute()).rejects.toThrow(APIError);
    });
  });
});
