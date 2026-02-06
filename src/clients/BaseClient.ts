import { SVGMakerClient } from '../core/SVGMakerClient';
import { HttpClient, RequestOptions } from '../utils/httpClient';
import { SVGMakerConfig } from '../types/config';
import {
  ValidationError,
  APIError,
  AuthError,
  RateLimitError,
  InsufficientCreditsError,
  ContentSafetyError,
  FileSizeError,
  FileFormatError,
  EndpointDisabledError,
} from '../errors/CustomErrors';
import { ResponseMetadata } from '../types/api';
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

  /**
   * Map a v1 API error object to the appropriate SDK error class
   */
  protected mapApiError(
    errorObj: {
      code?: string;
      status?: number;
      message?: string;
      details?: Record<string, unknown>;
    },
    requestId?: string
  ): Error {
    const message = errorObj.message || 'Unknown API error';
    const code = errorObj.code || '';
    const status = errorObj.status || 500;

    switch (code) {
      case 'INVALID_API_KEY':
        return new AuthError(message);
      case 'INSUFFICIENT_CREDITS':
        return new InsufficientCreditsError(
          message,
          (errorObj.details?.creditsRequired as number) ?? undefined
        );
      case 'RATE_LIMIT_EXCEEDED':
        return new RateLimitError(message);
      case 'CONTENT_POLICY':
        return new ContentSafetyError(message);
      case 'ENDPOINT_DISABLED':
        return new EndpointDisabledError(message);
    }

    // Fallback on HTTP status
    switch (status) {
      case 401:
        return new AuthError(message);
      case 402:
        return new InsufficientCreditsError(
          message,
          (errorObj.details?.creditsRequired as number) ?? undefined
        );
      case 413:
        return new FileSizeError(message);
      case 429:
        return new RateLimitError(message);
    }

    if (message.includes('file format') || message.includes('already in vector format')) {
      return new FileFormatError(message);
    }

    return new APIError(message, status, code, errorObj.details, requestId);
  }

  /**
   * Unwrap a v1 API response envelope. Throws on error envelope.
   * @returns Object with data and metadata
   */
  protected unwrapEnvelope<T>(raw: any): { data: T; metadata: ResponseMetadata } {
    if (raw.success === true && raw.data !== undefined) {
      return { data: raw.data as T, metadata: raw.metadata };
    }
    if (raw.success === false) {
      throw this.mapApiError(raw.error || {}, raw.metadata?.requestId);
    }
    // Legacy fallback for non-envelope responses
    return {
      data: raw as T,
      metadata: { requestId: '', creditsUsed: 0, creditsRemaining: 0 },
    };
  }

  /**
   * Handle an error response from raw fetch calls by parsing the v1 error envelope
   */
  protected async handleFetchErrorResponse(response: globalThis.Response): Promise<never> {
    let errorData: any = {};
    try {
      const contentType = response.headers.get('Content-Type');
      if (contentType?.includes('application/json')) {
        errorData = await response.json();
      } else {
        errorData = { error: { message: await response.text() } };
      }
    } catch {
      errorData = { error: { message: `HTTP Error ${response.status}` } };
    }

    if (errorData.success === false && errorData.error) {
      throw this.mapApiError(errorData.error, errorData.metadata?.requestId);
    }

    // Fallback
    const message = errorData.error?.message || errorData.error || `HTTP Error ${response.status}`;
    throw new APIError(
      typeof message === 'string' ? message : `HTTP Error ${response.status}`,
      response.status
    );
  }
}
