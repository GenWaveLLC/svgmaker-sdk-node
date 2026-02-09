import {
  createTestClient,
  setupFetchMock,
  cleanupMocks,
  mockFetchJsonResponse,
  mockFetchErrorResponse,
  createMockGenerationsListData,
  createMockGenerationData,
  createMockGenerationDownloadData,
} from '../setup';
import {
  ValidationError,
  RateLimitError,
  APIError,
} from '../../src/errors/CustomErrors';

describe('GalleryClient', () => {
  let fetchMock: jest.Mock;

  beforeEach(() => {
    fetchMock = setupFetchMock();
  });

  afterEach(() => {
    cleanupMocks();
  });

  // ==========================================================================
  // .list()
  // ==========================================================================

  describe('.list()', () => {
    it('sends GET to /v1/gallery with no query params when called with no args', async () => {
      const client = createTestClient();
      mockFetchJsonResponse(createMockGenerationsListData());

      await client.gallery.list();

      expect(fetchMock).toHaveBeenCalled();
      const [url, options] = fetchMock.mock.calls[0];
      expect(url).toContain('/v1/gallery');
      expect(url).not.toContain('?');
      expect(options.method).toBe('GET');
    });

    it('sends API key in x-api-key header', async () => {
      const client = createTestClient();
      mockFetchJsonResponse(createMockGenerationsListData());

      await client.gallery.list();

      const [, options] = fetchMock.mock.calls[0];
      expect(options.headers['x-api-key']).toBe('test-api-key-123');
    });

    it('appends page and limit as query params', async () => {
      const client = createTestClient();
      mockFetchJsonResponse(createMockGenerationsListData());

      await client.gallery.list({ page: 2, limit: 25 });

      const [url] = fetchMock.mock.calls[0];
      expect(url).toContain('page=2');
      expect(url).toContain('limit=25');
    });

    it('handles array params (type, hashtags, categories)', async () => {
      const client = createTestClient();
      mockFetchJsonResponse(createMockGenerationsListData());

      await client.gallery.list({
        type: ['generate', 'edit'],
        hashtags: ['nature', 'art'],
        categories: ['landscape'],
      });

      const [url] = fetchMock.mock.calls[0];
      expect(url).toContain('type=generate');
      expect(url).toContain('type=edit');
      expect(url).toContain('hashtags=nature');
      expect(url).toContain('hashtags=art');
      expect(url).toContain('categories=landscape');
    });

    it('appends query, pro, and gold params', async () => {
      const client = createTestClient();
      mockFetchJsonResponse(createMockGenerationsListData());

      await client.gallery.list({ query: 'mountain', pro: 'true', gold: 'true' });

      const [url] = fetchMock.mock.calls[0];
      expect(url).toContain('query=mountain');
      expect(url).toContain('pro=true');
      expect(url).toContain('gold=true');
    });

    it('returns properly shaped GalleryListResponse', async () => {
      const client = createTestClient();
      const mockData = createMockGenerationsListData();
      mockFetchJsonResponse(mockData);

      const result = await client.gallery.list();

      expect(result.items).toEqual(mockData.items);
      expect(result.pagination).toEqual(mockData.pagination);
      expect(result.metadata).toBeDefined();
    });
  });

  // ==========================================================================
  // .list() validation
  // ==========================================================================

  describe('.list() validation', () => {
    it('throws ValidationError when page is 0', async () => {
      const client = createTestClient();

      await expect(
        client.gallery.list({ page: 0 }),
      ).rejects.toThrow(ValidationError);
    });

    it('throws ValidationError when limit exceeds 100', async () => {
      const client = createTestClient();

      await expect(
        client.gallery.list({ limit: 101 }),
      ).rejects.toThrow(ValidationError);
    });

    it('throws ValidationError on unknown property due to .strict()', async () => {
      const client = createTestClient();

      await expect(
        client.gallery.list({ foo: 'bar' } as any),
      ).rejects.toThrow(ValidationError);
    });
  });

  // ==========================================================================
  // .get(id)
  // ==========================================================================

  describe('.get(id)', () => {
    it('sends GET to /v1/gallery/{id}', async () => {
      const client = createTestClient();
      mockFetchJsonResponse(createMockGenerationData());

      await client.gallery.get('gallery-001');

      expect(fetchMock).toHaveBeenCalled();
      const [url, options] = fetchMock.mock.calls[0];
      expect(url).toContain('/v1/gallery/gallery-001');
      expect(options.method).toBe('GET');
    });

    it('returns properly shaped GalleryItemResponse', async () => {
      const client = createTestClient();
      const mockData = createMockGenerationData();
      mockFetchJsonResponse(mockData);

      const result = await client.gallery.get('gallery-001');

      expect(result.id).toBe(mockData.id);
      expect(result.prompt).toBe(mockData.prompt);
      expect(result.type).toBe(mockData.type);
      expect(result.quality).toBe(mockData.quality);
      expect(result.isPublic).toBe(mockData.isPublic);
      expect(result.metadata).toBeDefined();
    });
  });

  // ==========================================================================
  // .get(id) validation
  // ==========================================================================

  describe('.get(id) validation', () => {
    it('throws ValidationError when id is empty string', async () => {
      const client = createTestClient();

      await expect(
        client.gallery.get(''),
      ).rejects.toThrow(ValidationError);
    });
  });

  // ==========================================================================
  // .download(id, params?)
  // ==========================================================================

  describe('.download(id, params?)', () => {
    it('sends GET to /v1/gallery/{id}/download with no query params by default', async () => {
      const client = createTestClient();
      mockFetchJsonResponse(createMockGenerationDownloadData());

      await client.gallery.download('gallery-001');

      expect(fetchMock).toHaveBeenCalled();
      const [url, options] = fetchMock.mock.calls[0];
      expect(url).toContain('/v1/gallery/gallery-001/download');
      expect(options.method).toBe('GET');
    });

    it('appends format and optimize as query params', async () => {
      const client = createTestClient();
      mockFetchJsonResponse(createMockGenerationDownloadData());

      await client.gallery.download('gallery-001', { format: 'png', optimize: true });

      const [url] = fetchMock.mock.calls[0];
      expect(url).toContain('format=png');
      expect(url).toContain('optimize=true');
    });

    it('returns properly shaped GalleryDownloadResponse', async () => {
      const client = createTestClient();
      const mockData = createMockGenerationDownloadData();
      mockFetchJsonResponse(mockData);

      const result = await client.gallery.download('gallery-001');

      expect(result.id).toBe(mockData.id);
      expect(result.url).toBe(mockData.url);
      expect(result.urlExpiresIn).toBe(mockData.urlExpiresIn);
      expect(result.format).toBe(mockData.format);
      expect(result.filename).toBe(mockData.filename);
      expect(result.metadata).toBeDefined();
    });
  });

  // ==========================================================================
  // .download() validation
  // ==========================================================================

  describe('.download() validation', () => {
    it('throws ValidationError when id is empty string', async () => {
      const client = createTestClient();

      await expect(
        client.gallery.download(''),
      ).rejects.toThrow(ValidationError);
    });
  });

  // ==========================================================================
  // Error Handling
  // ==========================================================================

  describe('error handling', () => {
    // Note: GalleryClient methods use handleRequest() which goes through
    // the retry wrapper. Non-retryable errors (AuthError, InsufficientCreditsError,
    // EndpointDisabledError) are wrapped in AbortError by the retry utility.
    // Retryable status codes (429, 500) are re-thrown as-is after exhausting retries.

    it('throws on INVALID_API_KEY (401)', async () => {
      const client = createTestClient();
      mockFetchErrorResponse('INVALID_API_KEY', 401, 'Invalid API key');

      await expect(
        client.gallery.list(),
      ).rejects.toThrow('Invalid API key');
    });

    it('throws on INSUFFICIENT_CREDITS (402)', async () => {
      const client = createTestClient();
      mockFetchErrorResponse('INSUFFICIENT_CREDITS', 402, 'Not enough credits');

      await expect(
        client.gallery.list(),
      ).rejects.toThrow('Not enough credits');
    });

    it('throws RateLimitError on RATE_LIMIT_EXCEEDED (429)', async () => {
      const client = createTestClient();
      mockFetchErrorResponse('RATE_LIMIT_EXCEEDED', 429);

      await expect(
        client.gallery.list(),
      ).rejects.toThrow(RateLimitError);
    });

    it('throws on ENDPOINT_DISABLED (503)', async () => {
      const client = createTestClient();
      mockFetchErrorResponse('ENDPOINT_DISABLED', 503, 'This endpoint is disabled');

      await expect(
        client.gallery.list(),
      ).rejects.toThrow('This endpoint is disabled');
    });

    it('throws APIError on generic server error (500)', async () => {
      const client = createTestClient();
      mockFetchErrorResponse('SERVER_ERROR', 500, 'Internal server error');

      await expect(
        client.gallery.list(),
      ).rejects.toThrow(APIError);
    });
  });
});
