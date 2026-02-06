import { SVGMakerConfig, DEFAULT_CONFIG } from '../types/config';
import { HttpClient, RequestOptions } from '../utils/httpClient';
import { ValidationError } from '../errors/CustomErrors';
import { GenerateClient } from '../clients/GenerateClient';
import { EditClient } from '../clients/EditClient';
import { AIVectorizeClient } from '../clients/convert';
import { createRetryWrapper } from '../utils/retry';
import { createRateLimiter } from '../utils/rateLimit';
import { Logger, createLogger } from '../utils/logger';

/**
 * Request interceptor function type
 */
export type RequestInterceptor = (request: Request) => Request | Promise<Request>;

/**
 * Response interceptor function type
 */
export type ResponseInterceptor = <T>(response: T) => T | Promise<T>;

/**
 * Main SVGMaker client
 */
export class SVGMakerClient {
  /**
   * The current SDK configuration
   */
  private config: SVGMakerConfig;

  /**
   * HTTP client for making API requests
   */
  private httpClient: HttpClient;

  /**
   * Request interceptors
   */
  private requestInterceptors: RequestInterceptor[] = [];

  /**
   * Response interceptors
   */
  private responseInterceptors: ResponseInterceptor[] = [];

  /**
   * Logger instance
   */
  private logger: Logger;

  /**
   * Generate SVG client
   */
  public readonly generate: GenerateClient;

  /**
   * Edit SVG/Image client
   */
  public readonly edit: EditClient;

  /**
   * Convert namespace — contains AI vectorize and future conversion clients
   */
  public readonly convert: {
    /** AI-powered raster to SVG vectorization */
    aiVectorize: AIVectorizeClient;
  };

  /**
   * Create a new SVGMaker client
   * @param apiKey API key for authentication
   * @param config Additional configuration options
   */
  constructor(apiKey: string, config: Partial<SVGMakerConfig> = {}) {
    if (!apiKey) {
      throw new ValidationError('API key is required');
    }

    // Merge default config with provided config
    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
      apiKey,
    };

    // Initialize logger
    this.logger = createLogger(this.config);

    // Create HTTP client
    this.httpClient = new HttpClient(this.config);

    // Apply retry wrapper and rate limiting
    const wrappedRequest = this.wrapRequestWithRetryAndRateLimit(
      this.httpClient.request.bind(this.httpClient)
    );
    this.httpClient.request = wrappedRequest;

    // Add built-in response interceptor for base64 image decoding
    this.addResponseInterceptor(this.decodeBase64Images.bind(this));

    // Create API clients
    this.generate = new GenerateClient(this);
    this.edit = new EditClient(this);
    this.convert = {
      aiVectorize: new AIVectorizeClient(this),
    };

    this.logger.info('SVGMaker SDK initialized');
  }

  /**
   * Wrap request method with retry and rate limiting
   * @param request Original request method
   * @returns Wrapped request method
   */
  private wrapRequestWithRetryAndRateLimit(request: HttpClient['request']): HttpClient['request'] {
    return async <T>(url: string, options?: RequestOptions) => {
      const retryWrapper = createRetryWrapper<T>(this.config);
      const rateLimiter = createRateLimiter<T>(this.config);

      const wrappedRequest = rateLimiter(retryWrapper((u, o) => request<T>(u, o)));
      return wrappedRequest(url, options);
    };
  }

  /**
   * Get the current configuration
   * @returns Current configuration
   */
  public getConfig(): SVGMakerConfig {
    return { ...this.config };
  }

  /**
   * Update the client configuration
   * @param config Configuration options to update
   * @returns This client instance for chaining
   */
  public setConfig(config: Partial<SVGMakerConfig>): SVGMakerClient {
    this.config = {
      ...this.config,
      ...config,
    };
    this.logger.info('Configuration updated', config);
    return this;
  }

  /**
   * Get the HTTP client
   * @returns HTTP client
   */
  public getHttpClient(): HttpClient {
    return this.httpClient;
  }

  /**
   * Add a request interceptor
   * @param interceptor Request interceptor function
   * @returns This client instance for chaining
   */
  public addRequestInterceptor(interceptor: RequestInterceptor): SVGMakerClient {
    this.requestInterceptors.push(interceptor);
    this.logger.debug('Request interceptor added');
    return this;
  }

  /**
   * Add a response interceptor
   * @param interceptor Response interceptor function
   * @returns This client instance for chaining
   */
  public addResponseInterceptor(interceptor: ResponseInterceptor): SVGMakerClient {
    this.responseInterceptors.push(interceptor);
    this.logger.debug('Response interceptor added');
    return this;
  }

  /**
   * Apply request interceptors to a request
   * @param request Request to intercept
   * @returns Modified request
   */
  public async applyRequestInterceptors(request: Request): Promise<Request> {
    let interceptedRequest = request;

    for (const interceptor of this.requestInterceptors) {
      interceptedRequest = await interceptor(interceptedRequest);
    }

    return interceptedRequest;
  }

  /**
   * Apply response interceptors to a response
   * @param response Response to intercept
   * @returns Modified response
   */
  public async applyResponseInterceptors<T>(response: T): Promise<T> {
    let interceptedResponse = response;

    for (const interceptor of this.responseInterceptors) {
      interceptedResponse = await interceptor(interceptedResponse);
    }

    return interceptedResponse;
  }

  /**
   * Built-in response interceptor to decode base64 PNG images
   * @param response Response to process
   * @returns Response with decoded image data
   */
  private decodeBase64Images<T>(response: T): T {
    // Type guard to check if response has base64Png property
    if (typeof response === 'object' && response !== null && 'base64Png' in response) {
      const responseWithBase64 = response as any;

      if (typeof responseWithBase64.base64Png === 'string') {
        // Strip data URL prefix if present and decode base64
        const base64Data = responseWithBase64.base64Png.replace(/^data:image\/png;base64,/, '');
        const pngImageData = Buffer.from(base64Data, 'base64');

        // Create new response object with pngImageData instead of base64Png
        const { base64Png: _base64Png, ...responseWithoutBase64 } = responseWithBase64;
        return {
          ...responseWithoutBase64,
          pngImageData,
        } as T;
      }
    }

    return response;
  }

  /**
   * Get the logger instance
   * @returns Logger instance
   */
  public getLogger(): Logger {
    return this.logger;
  }
}
