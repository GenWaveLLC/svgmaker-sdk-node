import fs from 'fs';
import { Readable } from 'stream';
import {
  createTestClient,
  setupFetchMock,
  cleanupMocks,
  mockFetchJsonResponse,
  mockFetchErrorResponse,
  mockFetchStreamResponse,
  createOAuthTestClient,
  TEST_ACCESS_TOKEN,
} from '../setup';
import {
  ValidationError,
  AuthError,
  InsufficientCreditsError,
  RateLimitError,
  APIError,
} from '../../src/errors/CustomErrors';

const IMAGE_URL = 'https://storage.example.com/temp-uploads/user/abc.png';

function mockRemoveBackgroundData(overrides?: Record<string, any>): Record<string, any> {
  return {
    svgUrl: 'https://storage.example.com/no-background.svg',
    creditCost: 1,
    message: 'Background removed successfully',
    svgUrlExpiresIn: '24h',
    generationId: 'rmbg-test-123',
    ...overrides,
  };
}

describe('RemoveBackgroundClient', () => {
  let fetchMock: jest.Mock;
  const testFileBuffer = Buffer.from('fake-png-image-data');

  beforeEach(() => {
    fetchMock = setupFetchMock();
  });

  afterEach(() => {
    cleanupMocks();
  });

  describe('.configure()', () => {
    it('returns a new instance (immutability)', () => {
      const client = createTestClient();
      const original = client.removeBackground;

      expect(original.configure({ file: testFileBuffer })).not.toBe(original);
    });
  });

  describe('.execute()', () => {
    it('sends POST to /v1/remove-background with FormData', async () => {
      const client = createTestClient();
      mockFetchJsonResponse(mockRemoveBackgroundData());

      await client.removeBackground.configure({ file: testFileBuffer }).execute();

      const [url, options] = fetchMock.mock.calls[0];
      expect(url).toContain('/v1/remove-background');
      expect(options.method).toBe('POST');
      expect(options.body).toBeInstanceOf(FormData);
    });

    it('appends optional params to FormData', async () => {
      const client = createTestClient();
      mockFetchJsonResponse(mockRemoveBackgroundData());

      await client.removeBackground
        .configure({ file: testFileBuffer, storage: true, svgText: true })
        .execute();

      const formData = fetchMock.mock.calls[0][1].body as FormData;
      expect(formData.get('file')).toBeTruthy();
      expect(formData.get('storage')).toBe('true');
      expect(formData.get('svgText')).toBe('true');
    });

    it('returns a properly shaped RemoveBackgroundResponse', async () => {
      const client = createTestClient();
      const rawSvg = '<svg xmlns="http://www.w3.org/2000/svg"></svg>';
      mockFetchJsonResponse(mockRemoveBackgroundData({ svgText: rawSvg }));

      const result = await client.removeBackground.configure({ file: testFileBuffer }).execute();

      expect(result.svgUrl).toBe('https://storage.example.com/no-background.svg');
      expect(result.creditCost).toBe(1);
      expect(result.generationId).toBe('rmbg-test-123');
      expect(result.svgText).toBe(rawSvg);
      expect(result.metadata).toBeDefined();
    });

    it('accepts file as a Readable stream', async () => {
      const client = createTestClient();
      mockFetchJsonResponse(mockRemoveBackgroundData());

      const readable = new Readable();
      readable.push(Buffer.from('fake-stream-data'));
      readable.push(null);

      await client.removeBackground.configure({ file: readable }).execute();

      const formData = fetchMock.mock.calls[0][1].body as FormData;
      expect(formData.get('file')).toBeTruthy();
    });
  });

  describe('imageUrl', () => {
    let originalExistsSync: any;

    beforeEach(() => {
      originalExistsSync = fs.existsSync;
      fs.existsSync = jest.fn().mockReturnValue(false);
    });

    afterEach(() => {
      fs.existsSync = originalExistsSync;
    });

    it('sends imageUrl as a form field without touching the filesystem', async () => {
      const client = createTestClient();
      mockFetchJsonResponse(mockRemoveBackgroundData());

      await client.removeBackground.configure({ imageUrl: IMAGE_URL }).execute();

      const formData = fetchMock.mock.calls[0][1].body as FormData;
      expect(formData.get('imageUrl')).toBe(IMAGE_URL);
      expect(formData.get('file')).toBeNull();
      expect(fs.existsSync).not.toHaveBeenCalled();
    });

    it('sends imageUrl on the streaming path', async () => {
      const client = createTestClient();
      mockFetchStreamResponse([{ status: 'complete', message: 'done' }]);

      const stream = client.removeBackground.configure({ imageUrl: IMAGE_URL }).stream();

      await new Promise<void>((resolve, reject) => {
        stream.on('data', () => {});
        stream.on('end', resolve);
        stream.on('error', reject);
      });

      const formData = fetchMock.mock.calls[0][1].body as FormData;
      expect(formData.get('imageUrl')).toBe(IMAGE_URL);
      expect(fs.existsSync).not.toHaveBeenCalled();
    });

    it('throws ValidationError when neither file nor imageUrl is provided', async () => {
      const client = createTestClient();

      await expect(client.removeBackground.execute()).rejects.toThrow(ValidationError);
    });

    it('throws ValidationError when both file and imageUrl are provided', async () => {
      const client = createTestClient();

      await expect(
        client.removeBackground.configure({ file: testFileBuffer, imageUrl: IMAGE_URL }).execute()
      ).rejects.toThrow(ValidationError);
    });

    it('accepts a file-only call', async () => {
      const client = createTestClient();
      mockFetchJsonResponse(mockRemoveBackgroundData());

      await client.removeBackground.configure({ file: testFileBuffer }).execute();

      const formData = fetchMock.mock.calls[0][1].body as FormData;
      expect(formData.get('file')).toBeTruthy();
      expect(formData.get('imageUrl')).toBeNull();
    });
  });

  describe('generationId', () => {
    const GENERATION_ID = 'gen-abc-123';
    let originalExistsSync: any;

    beforeEach(() => {
      originalExistsSync = fs.existsSync;
      fs.existsSync = jest.fn().mockReturnValue(false);
    });

    afterEach(() => {
      fs.existsSync = originalExistsSync;
    });

    it('sends generationId as a form field without touching the filesystem', async () => {
      const client = createTestClient();
      mockFetchJsonResponse(mockRemoveBackgroundData());

      await client.removeBackground.configure({ generationId: GENERATION_ID }).execute();

      const formData = fetchMock.mock.calls[0][1].body as FormData;
      expect(formData.get('generationId')).toBe(GENERATION_ID);
      expect(formData.get('file')).toBeNull();
      expect(formData.get('imageUrl')).toBeNull();
      expect(fs.existsSync).not.toHaveBeenCalled();
    });

    it('sends generationId on the streaming path', async () => {
      const client = createTestClient();
      mockFetchStreamResponse([{ status: 'complete', message: 'done' }]);

      const stream = client.removeBackground.configure({ generationId: GENERATION_ID }).stream();

      await new Promise<void>((resolve, reject) => {
        stream.on('data', () => {});
        stream.on('end', resolve);
        stream.on('error', reject);
      });

      const formData = fetchMock.mock.calls[0][1].body as FormData;
      expect(formData.get('generationId')).toBe(GENERATION_ID);
      expect(formData.get('file')).toBeNull();
      expect(fs.existsSync).not.toHaveBeenCalled();
    });

    it('throws ValidationError when both generationId and file are provided', async () => {
      const client = createTestClient();

      await expect(
        client.removeBackground
          .configure({ file: testFileBuffer, generationId: GENERATION_ID })
          .execute()
      ).rejects.toThrow(ValidationError);
    });

    it('throws ValidationError when both generationId and imageUrl are provided', async () => {
      const client = createTestClient();

      await expect(
        client.removeBackground
          .configure({ imageUrl: IMAGE_URL, generationId: GENERATION_ID })
          .execute()
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('uploadId', () => {
    const UPLOAD_ID = 'upl_abc123';

    it('sends uploadId as a form field without touching the filesystem', async () => {
      const originalExistsSync = fs.existsSync;
      fs.existsSync = jest.fn().mockReturnValue(false);

      try {
        const client = createTestClient();
        mockFetchJsonResponse(mockRemoveBackgroundData());

        await client.removeBackground.configure({ uploadId: UPLOAD_ID }).execute();

        const formData = fetchMock.mock.calls[0][1].body as FormData;
        expect(formData.get('uploadId')).toBe(UPLOAD_ID);
        expect(formData.get('file')).toBeNull();
        expect(fs.existsSync).not.toHaveBeenCalled();
      } finally {
        fs.existsSync = originalExistsSync;
      }
    });

    it('sends uploadId on the streaming path', async () => {
      const client = createTestClient();
      mockFetchStreamResponse([{ status: 'complete', message: 'done' }]);

      const stream = client.removeBackground.configure({ uploadId: UPLOAD_ID }).stream();

      await new Promise<void>((resolve, reject) => {
        stream.on('data', () => {});
        stream.on('end', resolve);
        stream.on('error', reject);
      });

      const formData = fetchMock.mock.calls[0][1].body as FormData;
      expect(formData.get('uploadId')).toBe(UPLOAD_ID);
    });

    it('rejects uploadId combined with another image source', async () => {
      const client = createTestClient();

      await expect(
        client.removeBackground.configure({ file: testFileBuffer, uploadId: UPLOAD_ID }).execute()
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('.stream()', () => {
    it('emits accumulated fields on the complete event', async () => {
      const client = createTestClient();
      const rawSvg = '<svg xmlns="http://www.w3.org/2000/svg"></svg>';
      mockFetchStreamResponse([
        { status: 'processing', message: 'Removing background...' },
        { status: 'generated', message: 'SVG generated', svgText: rawSvg, creditCost: 1 },
        { status: 'complete', message: 'Done', generationId: 'rmbg-stream-001' },
      ]);

      const stream = client.removeBackground
        .configure({ file: testFileBuffer, svgText: true, storage: true })
        .stream();

      const events: any[] = [];
      await new Promise<void>((resolve, reject) => {
        stream.on('data', (event: any) => events.push(event));
        stream.on('end', resolve);
        stream.on('error', reject);
      });

      const completeEvent = events.find(e => e.status === 'complete');
      expect(completeEvent.svgText).toBe(rawSvg);
      expect(completeEvent.creditCost).toBe(1);

      const formData = fetchMock.mock.calls[0][1].body as FormData;
      expect(formData.get('stream')).toBe('true');
    });

    it('emits an error on a non-ok response', async () => {
      const client = createTestClient();
      mockFetchErrorResponse('INTERNAL_ERROR', 500);

      const stream = client.removeBackground.configure({ file: testFileBuffer }).stream();

      await expect(
        new Promise<void>((resolve, reject) => {
          stream.on('data', () => {});
          stream.on('end', resolve);
          stream.on('error', reject);
        })
      ).rejects.toBeDefined();
    });
  });

  describe('authentication', () => {
    it('sends a Bearer token on the streaming path when an access token is configured', async () => {
      const client = createOAuthTestClient();
      mockFetchStreamResponse([{ status: 'complete', message: 'done' }]);

      const stream = client.removeBackground.configure({ file: testFileBuffer }).stream();

      await new Promise<void>((resolve, reject) => {
        stream.on('data', () => {});
        stream.on('end', resolve);
        stream.on('error', reject);
      });

      const [, options] = fetchMock.mock.calls[0];
      expect(options.headers.Authorization).toBe(`Bearer ${TEST_ACCESS_TOKEN}`);
      expect(options.headers['x-api-key']).toBeUndefined();
    });
  });

  describe('error handling', () => {
    it('throws AuthError on INVALID_API_KEY', async () => {
      const client = createTestClient();
      mockFetchErrorResponse('INVALID_API_KEY', 401);

      await expect(
        client.removeBackground.configure({ file: testFileBuffer }).execute()
      ).rejects.toThrow(AuthError);
    });

    it('throws InsufficientCreditsError on INSUFFICIENT_CREDITS', async () => {
      const client = createTestClient();
      mockFetchErrorResponse('INSUFFICIENT_CREDITS', 402);

      await expect(
        client.removeBackground.configure({ file: testFileBuffer }).execute()
      ).rejects.toThrow(InsufficientCreditsError);
    });

    it('throws RateLimitError on RATE_LIMIT_EXCEEDED', async () => {
      const client = createTestClient();
      mockFetchErrorResponse('RATE_LIMIT_EXCEEDED', 429);

      await expect(
        client.removeBackground.configure({ file: testFileBuffer }).execute()
      ).rejects.toThrow(RateLimitError);
    });

    it('throws APIError on a generic server error', async () => {
      const client = createTestClient();
      mockFetchErrorResponse('INTERNAL_ERROR', 500);

      await expect(
        client.removeBackground.configure({ file: testFileBuffer }).execute()
      ).rejects.toThrow(APIError);
    });
  });
});
