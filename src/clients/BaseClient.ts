import { SVGMakerClient } from '../core/SVGMakerClient';
import { HttpClient, RequestOptions } from '../utils/httpClient';
import { SVGMakerConfig } from '../types/config';
import { ValidationError } from '../errors/CustomErrors';
import { Logger } from '../utils/logger';
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
   * Logger instance
   */
  protected logger: Logger;

  /**
   * Create a new base client
   * @param client Parent SVGMaker client
   */
  constructor(client: SVGMakerClient) {
    this.client = client;
    this.httpClient = client.getHttpClient();
    this.config = client.getConfig();
    this.logger = client.getLogger();
  }

  /**
   * Validate request data against a schema
   * @param data Data to validate
   * @param schema Zod schema to validate against
   * @throws {ValidationError} If validation fails
   */
  protected validateRequest<T>(data: T, schema: z.ZodType<T>): void {
    this.logger.debug('Validating request parameters', { data });

    const result = schema.safeParse(data);

    if (!result.success) {
      const { issues } = result.error;
      const errorMessages = issues
        .map(issue => `${issue.path.join('.')}: ${issue.message}`)
        .join(', ');
      this.logger.error('Request validation failed', { errors: errorMessages });
      throw new ValidationError(`Validation failed: ${errorMessages}`);
    }

    this.logger.debug('Request validation passed');
  }

  /**
   * Handle an API request with retries, rate limiting, and caching
   * @param url Request URL
   * @param options Request options
   * @returns Response data
   */
  protected async handleRequest<T>(url: string, options: RequestOptions = {}): Promise<T> {
    this.logger.debug(`Making API request to ${url}`, { method: options.method || 'GET' });

    try {
      // Apply request interceptors
      if (options instanceof Request) {
        options = (await this.client.applyRequestInterceptors(
          options
        )) as unknown as RequestOptions;
      }

      // Make the request
      const response = await this.httpClient.request<T>(url, options);

      this.logger.debug(`API request completed successfully`, {
        url,
        method: options.method || 'GET',
      });

      // Apply response interceptors
      return await this.client.applyResponseInterceptors(response);
    } catch (error) {
      this.logger.error(`API request failed`, {
        url,
        method: options.method || 'GET',
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
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
    target.logger = this.logger;
  }
}
