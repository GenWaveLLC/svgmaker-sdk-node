import fs from 'fs';
import { Readable } from 'stream';
import {
  createTestClient,
  setupFetchMock,
  cleanupMocks,
  mockFetchJsonResponse,
  mockFetchErrorResponse,
  mockFetchStreamResponse,
  createMockAiVectorizeResponse,
  createMockAiVectorizeStreamEvents,
} from '../../setup';
import {
  ValidationError,
  AuthError,
  InsufficientCreditsError,
  RateLimitError,
  EndpointDisabledError,
  APIError,
} from '../../../src/errors/CustomErrors';

describe('AIVectorizeClient', () => {
  let fetchMock: jest.Mock;
  const testFileBuffer = Buffer.from('fake-png-image-data');

  beforeEach(() => {
    fetchMock = setupFetchMock();
  });

  afterEach(() => {
    cleanupMocks();
  });

  // ==========================================================================
  // .configure()
  // ==========================================================================

  describe('.configure()', () => {
    it('returns a new instance (immutability)', () => {
      const client = createTestClient();
      const original = client.convert.aiVectorize;
      const configured = original.configure({ file: testFileBuffer });

      expect(configured).not.toBe(original);
    });

    it('merges params across multiple configure calls', async () => {
      const client = createTestClient();
      mockFetchJsonResponse(createMockAiVectorizeResponse());

      const configured = client.convert.aiVectorize
        .configure({ file: testFileBuffer })
        .configure({ svgText: true });

      await configured.execute();

      expect(fetchMock).toHaveBeenCalled();
      const [url] = fetchMock.mock.calls[0];
      expect(url).toContain('/v1/convert/ai-vectorize');
    });
  });

  // ==========================================================================
  // .execute()
  // ==========================================================================

  describe('.execute()', () => {
    it('sends POST to /v1/convert/ai-vectorize with FormData', async () => {
      const client = createTestClient();
      mockFetchJsonResponse(createMockAiVectorizeResponse());

      await client.convert.aiVectorize.configure({ file: testFileBuffer }).execute();

      const [url, options] = fetchMock.mock.calls[0];
      expect(url).toContain('/v1/convert/ai-vectorize');
      expect(options.method).toBe('POST');
      expect(options.body).toBeInstanceOf(FormData);
    });

    it('sends API key in headers', async () => {
      const client = createTestClient();
      mockFetchJsonResponse(createMockAiVectorizeResponse());

      await client.convert.aiVectorize.configure({ file: testFileBuffer }).execute();

      const [, options] = fetchMock.mock.calls[0];
      expect(options.headers['x-api-key']).toBe('test-api-key-123');
    });

    it('appends file as Blob to FormData (Buffer input)', async () => {
      const client = createTestClient();
      mockFetchJsonResponse(createMockAiVectorizeResponse());

      await client.convert.aiVectorize.configure({ file: testFileBuffer }).execute();

      const formData = fetchMock.mock.calls[0][1].body as FormData;
      expect(formData.get('file')).toBeTruthy();
    });

    it('appends optional params (storage, svgText) to FormData', async () => {
      const client = createTestClient();
      mockFetchJsonResponse(createMockAiVectorizeResponse());

      await client.convert.aiVectorize
        .configure({ file: testFileBuffer, storage: true, svgText: true })
        .execute();

      const formData = fetchMock.mock.calls[0][1].body as FormData;
      expect(formData.get('storage')).toBe('true');
      expect(formData.get('svgText')).toBe('true');
    });

    it('returns properly shaped AiVectorizeResponse', async () => {
      const client = createTestClient();
      const mockData = createMockAiVectorizeResponse();
      mockFetchJsonResponse(mockData);

      const result = await client.convert.aiVectorize.configure({ file: testFileBuffer }).execute();

      expect(result.svgUrl).toBe(mockData.svgUrl);
      expect(result.creditCost).toBe(mockData.creditCost);
      expect(result.message).toBe(mockData.message);
      expect(result.generationId).toBe(mockData.generationId);
      expect(result.metadata).toBeDefined();
    });

    it('decodes raw SVG svgText via decodeSvgContent()', async () => {
      const client = createTestClient();
      const rawSvg =
        '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><rect width="10" height="10"/></svg>';
      mockFetchJsonResponse(createMockAiVectorizeResponse({ svgText: rawSvg }));

      const result = await client.convert.aiVectorize
        .configure({ file: testFileBuffer, svgText: true })
        .execute();

      expect(result.svgText).toBe(rawSvg);
    });

    it('accepts file as string path', async () => {
      const client = createTestClient();
      mockFetchJsonResponse(createMockAiVectorizeResponse());

      const originalExistsSync = fs.existsSync;
      const originalReadFileSync = fs.readFileSync;
      fs.existsSync = jest.fn().mockReturnValue(true);
      fs.readFileSync = jest.fn().mockReturnValue(Buffer.from('fake-png-data'));

      try {
        await client.convert.aiVectorize.configure({ file: '/path/to/image.png' }).execute();

        expect(fs.existsSync).toHaveBeenCalledWith('/path/to/image.png');
        expect(fs.readFileSync).toHaveBeenCalledWith('/path/to/image.png');

        const formData = fetchMock.mock.calls[0][1].body as FormData;
        expect(formData.get('file')).toBeTruthy();
      } finally {
        fs.existsSync = originalExistsSync;
        fs.readFileSync = originalReadFileSync;
      }
    });

    it('accepts file as Readable stream', async () => {
      const client = createTestClient();
      mockFetchJsonResponse(createMockAiVectorizeResponse());

      const readable = new Readable();
      readable.push(Buffer.from('fake-stream-data'));
      readable.push(null);

      await client.convert.aiVectorize.configure({ file: readable }).execute();

      expect(fetchMock).toHaveBeenCalled();
      const formData = fetchMock.mock.calls[0][1].body as FormData;
      expect(formData.get('file')).toBeTruthy();
    });
  });

  // ==========================================================================
  // Validation
  // ==========================================================================

  describe('validation', () => {
    it('throws ValidationError when file is missing', async () => {
      const client = createTestClient();

      await expect(client.convert.aiVectorize.execute()).rejects.toThrow(ValidationError);
    });

    it('throws ValidationError when file path does not exist', async () => {
      const client = createTestClient();

      await expect(
        client.convert.aiVectorize.configure({ file: '/nonexistent/path/image.png' }).execute()
      ).rejects.toThrow(ValidationError);
    });
  });

  // ==========================================================================
  // Error Handling
  // ==========================================================================

  describe('error handling', () => {
    it('throws AuthError on INVALID_API_KEY', async () => {
      const client = createTestClient();
      mockFetchErrorResponse('INVALID_API_KEY', 401);

      await expect(
        client.convert.aiVectorize.configure({ file: testFileBuffer }).execute()
      ).rejects.toThrow(AuthError);
    });

    it('throws InsufficientCreditsError on INSUFFICIENT_CREDITS', async () => {
      const client = createTestClient();
      mockFetchErrorResponse('INSUFFICIENT_CREDITS', 402);

      await expect(
        client.convert.aiVectorize.configure({ file: testFileBuffer }).execute()
      ).rejects.toThrow(InsufficientCreditsError);
    });

    it('throws RateLimitError on RATE_LIMIT_EXCEEDED', async () => {
      const client = createTestClient();
      mockFetchErrorResponse('RATE_LIMIT_EXCEEDED', 429);

      await expect(
        client.convert.aiVectorize.configure({ file: testFileBuffer }).execute()
      ).rejects.toThrow(RateLimitError);
    });

    it('throws EndpointDisabledError on ENDPOINT_DISABLED', async () => {
      const client = createTestClient();
      mockFetchErrorResponse('ENDPOINT_DISABLED', 503, 'This endpoint is disabled');

      await expect(
        client.convert.aiVectorize.configure({ file: testFileBuffer }).execute()
      ).rejects.toThrow(EndpointDisabledError);
    });

    it('throws APIError on generic server error', async () => {
      const client = createTestClient();
      mockFetchErrorResponse('INTERNAL_ERROR', 500, 'Something went wrong');

      await expect(
        client.convert.aiVectorize.configure({ file: testFileBuffer }).execute()
      ).rejects.toThrow(APIError);
    });
  });

  // ==========================================================================
  // .stream()
  // ==========================================================================

  describe('.stream()', () => {
    it('returns a Readable stream', () => {
      const client = createTestClient();
      mockFetchStreamResponse(createMockAiVectorizeStreamEvents());

      const stream = client.convert.aiVectorize.configure({ file: testFileBuffer }).stream();

      expect(stream).toBeInstanceOf(Readable);
    });

    it('emits processing events', async () => {
      const client = createTestClient();
      mockFetchStreamResponse(createMockAiVectorizeStreamEvents());

      const stream = client.convert.aiVectorize.configure({ file: testFileBuffer }).stream();

      const events: any[] = [];
      await new Promise<void>((resolve, reject) => {
        stream.on('data', (event: any) => events.push(event));
        stream.on('end', resolve);
        stream.on('error', reject);
      });

      const processingEvent = events.find(e => e.status === 'processing');
      expect(processingEvent).toBeDefined();
      expect(processingEvent.message).toBe('Vectorizing image...');
    });

    it('emits complete event with merged accumulated data', async () => {
      const client = createTestClient();
      mockFetchStreamResponse(createMockAiVectorizeStreamEvents());

      const stream = client.convert.aiVectorize.configure({ file: testFileBuffer }).stream();

      const events: any[] = [];
      await new Promise<void>((resolve, reject) => {
        stream.on('data', (event: any) => events.push(event));
        stream.on('end', resolve);
        stream.on('error', reject);
      });

      const completeEvent = events.find(e => e.status === 'complete');
      expect(completeEvent).toBeDefined();
      expect(completeEvent.svgUrl).toBeDefined();
      expect(completeEvent.creditCost).toBeDefined();
      expect(completeEvent.svgText).toBeDefined();
    });

    it('sends FormData with stream=true', async () => {
      const client = createTestClient();
      mockFetchStreamResponse(createMockAiVectorizeStreamEvents());

      const stream = client.convert.aiVectorize.configure({ file: testFileBuffer }).stream();

      await new Promise<void>((resolve, reject) => {
        stream.on('data', () => {});
        stream.on('end', resolve);
        stream.on('error', reject);
      });

      const formData = fetchMock.mock.calls[0][1].body as FormData;
      expect(formData.get('stream')).toBe('true');
    });

    it('sends correct headers (Accept: text/event-stream, x-api-key)', async () => {
      const client = createTestClient();
      mockFetchStreamResponse(createMockAiVectorizeStreamEvents());

      const stream = client.convert.aiVectorize.configure({ file: testFileBuffer }).stream();

      await new Promise<void>((resolve, reject) => {
        stream.on('data', () => {});
        stream.on('end', resolve);
        stream.on('error', reject);
      });

      const [, options] = fetchMock.mock.calls[0];
      expect(options.headers['Accept']).toBe('text/event-stream');
      expect(options.headers['x-api-key']).toBe('test-api-key-123');
    });

    it('decodes svgText in stream events', async () => {
      const client = createTestClient();
      const rawSvg =
        '<svg xmlns="http://www.w3.org/2000/svg" width="50" height="50"><rect width="50" height="50"/></svg>';
      const streamEvents = [
        { status: 'processing', message: 'Vectorizing...' },
        {
          status: 'generated',
          message: 'Done',
          svgText: rawSvg,
          svgUrl: 'https://x.com/test.svg',
          creditCost: 2,
        },
        {
          status: 'complete',
          message: 'Complete',
          generationId: 'vec-001',
          metadata: { requestId: 'r1', creditsUsed: 2, creditsRemaining: 97 },
        },
      ];
      mockFetchStreamResponse(streamEvents);

      const stream = client.convert.aiVectorize.configure({ file: testFileBuffer }).stream();

      const events: any[] = [];
      await new Promise<void>((resolve, reject) => {
        stream.on('data', (event: any) => events.push(event));
        stream.on('end', resolve);
        stream.on('error', reject);
      });

      const generatedEvent = events.find(e => e.status === 'generated');
      expect(generatedEvent).toBeDefined();
      expect(generatedEvent.svgText).toBe(rawSvg);
    });

    it('emits error on non-ok response', async () => {
      const client = createTestClient();

      (globalThis.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 401,
        headers: new Headers({ 'Content-Type': 'application/json' }),
        json: async () => ({
          success: false,
          error: {
            code: 'INVALID_API_KEY',
            status: 401,
            message: 'Invalid API key',
          },
          metadata: { requestId: 'test-req-id' },
        }),
        text: async () => '{"success":false}',
      });

      const stream = client.convert.aiVectorize.configure({ file: testFileBuffer }).stream();

      await expect(
        new Promise<void>((resolve, reject) => {
          stream.on('data', () => {});
          stream.on('end', resolve);
          stream.on('error', reject);
        })
      ).rejects.toBeDefined();
    });
  });
});
