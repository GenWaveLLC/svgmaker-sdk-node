import { SVGMakerClient } from '../src';
import { ValidationError } from '../src/errors/CustomErrors';

describe('SVGMakerClient', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should throw an error if no API key is provided', () => {
      expect(() => new SVGMakerClient('')).toThrow(ValidationError);
      expect(() => new SVGMakerClient('')).toThrow('API key is required');
    });

    it('should create a client with default configuration', () => {
      const client = new SVGMakerClient('test-api-key');
      expect(client).toBeInstanceOf(SVGMakerClient);

      const config = client.getConfig();
      expect(config.apiKey).toBe('test-api-key');
      expect(config.baseUrl).toBe('https://api.svgmaker.io');
      expect(config.timeout).toBe(30000);
    });

    it('should create a client with custom configuration', () => {
      const client = new SVGMakerClient('test-api-key', {
        baseUrl: 'http://localhost:3000',
        timeout: 60000,
        maxRetries: 5,
      });

      const config = client.getConfig();
      expect(config.apiKey).toBe('test-api-key');
      expect(config.baseUrl).toBe('http://localhost:3000');
      expect(config.timeout).toBe(60000);
      expect(config.maxRetries).toBe(5);
    });
  });

  describe('setConfig', () => {
    it('should update the configuration', () => {
      const client = new SVGMakerClient('test-api-key');

      client.setConfig({
        timeout: 60000,
        maxRetries: 5,
      });

      const config = client.getConfig();
      expect(config.timeout).toBe(60000);
      expect(config.maxRetries).toBe(5);
      expect(config.baseUrl).toBe('https://api.svgmaker.io');
    });

    it('should return the client instance for chaining', () => {
      const client = new SVGMakerClient('test-api-key');
      const result = client.setConfig({ timeout: 60000 });

      expect(result).toBe(client);
    });
  });

  describe('API clients', () => {
    it('should have generate, edit, and convert clients', () => {
      const client = new SVGMakerClient('test-api-key');

      expect(client.generate).toBeDefined();
      expect(client.edit).toBeDefined();
      expect(client.convert).toBeDefined();
      expect(client.convert.aiVectorize).toBeDefined();
    });

    it('should accept new base64Png and svgText parameters for generate', () => {
      const client = new SVGMakerClient('test-api-key');

      // Should not throw when configuring with new parameters
      expect(() => {
        client.generate.configure({
          prompt: 'Test prompt',
          base64Png: true,
          svgText: true,
        });
      }).not.toThrow();
    });

    it('should accept new base64Png and svgText parameters for edit', () => {
      const client = new SVGMakerClient('test-api-key');

      // Should not throw when configuring with new parameters
      expect(() => {
        client.edit.configure({
          image: Buffer.from('test'),
          prompt: 'Test prompt',
          base64Png: true,
          svgText: true,
        });
      }).not.toThrow();
    });

    it('should accept new svgText parameter for ai-vectorize', () => {
      const client = new SVGMakerClient('test-api-key');

      // Should not throw when configuring with new parameters
      expect(() => {
        client.convert.aiVectorize.configure({
          file: Buffer.from('test'),
          svgText: true,
        });
      }).not.toThrow();
    });

    it('should validate boolean types for new parameters', () => {
      const client = new SVGMakerClient('test-api-key');

      // These should pass validation (will be tested when execute is called with proper mocking)
      expect(() => {
        client.generate.configure({
          prompt: 'Test prompt',
          base64Png: false,
          svgText: false,
        });
      }).not.toThrow();
    });
  });

  describe('interceptors', () => {
    it('should add request interceptors', async () => {
      const client = new SVGMakerClient('test-api-key');
      const interceptor = jest.fn(req => req);

      client.addRequestInterceptor(interceptor);

      // This would be more thoroughly tested in an integration test
      // Here we're just verifying the method exists and returns the client
      expect(client.addRequestInterceptor(interceptor)).toBe(client);
    });

    it('should add response interceptors', async () => {
      const client = new SVGMakerClient('test-api-key');
      const interceptor = jest.fn(res => res);

      client.addResponseInterceptor(interceptor);

      // This would be more thoroughly tested in an integration test
      // Here we're just verifying the method exists and returns the client
      expect(client.addResponseInterceptor(interceptor)).toBe(client);
    });
  });
});
