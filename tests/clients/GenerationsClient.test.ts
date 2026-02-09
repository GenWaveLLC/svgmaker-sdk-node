import {
  createTestClient,
  setupFetchMock,
  cleanupMocks,
  mockFetchJsonResponse,
  mockFetchErrorResponse,
  createMockGenerationsListData,
  createMockGenerationData,
  createMockGenerationDeleteData,
  createMockGenerationShareData,
  createMockGenerationDownloadData,
} from '../setup';
import {
  ValidationError,
  RateLimitError,
  APIError,
} from '../../src/errors/CustomErrors';

describe('GenerationsClient', () => {
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
    it('sends GET to /v1/generations with no query params when called with no args', async () => {
      const client = createTestClient();
      mockFetchJsonResponse(createMockGenerationsListData());

      await client.generations.list();

      expect(fetchMock).toHaveBeenCalled();
      const [url, options] = fetchMock.mock.calls[0];
      expect(url).toContain('/v1/generations');
      expect(url).not.toContain('?');
      expect(options.method).toBe('GET');
    });

    it('sends API key in x-api-key header', async () => {
      const client = createTestClient();
      mockFetchJsonResponse(createMockGenerationsListData());

      await client.generations.list();

      const [, options] = fetchMock.mock.calls[0];
      expect(options.headers['x-api-key']).toBe('test-api-key-123');
    });

    it('appends page and limit as query params', async () => {
      const client = createTestClient();
      mockFetchJsonResponse(createMockGenerationsListData());

      await client.generations.list({ page: 2, limit: 25 });

      const [url] = fetchMock.mock.calls[0];
      expect(url).toContain('page=2');
      expect(url).toContain('limit=25');
    });

    it('handles array params (type, hashtags, categories)', async () => {
      const client = createTestClient();
      mockFetchJsonResponse(createMockGenerationsListData());

      await client.generations.list({
        type: ['generate', 'edit'],
        hashtags: ['nature', 'art'],
        categories: ['landscape'],
      });

      const [url] = fetchMock.mock.calls[0];
      // Arrays should be repeated as separate params: type=generate&type=edit
      expect(url).toContain('type=generate');
      expect(url).toContain('type=edit');
      expect(url).toContain('hashtags=nature');
      expect(url).toContain('hashtags=art');
      expect(url).toContain('categories=landscape');
    });

    it('appends query search param', async () => {
      const client = createTestClient();
      mockFetchJsonResponse(createMockGenerationsListData());

      await client.generations.list({ query: 'mountain' });

      const [url] = fetchMock.mock.calls[0];
      expect(url).toContain('query=mountain');
    });

    it('returns properly shaped response (items, pagination, metadata)', async () => {
      const client = createTestClient();
      const mockData = createMockGenerationsListData();
      mockFetchJsonResponse(mockData);

      const result = await client.generations.list();

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
      mockFetchJsonResponse(createMockGenerationsListData());

      await expect(
        client.generations.list({ page: 0 }),
      ).rejects.toThrow(ValidationError);
    });

    it('throws ValidationError when limit exceeds 100', async () => {
      const client = createTestClient();
      mockFetchJsonResponse(createMockGenerationsListData());

      await expect(
        client.generations.list({ limit: 101 }),
      ).rejects.toThrow(ValidationError);
    });

    it('throws ValidationError on unknown property due to .strict()', async () => {
      const client = createTestClient();
      mockFetchJsonResponse(createMockGenerationsListData());

      await expect(
        client.generations.list({ foo: 'bar' } as any),
      ).rejects.toThrow(ValidationError);
    });
  });

  // ==========================================================================
  // .get(id)
  // ==========================================================================

  describe('.get(id)', () => {
    it('sends GET to /v1/generations/{id}', async () => {
      const client = createTestClient();
      mockFetchJsonResponse(createMockGenerationData());

      await client.generations.get('gen-001');

      expect(fetchMock).toHaveBeenCalled();
      const [url, options] = fetchMock.mock.calls[0];
      expect(url).toContain('/v1/generations/gen-001');
      expect(options.method).toBe('GET');
    });

    it('URL-encodes the id', async () => {
      const client = createTestClient();
      mockFetchJsonResponse(createMockGenerationData());

      await client.generations.get('id/with/slashes');

      const [url] = fetchMock.mock.calls[0];
      expect(url).toContain('/v1/generations/id%2Fwith%2Fslashes');
    });

    it('returns properly shaped GenerationResponse', async () => {
      const client = createTestClient();
      const mockData = createMockGenerationData();
      mockFetchJsonResponse(mockData);

      const result = await client.generations.get('gen-001');

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
      mockFetchJsonResponse(createMockGenerationData());

      await expect(
        client.generations.get(''),
      ).rejects.toThrow(ValidationError);
    });
  });

  // ==========================================================================
  // .delete(id)
  // ==========================================================================

  describe('.delete(id)', () => {
    it('sends DELETE to /v1/generations/{id}', async () => {
      const client = createTestClient();
      mockFetchJsonResponse(createMockGenerationDeleteData());

      await client.generations.delete('gen-001');

      expect(fetchMock).toHaveBeenCalled();
      const [url, options] = fetchMock.mock.calls[0];
      expect(url).toContain('/v1/generations/gen-001');
      expect(options.method).toBe('DELETE');
    });

    it('returns properly shaped GenerationDeleteResponse', async () => {
      const client = createTestClient();
      const mockData = createMockGenerationDeleteData();
      mockFetchJsonResponse(mockData);

      const result = await client.generations.delete('gen-001');

      expect(result.message).toBe(mockData.message);
      expect(result.metadata).toBeDefined();
    });
  });

  // ==========================================================================
  // .delete(id) validation
  // ==========================================================================

  describe('.delete(id) validation', () => {
    it('throws ValidationError when id is empty string', async () => {
      const client = createTestClient();
      mockFetchJsonResponse(createMockGenerationDeleteData());

      await expect(
        client.generations.delete(''),
      ).rejects.toThrow(ValidationError);
    });
  });

  // ==========================================================================
  // .share(id)
  // ==========================================================================

  describe('.share(id)', () => {
    it('sends POST to /v1/generations/{id}/share', async () => {
      const client = createTestClient();
      mockFetchJsonResponse(createMockGenerationShareData());

      await client.generations.share('gen-001');

      expect(fetchMock).toHaveBeenCalled();
      const [url, options] = fetchMock.mock.calls[0];
      expect(url).toContain('/v1/generations/gen-001/share');
      expect(options.method).toBe('POST');
    });

    it('returns properly shaped GenerationShareResponse', async () => {
      const client = createTestClient();
      const mockData = createMockGenerationShareData();
      mockFetchJsonResponse(mockData);

      const result = await client.generations.share('gen-001');

      expect(result.message).toBe(mockData.message);
      expect(result.isPublic).toBe(mockData.isPublic);
      expect(result.shareUrl).toBe(mockData.shareUrl);
      expect(result.metadata).toBeDefined();
    });
  });

  // ==========================================================================
  // .share(id) validation
  // ==========================================================================

  describe('.share(id) validation', () => {
    it('throws ValidationError when id is empty string', async () => {
      const client = createTestClient();
      mockFetchJsonResponse(createMockGenerationShareData());

      await expect(
        client.generations.share(''),
      ).rejects.toThrow(ValidationError);
    });
  });

  // ==========================================================================
  // .download(id, params?)
  // ==========================================================================

  describe('.download(id, params?)', () => {
    it('sends GET to /v1/generations/{id}/download with no query params by default', async () => {
      const client = createTestClient();
      mockFetchJsonResponse(createMockGenerationDownloadData());

      await client.generations.download('gen-001');

      expect(fetchMock).toHaveBeenCalled();
      const [url, options] = fetchMock.mock.calls[0];
      expect(url).toContain('/v1/generations/gen-001/download');
      expect(url).not.toContain('format=');
      expect(url).not.toContain('optimize=');
      expect(options.method).toBe('GET');
    });

    it('appends format and optimize as query params', async () => {
      const client = createTestClient();
      mockFetchJsonResponse(createMockGenerationDownloadData());

      await client.generations.download('gen-001', { format: 'png', optimize: true });

      const [url] = fetchMock.mock.calls[0];
      expect(url).toContain('format=png');
      expect(url).toContain('optimize=true');
    });

    it('returns properly shaped GenerationDownloadResponse', async () => {
      const client = createTestClient();
      const mockData = createMockGenerationDownloadData();
      mockFetchJsonResponse(mockData);

      const result = await client.generations.download('gen-001');

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
      mockFetchJsonResponse(createMockGenerationDownloadData());

      await expect(
        client.generations.download(''),
      ).rejects.toThrow(ValidationError);
    });
  });

  // ==========================================================================
  // Error handling (using .list() as representative)
  // ==========================================================================

  describe('error handling', () => {
    it('throws "Invalid API key" on INVALID_API_KEY (401)', async () => {
      const client = createTestClient();
      mockFetchErrorResponse('INVALID_API_KEY', 401, 'Invalid API key');

      await expect(
        client.generations.list(),
      ).rejects.toThrow('Invalid API key');
    });

    it('throws "Not enough credits" on INSUFFICIENT_CREDITS (402)', async () => {
      const client = createTestClient();
      mockFetchErrorResponse('INSUFFICIENT_CREDITS', 402, 'Not enough credits');

      await expect(
        client.generations.list(),
      ).rejects.toThrow('Not enough credits');
    });

    it('throws RateLimitError on RATE_LIMIT_EXCEEDED (429)', async () => {
      const client = createTestClient();
      mockFetchErrorResponse('RATE_LIMIT_EXCEEDED', 429);

      await expect(
        client.generations.list(),
      ).rejects.toThrow(RateLimitError);
    });

    it('throws "This endpoint is disabled" on ENDPOINT_DISABLED (503)', async () => {
      const client = createTestClient();
      mockFetchErrorResponse('ENDPOINT_DISABLED', 503, 'This endpoint is disabled');

      await expect(
        client.generations.list(),
      ).rejects.toThrow('This endpoint is disabled');
    });

    it('throws APIError on generic server error (500)', async () => {
      const client = createTestClient();
      mockFetchErrorResponse('SERVER_ERROR', 500, 'Internal server error');

      await expect(
        client.generations.list(),
      ).rejects.toThrow(APIError);
    });
  });
});
