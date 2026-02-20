import fs from 'fs';
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

describe('SvgToVectorClient', () => {
  let fetchMock: jest.Mock;
  let originalExistsSync: any;
  let originalReadFileSync: any;

  beforeEach(() => {
    fetchMock = setupFetchMock();

    originalExistsSync = fs.existsSync;
    originalReadFileSync = fs.readFileSync;
    fs.existsSync = jest.fn().mockReturnValue(true);
    fs.readFileSync = jest.fn().mockReturnValue(Buffer.from('fake-file-data'));
  });

  afterEach(() => {
    cleanupMocks();

    fs.existsSync = originalExistsSync;
    fs.readFileSync = originalReadFileSync;
  });

  // ==========================================================================
  // .configure()
  // ==========================================================================

  describe('.configure()', () => {
    it('returns a new instance (immutability)', () => {
      const client = createTestClient();
      const original = client.convert.svgToVector;
      const configured = original.configure({ file: '/img.svg', toFormat: 'PDF' });

      expect(configured).not.toBe(original);
    });

    it('merges params across multiple configure calls', async () => {
      const client = createTestClient();
      mockFetchJsonResponse(createMockConvertResultsResponse());

      const configured = client.convert.svgToVector
        .configure({ file: '/img.svg' })
        .configure({ toFormat: 'PDF' })
        .configure({ textToPath: true });

      await configured.execute();

      expect(fetchMock).toHaveBeenCalled();
      const [url] = fetchMock.mock.calls[0];
      expect(url).toContain('/v1/convert/svg-to-vector');
    });
  });

  // ==========================================================================
  // .execute()
  // ==========================================================================

  describe('.execute()', () => {
    it('sends POST to /v1/convert/svg-to-vector with FormData', async () => {
      const client = createTestClient();
      mockFetchJsonResponse(createMockConvertResultsResponse());

      await client.convert.svgToVector.configure({ file: '/img.svg', toFormat: 'PDF' }).execute();

      expect(fetchMock).toHaveBeenCalled();
      const [url, options] = fetchMock.mock.calls[0];
      expect(url).toContain('/v1/convert/svg-to-vector');
      expect(options.method).toBe('POST');
      expect(options.body).toBeInstanceOf(FormData);
    });

    it('sends API key in headers', async () => {
      const client = createTestClient();
      mockFetchJsonResponse(createMockConvertResultsResponse());

      await client.convert.svgToVector.configure({ file: '/img.svg', toFormat: 'PDF' }).execute();

      const [, options] = fetchMock.mock.calls[0];
      expect(options.headers['x-api-key']).toBe('test-api-key-123');
    });

    it('appends file, toFormat, and optional params to FormData', async () => {
      const client = createTestClient();
      mockFetchJsonResponse(createMockConvertResultsResponse());

      await client.convert.svgToVector
        .configure({
          file: '/img.svg',
          toFormat: 'DXF',
          textToPath: true,
          dxfVersion: 'R14',
        })
        .execute();

      const formData = fetchMock.mock.calls[0][1].body as FormData;
      expect(formData.get('file')).toBeTruthy();
      expect(formData.get('toFormat')).toBe('DXF');
      expect(formData.get('textToPath')).toBe('true');
      expect(formData.get('dxfVersion')).toBe('R14');
    });

    it('returns properly shaped ConvertResultsResponse', async () => {
      const client = createTestClient();
      const mockData = createMockConvertResultsResponse();
      mockFetchJsonResponse(mockData);

      const result = await client.convert.svgToVector
        .configure({ file: '/img.svg', toFormat: 'PDF' })
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
        client.convert.svgToVector.configure({ toFormat: 'PDF' } as any).execute()
      ).rejects.toThrow(ValidationError);
    });

    it('throws ValidationError when toFormat is missing', async () => {
      const client = createTestClient();
      mockFetchJsonResponse(createMockConvertResultsResponse());

      await expect(
        client.convert.svgToVector.configure({ file: '/img.svg' }).execute()
      ).rejects.toThrow(ValidationError);
    });

    it('throws ValidationError for invalid toFormat value', async () => {
      const client = createTestClient();
      mockFetchJsonResponse(createMockConvertResultsResponse());

      await expect(
        client.convert.svgToVector.configure({ file: '/img.svg', toFormat: 'BMP' as any }).execute()
      ).rejects.toThrow(ValidationError);
    });

    it('throws ValidationError for invalid dxfVersion', async () => {
      const client = createTestClient();
      mockFetchJsonResponse(createMockConvertResultsResponse());

      await expect(
        client.convert.svgToVector
          .configure({ file: '/img.svg', toFormat: 'DXF', dxfVersion: 'R15' as any })
          .execute()
      ).rejects.toThrow(ValidationError);
    });

    it('accepts all valid toFormat values', async () => {
      const validFormats = ['PDF', 'EPS', 'DXF', 'AI', 'PS'] as const;

      for (const toFormat of validFormats) {
        const client = createTestClient();
        mockFetchJsonResponse(createMockConvertResultsResponse());

        const result = await client.convert.svgToVector
          .configure({ file: '/img.svg', toFormat })
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
      const configured = client.convert.svgToVector.configure({
        file: '/img.svg',
        toFormat: 'PDF',
      });
      mockFetchErrorResponse('INVALID_API_KEY', 401);

      await expect(configured.execute()).rejects.toThrow(AuthError);
    });

    it('throws InsufficientCreditsError on INSUFFICIENT_CREDITS', async () => {
      const client = createTestClient();
      const configured = client.convert.svgToVector.configure({
        file: '/img.svg',
        toFormat: 'PDF',
      });
      mockFetchErrorResponse('INSUFFICIENT_CREDITS', 402);

      await expect(configured.execute()).rejects.toThrow(InsufficientCreditsError);
    });

    it('throws RateLimitError on RATE_LIMIT_EXCEEDED', async () => {
      const client = createTestClient();
      const configured = client.convert.svgToVector.configure({
        file: '/img.svg',
        toFormat: 'PDF',
      });
      mockFetchErrorResponse('RATE_LIMIT_EXCEEDED', 429);

      await expect(configured.execute()).rejects.toThrow(RateLimitError);
    });

    it('throws EndpointDisabledError on ENDPOINT_DISABLED', async () => {
      const client = createTestClient();
      const configured = client.convert.svgToVector.configure({
        file: '/img.svg',
        toFormat: 'PDF',
      });
      mockFetchErrorResponse('ENDPOINT_DISABLED', 503, 'This endpoint is disabled');

      await expect(configured.execute()).rejects.toThrow(EndpointDisabledError);
    });

    it('throws APIError on generic server error', async () => {
      const client = createTestClient();
      const configured = client.convert.svgToVector.configure({
        file: '/img.svg',
        toFormat: 'PDF',
      });
      mockFetchErrorResponse('INTERNAL_ERROR', 500, 'Something went wrong');

      await expect(configured.execute()).rejects.toThrow(APIError);
    });
  });
});
