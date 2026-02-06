import { SVGMakerClient } from '../src/core/SVGMakerClient';

describe('V1 API Validation Constraints', () => {
  let client: SVGMakerClient;

  beforeEach(() => {
    client = new SVGMakerClient('test-key', {
      baseUrl: 'https://api.test.com',
    });
  });

  describe('GenerateClient', () => {
    it('should accept all quality levels without aspectRatio constraints', () => {
      // In v1 API, all quality levels support all aspect ratios
      expect(() => {
        client.generate.configure({
          prompt: 'test prompt',
          quality: 'low',
          aspectRatio: 'landscape',
        });
      }).not.toThrow();

      expect(() => {
        client.generate.configure({
          prompt: 'test prompt',
          quality: 'medium',
          aspectRatio: 'portrait',
        });
      }).not.toThrow();

      expect(() => {
        client.generate.configure({
          prompt: 'test prompt',
          quality: 'high',
          aspectRatio: 'auto',
        });
      }).not.toThrow();
    });

    it('should reject invalid aspectRatio values', async () => {
      const generateClient = client.generate.configure({
        prompt: 'test prompt',
        quality: 'low',
        aspectRatio: 'wide' as any,
      });

      await expect(generateClient.execute()).rejects.toThrow();
    });

    it('should accept v1 style params', () => {
      expect(() => {
        client.generate.configure({
          prompt: 'test prompt',
          styleParams: {
            style: 'line_art',
            color_mode: 'few_colors',
            image_complexity: 'scene',
            text: 'only_title',
            composition: 'objects_in_grid',
          },
        });
      }).not.toThrow();
    });

    it('should accept storage parameter', () => {
      expect(() => {
        client.generate.configure({
          prompt: 'test prompt',
          storage: true,
        });
      }).not.toThrow();
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

    it('should accept all quality levels', () => {
      expect(() => {
        client.edit.configure({
          image: 'test.png',
          prompt: 'test prompt',
          quality: 'high',
        });
      }).not.toThrow();

      expect(() => {
        client.edit.configure({
          image: 'test.png',
          prompt: 'test prompt',
          quality: 'low',
        });
      }).not.toThrow();
    });

    it('should reject invalid aspectRatio values', async () => {
      const editClient = client.edit.configure({
        image: 'test.png',
        prompt: 'test prompt',
        aspectRatio: 'wide' as any,
      });

      await expect(editClient.execute()).rejects.toThrow();
    });

    it('should allow valid aspectRatio values', () => {
      const editClient = client.edit.configure({
        image: 'test.png',
        prompt: 'test prompt',
        aspectRatio: 'square',
      });

      expect((editClient as any).params.aspectRatio).toBe('square');
    });

    it('should require either prompt or styleParams', async () => {
      const editClient = client.edit.configure({
        image: 'test.png',
        // no prompt and no styleParams
      });

      await expect(editClient.execute()).rejects.toThrow(
        'Either prompt or styleParams must be provided'
      );
    });

    it('should accept styleParams without prompt', () => {
      expect(() => {
        client.edit.configure({
          image: 'test.png',
          styleParams: {
            style: 'flat',
            color_mode: 'monochrome',
          },
        });
      }).not.toThrow();
    });
  });
});
