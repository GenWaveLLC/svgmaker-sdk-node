import { SVGMakerClient } from '../core/SVGMakerClient';
import { HttpClient, RequestOptions } from '../utils/httpClient';
import { SVGMakerConfig } from '../types/config';
import { ValidationError } from '../errors/CustomErrors';
import { z } from 'zod';

/**
 * Base client for API endpoints
 * Provides common functionality for all API clients
 */
export abstract class BaseClient {
  /**
   * Parent SVGMaker client
   */
  protected client: SVGMakerClient;

  /**
   * HTTP client for making API requests
   */
  protected httpClient: HttpClient;

  /**
   * Current SDK configuration
   */
  protected config: SVGMakerConfig;

  /**
   * Create a new base client
   * @param client Parent SVGMaker client
   */
  constructor(client: SVGMakerClient) {
    this.client = client;
    this.httpClient = client.getHttpClient();
    this.config = client.getConfig();
  }

  /**
   * Validate request data against a schema
   * @param data Data to validate
   * @param schema Zod schema to validate against
   * @throws {ValidationError} If validation fails
   */
  protected validateRequest<T>(data: T, schema: z.ZodType<T>): void {
    const result = schema.safeParse(data);

    if (!result.success) {
      const { issues } = result.error;
      const errorMessages = issues
        .map(issue => `${issue.path.join('.')}: ${issue.message}`)
        .join(', ');
      throw new ValidationError(`Validation failed: ${errorMessages}`);
    }
  }

  /**
   * Handle an API request with retries, rate limiting, and caching
   * @param url Request URL
   * @param options Request options
   * @returns Response data
   */
  protected async handleRequest<T>(url: string, options: RequestOptions = {}): Promise<T> {
    // Apply request interceptors
    if (options instanceof Request) {
      options = (await this.client.applyRequestInterceptors(options)) as unknown as RequestOptions;
    }

    // Make the request
    const response = await this.httpClient.request<T>(url, options);

    // Apply response interceptors
    return await this.client.applyResponseInterceptors(response);
  }

  /**
   * Create a new instance of this client
   * This should be implemented by child classes to support method chaining
   * @returns New client instance
   */
  protected abstract clone(): BaseClient;

  /**
   * Copy client properties to a new instance
   * @param target Target instance
   */
  protected copyTo(target: BaseClient): void {
    target.client = this.client;
    target.httpClient = this.httpClient;
    target.config = this.config;
  }
}
