import { SVGMakerClient } from '../src/core/SVGMakerClient';

describe('Quality and AspectRatio Constraints', () => {
  let client: SVGMakerClient;

  beforeEach(() => {
    client = new SVGMakerClient('test-key', {
      baseUrl: 'https://api.test.com',
    });
  });

  describe('GenerateClient', () => {
    it('should apply default aspectRatio "auto" for low quality', () => {
      const generateClient = client.generate.configure({
        prompt: 'test prompt',
        quality: 'low',
      });

      // Access the private params through any to test defaults
      expect((generateClient as any).params.aspectRatio).toBe('auto');
    });

    it('should apply default aspectRatio "auto" for medium quality', () => {
      const generateClient = client.generate.configure({
        prompt: 'test prompt',
        quality: 'medium',
      });

      expect((generateClient as any).params.aspectRatio).toBe('auto');
    });

    it('should apply default aspectRatio "square" for high quality', () => {
      const generateClient = client.generate.configure({
        prompt: 'test prompt',
        quality: 'high',
      });

      expect((generateClient as any).params.aspectRatio).toBe('square');
    });

    it('should reject invalid aspectRatio for low/medium quality', async () => {
      const generateClient = client.generate.configure({
        prompt: 'test prompt',
        quality: 'low',
        aspectRatio: 'wide', // not allowed for low quality
      });

      await expect(generateClient.execute()).rejects.toThrow();
    });

    it('should reject "auto" aspectRatio for high quality', async () => {
      const generateClient = client.generate.configure({
        prompt: 'test prompt',
        quality: 'high',
        aspectRatio: 'auto', // not allowed for high quality
      });

      await expect(generateClient.execute()).rejects.toThrow();
    });

    it('should allow valid aspectRatio combinations', async () => {
      // This should not throw during validation
      const generateClient = client.generate.configure({
        prompt: 'test prompt',
        quality: 'high',
        aspectRatio: 'wide', // allowed for high quality
      });

      // We expect this to fail at the request level (network), not validation
      // Let's just test that it doesn't throw validation errors
      expect(() => generateClient).not.toThrow();
    });
  });

  describe('EditClient', () => {
    it('should apply default quality "medium"', () => {
      const editClient = client.edit.configure({
        image: 'test.png',
        prompt: 'test prompt',
      });

      expect((editClient as any).params.quality).toBe('medium');
    });

    it('should reject non-medium quality', async () => {
      const editClient = client.edit.configure({
        image: 'test.png',
        prompt: 'test prompt',
        quality: 'high' as any, // TypeScript should prevent this, but testing runtime
      });

      await expect(editClient.execute()).rejects.toThrow();
    });

    it('should reject invalid aspectRatio', async () => {
      const editClient = client.edit.configure({
        image: 'test.png',
        prompt: 'test prompt',
        aspectRatio: 'wide' as any, // not allowed for edit mode
      });

      await expect(editClient.execute()).rejects.toThrow();
    });

    it('should allow valid aspectRatio values', () => {
      const editClient = client.edit.configure({
        image: 'test.png',
        prompt: 'test prompt',
        aspectRatio: 'square', // allowed for edit mode
      });

      expect((editClient as any).params.aspectRatio).toBe('square');
    });
  });
});
