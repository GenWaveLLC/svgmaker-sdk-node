import {
  createTestClient,
  setupFetchMock,
  cleanupMocks,
  mockFetchJsonResponse,
  mockFetchErrorResponse,
  createMockOptimizeSvgResponse,
} from '../setup';
import {
  ValidationError,
  AuthError,
  InsufficientCreditsError,
  RateLimitError,
  EndpointDisabledError,
  APIError,
} from '../../src/errors/CustomErrors';

describe('OptimizeSvgClient', () => {
  let fetchMock: jest.Mock;
  let originalExistsSync: any;
  let originalReadFileSync: any;

  beforeEach(() => {
    fetchMock = setupFetchMock();
    const fs = require('fs');
    originalExistsSync = fs.existsSync;
    originalReadFileSync = fs.readFileSync;
    fs.existsSync = jest.fn().mockReturnValue(true);
    fs.readFileSync = jest.fn().mockReturnValue(Buffer.from('fake-svg-data'));
  });

  afterEach(() => {
    cleanupMocks();
    const fs = require('fs');
    fs.existsSync = originalExistsSync;
    fs.readFileSync = originalReadFileSync;
  });

  // .configure() - 2 tests
  describe('.configure()', () => {
    it('returns a new instance (immutability)', () => {
      const client = createTestClient();
      const original = client.optimizeSvg;
      const configured = original.configure({ file: '/test.svg' });
      expect(configured).not.toBe(original);
    });

    it('merges params across multiple configure calls', async () => {
      const client = createTestClient();
      mockFetchJsonResponse(createMockOptimizeSvgResponse());
      const configured = client.optimizeSvg
        .configure({ file: '/test.svg' })
        .configure({ compress: true });
      await configured.execute();
      expect(fetchMock).toHaveBeenCalled();
      const [url] = fetchMock.mock.calls[0];
      expect(url).toContain('/v1/svg/optimize');
    });
  });

  // .execute() - 4 tests
  describe('.execute()', () => {
    it('sends POST to /v1/svg/optimize with FormData', async () => {
      const client = createTestClient();
      mockFetchJsonResponse(createMockOptimizeSvgResponse());
      await client.optimizeSvg.configure({ file: '/test.svg' }).execute();
      const [url, options] = fetchMock.mock.calls[0];
      expect(url).toContain('/v1/svg/optimize');
      expect(options.method).toBe('POST');
      expect(options.body).toBeInstanceOf(FormData);
    });

    it('sends API key in headers', async () => {
      const client = createTestClient();
      mockFetchJsonResponse(createMockOptimizeSvgResponse());
      await client.optimizeSvg.configure({ file: '/test.svg' }).execute();
      const [, options] = fetchMock.mock.calls[0];
      expect(options.headers['x-api-key']).toBe('test-api-key-123');
    });

    it('appends file and optional compress param to FormData', async () => {
      const client = createTestClient();
      mockFetchJsonResponse(createMockOptimizeSvgResponse());
      await client.optimizeSvg
        .configure({ file: '/test.svg', compress: true })
        .execute();
      const formData = fetchMock.mock.calls[0][1].body as FormData;
      expect(formData.get('file')).toBeTruthy();
      expect(formData.get('compress')).toBe('true');
    });

    it('returns properly shaped OptimizeSvgResponse', async () => {
      const client = createTestClient();
      const mockData = createMockOptimizeSvgResponse();
      mockFetchJsonResponse(mockData);
      const result = await client.optimizeSvg
        .configure({ file: '/test.svg' })
        .execute();
      expect(result.svgUrl).toBe(mockData.svgUrl);
      expect(result.svgUrlExpiresIn).toBe(mockData.svgUrlExpiresIn);
      expect(result.metadata).toBeDefined();
    });
  });

  // validation - 2 tests
  describe('validation', () => {
    it('throws ValidationError when file is missing', async () => {
      const client = createTestClient();
      mockFetchJsonResponse(createMockOptimizeSvgResponse());
      await expect(client.optimizeSvg.execute()).rejects.toThrow(ValidationError);
    });

    it('throws ValidationError when file path does not exist', async () => {
      const client = createTestClient();
      mockFetchJsonResponse(createMockOptimizeSvgResponse());
      const fs = require('fs');
      fs.existsSync = jest.fn().mockReturnValue(false);
      await expect(
        client.optimizeSvg.configure({ file: '/nonexistent.svg' }).execute(),
      ).rejects.toThrow(ValidationError);
    });
  });

  // error handling - 5 tests
  describe('error handling', () => {
    it('throws AuthError on INVALID_API_KEY', async () => {
      const client = createTestClient();
      mockFetchErrorResponse('INVALID_API_KEY', 401);
      await expect(
        client.optimizeSvg.configure({ file: '/test.svg' }).execute(),
      ).rejects.toThrow(AuthError);
    });

    it('throws InsufficientCreditsError on INSUFFICIENT_CREDITS', async () => {
      const client = createTestClient();
      mockFetchErrorResponse('INSUFFICIENT_CREDITS', 402);
      await expect(
        client.optimizeSvg.configure({ file: '/test.svg' }).execute(),
      ).rejects.toThrow(InsufficientCreditsError);
    });

    it('throws RateLimitError on RATE_LIMIT_EXCEEDED', async () => {
      const client = createTestClient();
      mockFetchErrorResponse('RATE_LIMIT_EXCEEDED', 429);
      await expect(
        client.optimizeSvg.configure({ file: '/test.svg' }).execute(),
      ).rejects.toThrow(RateLimitError);
    });

    it('throws EndpointDisabledError on ENDPOINT_DISABLED', async () => {
      const client = createTestClient();
      mockFetchErrorResponse('ENDPOINT_DISABLED', 503);
      await expect(
        client.optimizeSvg.configure({ file: '/test.svg' }).execute(),
      ).rejects.toThrow(EndpointDisabledError);
    });

    it('throws APIError on generic server error', async () => {
      const client = createTestClient();
      mockFetchErrorResponse('INTERNAL_ERROR', 500);
      await expect(
        client.optimizeSvg.configure({ file: '/test.svg' }).execute(),
      ).rejects.toThrow(APIError);
    });
  });
});
