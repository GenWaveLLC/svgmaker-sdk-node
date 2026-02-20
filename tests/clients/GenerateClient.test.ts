import { Readable } from 'stream';
import {
  createTestClient,
  setupFetchMock,
  cleanupMocks,
  mockFetchJsonResponse,
  mockFetchErrorResponse,
  mockFetchStreamResponse,
  createMockGenerateResponse,
  createMockStreamEvents,
} from '../setup';
import { ValidationError, RateLimitError, APIError } from '../../src/errors/CustomErrors';

describe('GenerateClient', () => {
  let fetchMock: jest.Mock;

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
      const original = client.generate;
      const configured = original.configure({ prompt: 'A cat' });

      expect(configured).not.toBe(original);
    });

    it('merges params correctly across multiple configure calls', async () => {
      const client = createTestClient();
      mockFetchJsonResponse(createMockGenerateResponse());

      const configured = client.generate
        .configure({ prompt: 'A mountain' })
        .configure({ quality: 'high' });

      // Execute to verify both params are sent
      await configured.execute();

      expect(fetchMock).toHaveBeenCalled();
      const callArgs = fetchMock.mock.calls[0];
      const body = JSON.parse(callArgs[1].body);
      expect(body.prompt).toBe('A mountain');
      expect(body.quality).toBe('high');
    });

    it('supports chaining configure().execute()', async () => {
      const client = createTestClient();
      const mockData = createMockGenerateResponse();
      mockFetchJsonResponse(mockData);

      const result = await client.generate.configure({ prompt: 'A sunset' }).execute();

      expect(result.svgUrl).toBe(mockData.svgUrl);
    });
  });

  // ==========================================================================
  // .execute()
  // ==========================================================================

  describe('.execute()', () => {
    it('sends POST to /v1/generate with correct body', async () => {
      const client = createTestClient();
      mockFetchJsonResponse(createMockGenerateResponse());

      await client.generate.configure({ prompt: 'A tree', quality: 'high' }).execute();

      expect(fetchMock).toHaveBeenCalled();
      const [url, options] = fetchMock.mock.calls[0];
      expect(url).toContain('/v1/generate');
      expect(options.method).toBe('POST');

      const body = JSON.parse(options.body);
      expect(body.prompt).toBe('A tree');
      expect(body.quality).toBe('high');
    });

    it('sends API key in headers', async () => {
      const client = createTestClient();
      mockFetchJsonResponse(createMockGenerateResponse());

      await client.generate.configure({ prompt: 'A tree' }).execute();

      const [, options] = fetchMock.mock.calls[0];
      expect(options.headers['x-api-key']).toBe('test-api-key-123');
    });

    it('returns properly shaped GenerateResponse', async () => {
      const client = createTestClient();
      const mockData = createMockGenerateResponse();
      mockFetchJsonResponse(mockData);

      const result = await client.generate.configure({ prompt: 'A flower' }).execute();

      expect(result.svgUrl).toBe(mockData.svgUrl);
      expect(result.creditCost).toBe(mockData.creditCost);
      expect(result.message).toBe(mockData.message);
      expect(result.generationId).toBe(mockData.generationId);
      expect(result.quality).toBe('medium');
      expect(result.metadata).toBeDefined();
    });

    it('decodes svgText from raw SVG', async () => {
      const client = createTestClient();
      const rawSvg =
        '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><rect width="10" height="10"/></svg>';
      mockFetchJsonResponse(createMockGenerateResponse({ svgText: rawSvg }));

      const result = await client.generate.configure({ prompt: 'A box', svgText: true }).execute();

      expect(result.svgText).toBe(rawSvg);
    });

    it('decodes base64Png to pngImageData Buffer', async () => {
      const client = createTestClient();
      const base64Png = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUg==';
      mockFetchJsonResponse(createMockGenerateResponse({ base64Png }));

      const result = await client.generate
        .configure({ prompt: 'A dot', base64Png: true })
        .execute();

      expect(result.pngImageData).toBeInstanceOf(Buffer);
    });

    it('uses provided quality value', async () => {
      const client = createTestClient();
      mockFetchJsonResponse(createMockGenerateResponse({ quality: 'high' }));

      const result = await client.generate
        .configure({ prompt: 'A star', quality: 'high' })
        .execute();

      expect(result.quality).toBe('high');
    });

    it('passes all parameters in request body', async () => {
      const client = createTestClient();
      mockFetchJsonResponse(createMockGenerateResponse());

      await client.generate
        .configure({
          prompt: 'A landscape',
          quality: 'high',
          aspectRatio: 'landscape',
          background: 'transparent',
          svgText: true,
          base64Png: true,
          storage: true,
          styleParams: {
            style: 'flat',
            color_mode: 'full_color',
            image_complexity: 'illustration',
            composition: 'full_scene',
            text: 'only_title',
          },
        })
        .execute();

      const body = JSON.parse(fetchMock.mock.calls[0][1].body);
      expect(body.prompt).toBe('A landscape');
      expect(body.quality).toBe('high');
      expect(body.aspectRatio).toBe('landscape');
      expect(body.background).toBe('transparent');
      expect(body.svgText).toBe(true);
      expect(body.base64Png).toBe(true);
      expect(body.storage).toBe(true);
      expect(body.styleParams).toEqual({
        style: 'flat',
        color_mode: 'full_color',
        image_complexity: 'illustration',
        composition: 'full_scene',
        text: 'only_title',
      });
    });

    it('sends model param without quality defaulting', async () => {
      const client = createTestClient();
      mockFetchJsonResponse(createMockGenerateResponse({ quality: undefined }));

      await client.generate.configure({ prompt: 'A tree', model: 'custom-model-v1' }).execute();

      const body = JSON.parse(fetchMock.mock.calls[0][1].body);
      expect(body.model).toBe('custom-model-v1');
      expect(body.prompt).toBe('A tree');
    });
  });

  // ==========================================================================
  // Validation
  // ==========================================================================

  describe('validation', () => {
    it('throws ValidationError when prompt is empty string', async () => {
      const client = createTestClient();
      mockFetchJsonResponse(createMockGenerateResponse());

      await expect(client.generate.configure({ prompt: '' }).execute()).rejects.toThrow(
        ValidationError
      );
    });

    it('throws ValidationError when prompt is missing', async () => {
      const client = createTestClient();
      mockFetchJsonResponse(createMockGenerateResponse());

      await expect(client.generate.execute()).rejects.toThrow(ValidationError);
    });

    it('throws ValidationError when both model and quality are set', async () => {
      const client = createTestClient();
      mockFetchJsonResponse(createMockGenerateResponse());

      await expect(
        client.generate
          .configure({ prompt: 'A cat', model: 'test-model', quality: 'high' })
          .execute()
      ).rejects.toThrow(ValidationError);
    });

    it('accepts valid quality values', async () => {
      const client = createTestClient();

      for (const quality of ['low', 'medium', 'high'] as const) {
        mockFetchJsonResponse(createMockGenerateResponse({ quality }));
        const result = await client.generate.configure({ prompt: 'Test', quality }).execute();
        expect(result).toBeDefined();
      }
    });

    it('accepts valid aspectRatio values', async () => {
      const client = createTestClient();

      for (const aspectRatio of ['auto', 'portrait', 'landscape', 'square'] as const) {
        mockFetchJsonResponse(createMockGenerateResponse());
        const result = await client.generate.configure({ prompt: 'Test', aspectRatio }).execute();
        expect(result).toBeDefined();
      }
    });

    it('accepts valid styleParams', async () => {
      const client = createTestClient();
      mockFetchJsonResponse(createMockGenerateResponse());

      const result = await client.generate
        .configure({
          prompt: 'Test',
          styleParams: {
            style: 'cartoon',
            color_mode: 'monochrome',
            image_complexity: 'icon',
            composition: 'centered_object',
            text: 'embedded_text',
          },
        })
        .execute();

      expect(result).toBeDefined();
    });
  });

  // ==========================================================================
  // Error Handling
  // ==========================================================================

  describe('error handling', () => {
    // Note: GenerateClient.execute() uses handleRequest() which goes through
    // the retry wrapper. Non-retryable errors (AuthError, InsufficientCreditsError,
    // ContentSafetyError) are wrapped in AbortError by the retry utility.
    // Retryable status codes (429, 500) are re-thrown as-is after exhausting retries.

    it('throws on INVALID_API_KEY', async () => {
      const client = createTestClient();
      mockFetchErrorResponse('INVALID_API_KEY', 401, 'Invalid API key');

      await expect(client.generate.configure({ prompt: 'A cat' }).execute()).rejects.toThrow(
        'Invalid API key'
      );
    });

    it('throws on INSUFFICIENT_CREDITS', async () => {
      const client = createTestClient();
      mockFetchErrorResponse('INSUFFICIENT_CREDITS', 402, 'Not enough credits');

      await expect(client.generate.configure({ prompt: 'A cat' }).execute()).rejects.toThrow(
        'Not enough credits'
      );
    });

    it('throws RateLimitError on RATE_LIMIT_EXCEEDED', async () => {
      const client = createTestClient();
      mockFetchErrorResponse('RATE_LIMIT_EXCEEDED', 429);

      await expect(client.generate.configure({ prompt: 'A cat' }).execute()).rejects.toThrow(
        RateLimitError
      );
    });

    it('throws on CONTENT_POLICY', async () => {
      const client = createTestClient();
      mockFetchErrorResponse('CONTENT_POLICY', 422, 'Content policy violation');

      await expect(client.generate.configure({ prompt: 'A cat' }).execute()).rejects.toThrow(
        'Content policy violation'
      );
    });

    it('throws APIError on generic server error', async () => {
      const client = createTestClient();
      mockFetchErrorResponse('INTERNAL_ERROR', 500, 'Something went wrong');

      await expect(client.generate.configure({ prompt: 'A cat' }).execute()).rejects.toThrow(
        APIError
      );
    });

    it('throws on ENDPOINT_DISABLED', async () => {
      const client = createTestClient();
      mockFetchErrorResponse('ENDPOINT_DISABLED', 503, 'This endpoint is disabled');

      await expect(client.generate.configure({ prompt: 'A cat' }).execute()).rejects.toThrow(
        'This endpoint is disabled'
      );
    });

    it('throws on FILE_SIZE_EXCEEDED (413)', async () => {
      const client = createTestClient();
      mockFetchErrorResponse('FILE_SIZE_EXCEEDED', 413, 'File too large');

      await expect(client.generate.configure({ prompt: 'A cat' }).execute()).rejects.toThrow(
        'File too large'
      );
    });
  });

  // ==========================================================================
  // .stream()
  // ==========================================================================

  describe('.stream()', () => {
    it('returns a Readable stream', () => {
      const client = createTestClient();
      mockFetchStreamResponse(createMockStreamEvents());

      const stream = client.generate.configure({ prompt: 'A cat' }).stream();

      expect(stream).toBeInstanceOf(Readable);
    });

    it('emits processing events', async () => {
      const client = createTestClient();
      mockFetchStreamResponse(createMockStreamEvents());

      const stream = client.generate.configure({ prompt: 'A cat' }).stream();

      const events: any[] = [];
      await new Promise<void>((resolve, reject) => {
        stream.on('data', (event: any) => events.push(event));
        stream.on('end', resolve);
        stream.on('error', reject);
      });

      const processingEvent = events.find(e => e.status === 'processing');
      expect(processingEvent).toBeDefined();
      expect(processingEvent.message).toBe('Generating SVG...');
    });

    it('emits complete event with merged accumulated data', async () => {
      const client = createTestClient();
      mockFetchStreamResponse(createMockStreamEvents());

      const stream = client.generate.configure({ prompt: 'A cat' }).stream();

      const events: any[] = [];
      await new Promise<void>((resolve, reject) => {
        stream.on('data', (event: any) => events.push(event));
        stream.on('end', resolve);
        stream.on('error', reject);
      });

      const completeEvent = events.find(e => e.status === 'complete');
      expect(completeEvent).toBeDefined();
      // svgText from 'generated' event should be accumulated into 'complete'
      expect(completeEvent.svgText).toBeDefined();
      expect(completeEvent.svgUrl).toBeDefined();
      expect(completeEvent.creditCost).toBeDefined();
    });

    it('sends correct headers for streaming', async () => {
      const client = createTestClient();
      mockFetchStreamResponse(createMockStreamEvents());

      const stream = client.generate.configure({ prompt: 'A cat' }).stream();

      // Wait for stream to start
      await new Promise<void>((resolve, reject) => {
        stream.on('data', () => {});
        stream.on('end', resolve);
        stream.on('error', reject);
      });

      const [, options] = fetchMock.mock.calls[0];
      expect(options.headers['Accept']).toBe('text/event-stream');
      expect(options.headers['x-api-key']).toBe('test-api-key-123');
    });

    it('emits error on non-ok response', async () => {
      const client = createTestClient();

      // Mock a non-ok response for streaming
      (globalThis.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 401,
        headers: new Headers({ 'Content-Type': 'application/json' }),
        json: async () => ({
          success: false,
          error: { code: 'INVALID_API_KEY', status: 401, message: 'Invalid API key' },
          metadata: { requestId: 'test-req-id' },
        }),
        text: async () => '{"success":false}',
      });

      const stream = client.generate.configure({ prompt: 'A cat' }).stream();

      await expect(
        new Promise<void>((resolve, reject) => {
          stream.on('data', () => {});
          stream.on('end', resolve);
          stream.on('error', reject);
        })
      ).rejects.toBeDefined();
    });

    it('decodes svgText in stream events', async () => {
      const client = createTestClient();
      const rawSvg =
        '<svg xmlns="http://www.w3.org/2000/svg" width="50" height="50"><rect width="50" height="50"/></svg>';
      const streamEvents = [
        { status: 'processing', message: 'Generating SVG...' },
        {
          status: 'generated',
          message: 'SVG generated',
          svgText: rawSvg,
          svgUrl: 'https://storage.example.com/test.svg',
          creditCost: 1,
        },
        {
          status: 'complete',
          message: 'Generation complete',
          generationId: 'gen-stream-001',
          metadata: { requestId: 'test-req-id', creditsUsed: 1, creditsRemaining: 99 },
        },
      ];
      mockFetchStreamResponse(streamEvents);

      const stream = client.generate.configure({ prompt: 'A cat' }).stream();

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

    it('decodes base64Png to pngImageData in stream events', async () => {
      const client = createTestClient();
      const base64Png = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUg==';
      const streamEvents = [
        { status: 'processing', message: 'Generating SVG...' },
        {
          status: 'generated',
          message: 'SVG generated',
          svgUrl: 'https://storage.example.com/test.svg',
          creditCost: 1,
          base64Png,
        },
        {
          status: 'complete',
          message: 'Generation complete',
          generationId: 'gen-stream-001',
          metadata: { requestId: 'test-req-id', creditsUsed: 1, creditsRemaining: 99 },
        },
      ];
      mockFetchStreamResponse(streamEvents);

      const stream = client.generate.configure({ prompt: 'A cat' }).stream();

      const events: any[] = [];
      await new Promise<void>((resolve, reject) => {
        stream.on('data', (event: any) => events.push(event));
        stream.on('end', resolve);
        stream.on('error', reject);
      });

      const generatedEvent = events.find(e => e.status === 'generated');
      expect(generatedEvent).toBeDefined();
      expect(generatedEvent.pngImageData).toBeInstanceOf(Buffer);
    });

    it('accumulates fields from intermediate events into complete event', async () => {
      const client = createTestClient();
      const rawSvg =
        '<svg xmlns="http://www.w3.org/2000/svg" width="50" height="50"><rect width="50" height="50"/></svg>';
      const streamEvents = [
        { status: 'processing', message: 'Generating SVG...' },
        {
          status: 'generated',
          message: 'SVG generated',
          svgText: rawSvg,
          svgUrl: 'https://storage.example.com/test.svg',
          creditCost: 1,
        },
        {
          status: 'complete',
          message: 'Generation complete',
          generationId: 'gen-stream-001',
        },
      ];
      mockFetchStreamResponse(streamEvents);

      const stream = client.generate.configure({ prompt: 'A cat' }).stream();

      const events: any[] = [];
      await new Promise<void>((resolve, reject) => {
        stream.on('data', (event: any) => events.push(event));
        stream.on('end', resolve);
        stream.on('error', reject);
      });

      const completeEvent = events.find(e => e.status === 'complete');
      expect(completeEvent).toBeDefined();
      // Fields from 'generated' event should be accumulated into 'complete'
      expect(completeEvent.svgText).toBe(rawSvg);
      expect(completeEvent.svgUrl).toBe('https://storage.example.com/test.svg');
      expect(completeEvent.creditCost).toBe(1);
      expect(completeEvent.generationId).toBe('gen-stream-001');
    });
  });
});
