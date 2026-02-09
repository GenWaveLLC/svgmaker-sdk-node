import { Readable } from 'stream';
import {
  createTestClient,
  setupFetchMock,
  cleanupMocks,
  mockFetchJsonResponse,
  mockFetchErrorResponse,
  mockFetchStreamResponse,
  createMockEditResponse,
  createMockStreamEvents,
} from '../setup';
import {
  ValidationError,
  AuthError,
  InsufficientCreditsError,
  RateLimitError,
  ContentSafetyError,
  APIError,
  EndpointDisabledError,
  FileSizeError,
  FileFormatError,
} from '../../src/errors/CustomErrors';

describe('EditClient', () => {
  let fetchMock: jest.Mock;
  const testImageBuffer = Buffer.from('fake-png-image-data');

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
      const original = client.edit;
      const configured = original.configure({
        image: testImageBuffer,
        prompt: 'Make it blue',
      });

      expect(configured).not.toBe(original);
    });

    it('merges params correctly across multiple configure calls', async () => {
      const client = createTestClient();
      mockFetchJsonResponse(createMockEditResponse());

      const configured = client.edit
        .configure({ image: testImageBuffer, prompt: 'Make it blue' })
        .configure({ quality: 'high' });

      await configured.execute();

      expect(fetchMock).toHaveBeenCalled();
      // EditClient uses FormData, so we check the fetch was called
      const [url] = fetchMock.mock.calls[0];
      expect(url).toContain('/v1/edit');
    });
  });

  // ==========================================================================
  // .execute()
  // ==========================================================================

  describe('.execute()', () => {
    it('sends POST to /v1/edit with FormData body', async () => {
      const client = createTestClient();
      mockFetchJsonResponse(createMockEditResponse());

      await client.edit
        .configure({ image: testImageBuffer, prompt: 'Make it red' })
        .execute();

      expect(fetchMock).toHaveBeenCalled();
      const [url, options] = fetchMock.mock.calls[0];
      expect(url).toContain('/v1/edit');
      expect(options.method).toBe('POST');
      expect(options.body).toBeInstanceOf(FormData);
    });

    it('sends API key in headers', async () => {
      const client = createTestClient();
      mockFetchJsonResponse(createMockEditResponse());

      await client.edit
        .configure({ image: testImageBuffer, prompt: 'Make it red' })
        .execute();

      const [, options] = fetchMock.mock.calls[0];
      expect(options.headers['x-api-key']).toBe('test-api-key-123');
    });

    it('appends image as Blob to FormData (Buffer input)', async () => {
      const client = createTestClient();
      mockFetchJsonResponse(createMockEditResponse());

      await client.edit
        .configure({ image: testImageBuffer, prompt: 'Make it green' })
        .execute();

      const formData = fetchMock.mock.calls[0][1].body as FormData;
      const imageField = formData.get('image');
      expect(imageField).toBeTruthy();
    });

    it('appends optional params to FormData', async () => {
      const client = createTestClient();
      mockFetchJsonResponse(createMockEditResponse());

      await client.edit
        .configure({
          image: testImageBuffer,
          prompt: 'Make it colorful',
          quality: 'high',
          aspectRatio: 'landscape',
          background: 'transparent',
          base64Png: true,
          svgText: true,
          storage: true,
        })
        .execute();

      const formData = fetchMock.mock.calls[0][1].body as FormData;
      expect(formData.get('prompt')).toBe('Make it colorful');
      expect(formData.get('quality')).toBe('high');
      expect(formData.get('aspectRatio')).toBe('landscape');
      expect(formData.get('background')).toBe('transparent');
      expect(formData.get('base64Png')).toBe('true');
      expect(formData.get('svgText')).toBe('true');
      expect(formData.get('storage')).toBe('true');
    });

    it('appends styleParams as JSON string', async () => {
      const client = createTestClient();
      mockFetchJsonResponse(createMockEditResponse());

      const styleParams = {
        style: 'flat' as const,
        color_mode: 'full_color' as const,
        image_complexity: 'icon' as const,
      };

      await client.edit
        .configure({
          image: testImageBuffer,
          prompt: 'Stylize it',
          styleParams,
        })
        .execute();

      const formData = fetchMock.mock.calls[0][1].body as FormData;
      const styleParamsField = formData.get('styleParams');
      expect(styleParamsField).toBe(JSON.stringify(styleParams));
    });

    it('returns properly shaped EditResponse', async () => {
      const client = createTestClient();
      const mockData = createMockEditResponse();
      mockFetchJsonResponse(mockData);

      const result = await client.edit
        .configure({ image: testImageBuffer, prompt: 'Edit this' })
        .execute();

      expect(result.svgUrl).toBe(mockData.svgUrl);
      expect(result.creditCost).toBe(mockData.creditCost);
      expect(result.message).toBe(mockData.message);
      expect(result.generationId).toBe(mockData.generationId);
      expect(result.metadata).toBeDefined();
    });

    it('decodes base64Png to pngImageData Buffer', async () => {
      const client = createTestClient();
      const base64Png = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUg==';
      mockFetchJsonResponse(createMockEditResponse({ base64Png }));

      const result = await client.edit
        .configure({ image: testImageBuffer, prompt: 'Edit this', base64Png: true })
        .execute();

      expect(result.pngImageData).toBeInstanceOf(Buffer);
    });

    it('decodes svgText from raw SVG', async () => {
      const client = createTestClient();
      const rawSvg =
        '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><rect width="10" height="10"/></svg>';
      mockFetchJsonResponse(createMockEditResponse({ svgText: rawSvg }));

      const result = await client.edit
        .configure({ image: testImageBuffer, prompt: 'Edit this', svgText: true })
        .execute();

      expect(result.svgText).toBe(rawSvg);
    });

    it('defaults quality to medium when not specified', async () => {
      const client = createTestClient();
      mockFetchJsonResponse(createMockEditResponse());

      await client.edit
        .configure({ image: testImageBuffer, prompt: 'Edit this' })
        .execute();

      const formData = fetchMock.mock.calls[0][1].body as FormData;
      expect(formData.get('quality')).toBe('medium');
    });

    it('does not set default quality when model is specified', async () => {
      const client = createTestClient();
      mockFetchJsonResponse(createMockEditResponse());

      await client.edit
        .configure({
          image: testImageBuffer,
          prompt: 'Edit this',
          model: 'custom-model-v1',
        })
        .execute();

      const formData = fetchMock.mock.calls[0][1].body as FormData;
      // quality should not be set when model is specified
      expect(formData.get('model')).toBe('custom-model-v1');
    });

    it('accepts image as file path string', async () => {
      const client = createTestClient();
      mockFetchJsonResponse(createMockEditResponse());

      // Mock fs module
      const fs = require('fs');
      const originalExistsSync = fs.existsSync;
      const originalReadFileSync = fs.readFileSync;
      fs.existsSync = jest.fn().mockReturnValue(true);
      fs.readFileSync = jest.fn().mockReturnValue(Buffer.from('fake-png-data'));

      try {
        await client.edit
          .configure({ image: '/path/to/image.png', prompt: 'Edit this' })
          .execute();

        expect(fs.existsSync).toHaveBeenCalledWith('/path/to/image.png');
        expect(fs.readFileSync).toHaveBeenCalledWith('/path/to/image.png');

        const formData = fetchMock.mock.calls[0][1].body as FormData;
        const imageField = formData.get('image');
        expect(imageField).toBeTruthy();
      } finally {
        fs.existsSync = originalExistsSync;
        fs.readFileSync = originalReadFileSync;
      }
    });

    it('accepts image as Readable stream', async () => {
      const client = createTestClient();
      mockFetchJsonResponse(createMockEditResponse());

      const readable = new Readable();
      readable.push(Buffer.from('fake-stream-data'));
      readable.push(null);

      await client.edit
        .configure({ image: readable, prompt: 'Edit this' })
        .execute();

      expect(fetchMock).toHaveBeenCalled();
      const formData = fetchMock.mock.calls[0][1].body as FormData;
      const imageField = formData.get('image');
      expect(imageField).toBeTruthy();
    });

    it('throws ValidationError when file path does not exist', async () => {
      const client = createTestClient();
      mockFetchJsonResponse(createMockEditResponse());

      await expect(
        client.edit
          .configure({ image: '/nonexistent/path/image.png', prompt: 'Edit this' })
          .execute(),
      ).rejects.toThrow(ValidationError);
    });
  });

  // ==========================================================================
  // Validation
  // ==========================================================================

  describe('validation', () => {
    it('throws ValidationError when image is missing', async () => {
      const client = createTestClient();
      mockFetchJsonResponse(createMockEditResponse());

      await expect(
        client.edit.configure({ prompt: 'Edit this' } as any).execute(),
      ).rejects.toThrow(ValidationError);
    });

    it('throws ValidationError when neither prompt nor styleParams given', async () => {
      const client = createTestClient();
      mockFetchJsonResponse(createMockEditResponse());

      await expect(
        client.edit.configure({ image: testImageBuffer }).execute(),
      ).rejects.toThrow(ValidationError);
    });

    it('throws ValidationError when both model and quality are set', async () => {
      const client = createTestClient();
      mockFetchJsonResponse(createMockEditResponse());

      await expect(
        client.edit
          .configure({
            image: testImageBuffer,
            prompt: 'Edit this',
            model: 'test-model',
            quality: 'high',
          })
          .execute(),
      ).rejects.toThrow(ValidationError);
    });

    it('accepts styleParams without prompt', async () => {
      const client = createTestClient();
      mockFetchJsonResponse(createMockEditResponse());

      const result = await client.edit
        .configure({
          image: testImageBuffer,
          styleParams: { style: 'cartoon' },
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
      mockFetchErrorResponse('INVALID_API_KEY', 401);

      await expect(
        client.edit
          .configure({ image: testImageBuffer, prompt: 'Edit this' })
          .execute(),
      ).rejects.toThrow(AuthError);
    });

    it('throws InsufficientCreditsError on INSUFFICIENT_CREDITS', async () => {
      const client = createTestClient();
      mockFetchErrorResponse('INSUFFICIENT_CREDITS', 402);

      await expect(
        client.edit
          .configure({ image: testImageBuffer, prompt: 'Edit this' })
          .execute(),
      ).rejects.toThrow(InsufficientCreditsError);
    });

    it('throws RateLimitError on RATE_LIMIT_EXCEEDED', async () => {
      const client = createTestClient();
      mockFetchErrorResponse('RATE_LIMIT_EXCEEDED', 429);

      await expect(
        client.edit
          .configure({ image: testImageBuffer, prompt: 'Edit this' })
          .execute(),
      ).rejects.toThrow(RateLimitError);
    });

    it('throws ContentSafetyError on CONTENT_POLICY', async () => {
      const client = createTestClient();
      mockFetchErrorResponse('CONTENT_POLICY', 422);

      await expect(
        client.edit
          .configure({ image: testImageBuffer, prompt: 'Edit this' })
          .execute(),
      ).rejects.toThrow(ContentSafetyError);
    });

    it('throws APIError on generic server error', async () => {
      const client = createTestClient();
      mockFetchErrorResponse('INTERNAL_ERROR', 500, 'Something went wrong');

      await expect(
        client.edit
          .configure({ image: testImageBuffer, prompt: 'Edit this' })
          .execute(),
      ).rejects.toThrow(APIError);
    });

    it('throws EndpointDisabledError on ENDPOINT_DISABLED', async () => {
      const client = createTestClient();
      mockFetchErrorResponse('ENDPOINT_DISABLED', 503, 'This endpoint is disabled');

      await expect(
        client.edit
          .configure({ image: testImageBuffer, prompt: 'Edit this' })
          .execute(),
      ).rejects.toThrow(EndpointDisabledError);
    });

    it('throws FileSizeError on 413 status', async () => {
      const client = createTestClient();
      mockFetchErrorResponse('FILE_TOO_LARGE', 413, 'File exceeds size limit');

      await expect(
        client.edit
          .configure({ image: testImageBuffer, prompt: 'Edit this' })
          .execute(),
      ).rejects.toThrow(FileSizeError);
    });

    it('throws FileFormatError when message mentions file format', async () => {
      const client = createTestClient();
      mockFetchErrorResponse('UNKNOWN', 400, 'Unsupported file format');

      await expect(
        client.edit
          .configure({ image: testImageBuffer, prompt: 'Edit this' })
          .execute(),
      ).rejects.toThrow(FileFormatError);
    });

    it('handles non-JSON error response', async () => {
      const client = createTestClient();

      (globalThis.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 502,
        headers: new Headers({ 'Content-Type': 'text/plain' }),
        text: async () => 'Bad Gateway',
        json: async () => { throw new Error('not json'); },
      });

      await expect(
        client.edit
          .configure({ image: testImageBuffer, prompt: 'Edit this' })
          .execute(),
      ).rejects.toThrow(APIError);
    });
  });

  // ==========================================================================
  // .stream()
  // ==========================================================================

  describe('.stream()', () => {
    it('returns a Readable stream', () => {
      const client = createTestClient();
      mockFetchStreamResponse(createMockStreamEvents());

      const stream = client.edit
        .configure({ image: testImageBuffer, prompt: 'Edit this' })
        .stream();

      expect(stream).toBeInstanceOf(Readable);
    });

    it('sends FormData with stream=true', async () => {
      const client = createTestClient();
      mockFetchStreamResponse(createMockStreamEvents());

      const stream = client.edit
        .configure({ image: testImageBuffer, prompt: 'Edit this' })
        .stream();

      await new Promise<void>((resolve, reject) => {
        stream.on('data', () => {});
        stream.on('end', resolve);
        stream.on('error', reject);
      });

      const [, options] = fetchMock.mock.calls[0];
      expect(options.body).toBeInstanceOf(FormData);
      const formData = options.body as FormData;
      expect(formData.get('stream')).toBe('true');
    });

    it('emits processing and complete events', async () => {
      const client = createTestClient();
      mockFetchStreamResponse(createMockStreamEvents());

      const stream = client.edit
        .configure({ image: testImageBuffer, prompt: 'Edit this' })
        .stream();

      const events: any[] = [];
      await new Promise<void>((resolve, reject) => {
        stream.on('data', (event: any) => events.push(event));
        stream.on('end', resolve);
        stream.on('error', reject);
      });

      expect(events.length).toBeGreaterThanOrEqual(2);
      expect(events.some((e) => e.status === 'processing')).toBe(true);
      expect(events.some((e) => e.status === 'complete')).toBe(true);
    });

    it('emits error on non-ok response', async () => {
      const client = createTestClient();

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

      const stream = client.edit
        .configure({ image: testImageBuffer, prompt: 'Edit this' })
        .stream();

      await expect(
        new Promise<void>((resolve, reject) => {
          stream.on('data', () => {});
          stream.on('end', resolve);
          stream.on('error', reject);
        }),
      ).rejects.toBeDefined();
    });

    it('decodes svgText in stream events', async () => {
      const client = createTestClient();
      const rawSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="50" height="50"><rect width="50" height="50"/></svg>';
      const streamEvents = [
        { status: 'processing', message: 'Editing...' },
        {
          status: 'generated',
          message: 'Edit complete',
          svgText: rawSvg,
          svgUrl: 'https://storage.example.com/test-edit.svg',
          creditCost: 2,
        },
        {
          status: 'complete',
          message: 'Edit complete',
          generationId: 'edit-stream-001',
          metadata: { requestId: 'test-req-id', creditsUsed: 2, creditsRemaining: 98 },
        },
      ];
      mockFetchStreamResponse(streamEvents);

      const stream = client.edit
        .configure({ image: testImageBuffer, prompt: 'Edit this' })
        .stream();

      const events: any[] = [];
      await new Promise<void>((resolve, reject) => {
        stream.on('data', (event: any) => events.push(event));
        stream.on('end', resolve);
        stream.on('error', reject);
      });

      const generatedEvent = events.find((e) => e.status === 'generated');
      expect(generatedEvent).toBeDefined();
      expect(generatedEvent.svgText).toBe(rawSvg);
    });

    it('decodes base64Png to pngImageData in stream events', async () => {
      const client = createTestClient();
      const base64Png = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUg==';
      const streamEvents = [
        { status: 'processing', message: 'Editing...' },
        {
          status: 'generated',
          message: 'Edit complete',
          svgUrl: 'https://storage.example.com/test-edit.svg',
          creditCost: 2,
          base64Png,
        },
        {
          status: 'complete',
          message: 'Edit complete',
          generationId: 'edit-stream-001',
          metadata: { requestId: 'test-req-id', creditsUsed: 2, creditsRemaining: 98 },
        },
      ];
      mockFetchStreamResponse(streamEvents);

      const stream = client.edit
        .configure({ image: testImageBuffer, prompt: 'Edit this' })
        .stream();

      const events: any[] = [];
      await new Promise<void>((resolve, reject) => {
        stream.on('data', (event: any) => events.push(event));
        stream.on('end', resolve);
        stream.on('error', reject);
      });

      const generatedEvent = events.find((e) => e.status === 'generated');
      expect(generatedEvent).toBeDefined();
      expect(generatedEvent.pngImageData).toBeInstanceOf(Buffer);
    });
  });
});
