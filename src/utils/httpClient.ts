import { Readable } from 'stream';
import {
  TimeoutError,
  NetworkError,
  APIError,
  AuthError,
  RateLimitError,
  InsufficientCreditsError,
  ContentSafetyError,
  EndpointDisabledError,
  FileSizeError,
  FileFormatError,
} from '../errors/CustomErrors';
import { SVGMakerConfig } from '../types/config';

/**
 * Additional options for requests
 */
export interface RequestOptions extends globalThis.RequestInit {
  /**
   * Request timeout in milliseconds
   */
  timeout?: number;

  /**
   * Request parameters for query string
   */
  params?: Record<string, string | number | boolean | undefined>;

  /**
   * Form data for multipart/form-data requests
   */
  formData?: globalThis.FormData;

  /**
   * HTTP method
   */
  method?: string;

  /**
   * HTTP headers
   */
  headers?: Record<string, string>;
}

/**
 * HTTP client for making requests to the SVGMaker API
 */
export class HttpClient {
  private config: SVGMakerConfig;

  /**
   * Create a new HTTP client
   * @param config SDK configuration
   */
  constructor(config: SVGMakerConfig) {
    this.config = config;
  }

  /**
   * Make a request to the SVGMaker API
   * @param url Request URL
   * @param options Request options
   * @returns Promise with the response data
   * @throws {APIError} If the API returns an error
   * @throws {TimeoutError} If the request times out
   * @throws {NetworkError} If there's a network error
   */
  public async request<T>(url: string, options: RequestOptions = {}): Promise<T> {
    const fullUrl = this.buildUrl(url, options.params);
    const timeout = options.timeout || this.config.timeout;

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, timeout);

    try {
      // Prepare request options
      const fetchOptions: globalThis.RequestInit = {
        ...options,
        headers: this.buildHeaders(options),
        signal: controller.signal,
      };

      // Handle form data
      if (options.formData) {
        fetchOptions.body = options.formData as any;
        // Let form-data set the content-type header with boundary
        delete (fetchOptions.headers as Record<string, string>)['Content-Type'];
      }

      const response = await fetch(fullUrl, fetchOptions);
      clearTimeout(timeoutId);

      // Handle API errors
      if (!response.ok) {
        throw await this.handleErrorResponse(response);
      }

      // Parse response
      if (response.headers.get('Content-Type')?.includes('application/json')) {
        const jsonResponse = await response.json();

        // Handle v1 envelope response
        if (jsonResponse.success === true && jsonResponse.data !== undefined) {
          // Unwrap the v1 envelope
          const unwrapped = { ...jsonResponse.data, metadata: jsonResponse.metadata };

          // Process base64Png field if present
          if (unwrapped.base64Png && typeof unwrapped.base64Png === 'string') {
            const base64Data = unwrapped.base64Png.replace(/^data:image\/png;base64,/, '');
            unwrapped.pngImageData = Buffer.from(base64Data, 'base64');
          }

          return unwrapped as T;
        } else if (jsonResponse.success === false) {
          // v1 error envelope that came with a 2xx status (unlikely but handle it)
          const errorCode = jsonResponse.error?.code;
          const errorMessage = jsonResponse.error?.message || `API Error`;
          const errorDetails = jsonResponse.error?.details;
          const requestId = jsonResponse.metadata?.requestId;

          if (errorCode === 'INVALID_API_KEY') throw new AuthError(errorMessage);
          if (errorCode === 'INSUFFICIENT_CREDITS')
            throw new InsufficientCreditsError(errorMessage, errorDetails?.creditsRequired);
          if (errorCode === 'RATE_LIMIT_EXCEEDED') throw new RateLimitError(errorMessage, 60);
          if (errorCode === 'CONTENT_POLICY') throw new ContentSafetyError(errorMessage);
          if (errorCode === 'ENDPOINT_DISABLED') throw new EndpointDisabledError(errorMessage);

          throw new APIError(
            errorMessage,
            jsonResponse.error?.status,
            errorCode,
            errorDetails,
            requestId
          );
        }

        // Legacy non-envelope response
        if (jsonResponse.base64Png && typeof jsonResponse.base64Png === 'string') {
          const base64Data = jsonResponse.base64Png.replace(/^data:image\/png;base64,/, '');
          jsonResponse.pngImageData = Buffer.from(base64Data, 'base64');
        }

        return jsonResponse as T;
      } else {
        return (await response.text()) as unknown as T;
      }
    } catch (error: any) {
      clearTimeout(timeoutId);

      // Handle aborted requests (timeouts)
      if (error.name === 'AbortError') {
        throw new TimeoutError(`Request timed out after ${timeout}ms`, timeout);
      }

      // Re-throw API errors
      if (error instanceof APIError) {
        throw error;
      }

      // Handle network errors
      throw new NetworkError(`Network error: ${error.message}`, error);
    }
  }

  /**
   * Make a GET request
   * @param url Request URL
   * @param options Request options
   * @returns Promise with the response data
   */
  public async get<T>(url: string, options: RequestOptions = {}): Promise<T> {
    return this.request<T>(url, {
      ...options,
      method: 'GET',
    });
  }

  /**
   * Make a POST request
   * @param url Request URL
   * @param data Request body data
   * @param options Request options
   * @returns Promise with the response data
   */
  public async post<T>(url: string, data: any, options: RequestOptions = {}): Promise<T> {
    const contentType = options.headers?.['Content-Type'] || 'application/json';

    if (contentType === 'application/json' && typeof data === 'object' && data !== null) {
      return this.request<T>(url, {
        ...options,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        body: JSON.stringify(data),
      });
    } else if (data instanceof globalThis.FormData || options.formData) {
      const formData = data instanceof globalThis.FormData ? data : options.formData;
      return this.request<T>(url, {
        ...options,
        method: 'POST',
        formData,
      });
    } else {
      return this.request<T>(url, {
        ...options,
        method: 'POST',
        body: data,
      });
    }
  }

  /**
   * Create a FormData object from file input
   * @param fieldName Form field name
   * @param file File input (path, buffer, or stream)
   * @returns FormData object
   */
  public async createFormData(
    fieldName: string,
    file: string | Buffer | Readable
  ): Promise<FormData> {
    const formData = new FormData();

    if (typeof file === 'string') {
      // File path - read as buffer and create blob
      const fs = await import('fs');
      const path = await import('path');

      if (!fs.existsSync(file)) {
        throw new Error(`File not found: ${file}`);
      }

      const fileBuffer = fs.readFileSync(file);
      const filename = path.basename(file);
      const blob = new Blob([fileBuffer]);
      formData.append(fieldName, blob, filename);
    } else if (Buffer.isBuffer(file)) {
      // Buffer - convert to blob
      const blob = new Blob([new Uint8Array(file)]);
      formData.append(fieldName, blob, 'file');
    } else if (file instanceof Readable) {
      // Readable stream - convert to buffer then blob
      const chunks: Buffer[] = [];
      for await (const chunk of file) {
        chunks.push(Buffer.from(chunk));
      }
      const buffer = Buffer.concat(chunks);
      const blob = new Blob([buffer]);
      formData.append(fieldName, blob, 'file');
    } else {
      throw new Error(`Unsupported file type: ${typeof file}`);
    }

    return formData;
  }

  /**
   * Build the full URL with query parameters
   * @param url Base URL
   * @param params Query parameters
   * @returns Full URL
   */
  private buildUrl(
    url: string,
    params?: Record<string, string | number | boolean | undefined>
  ): string {
    const baseUrl = url.startsWith('http')
      ? url
      : `${this.config.baseUrl}${url.startsWith('/') ? url : `/${url}`}`;

    if (!params) {
      return baseUrl;
    }

    const queryParams = Object.entries(params)
      .filter(([_, value]) => value !== undefined)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
      .join('&');

    return queryParams ? `${baseUrl}?${queryParams}` : baseUrl;
  }

  /**
   * Build request headers
   * @param options Request options
   * @returns Headers object
   */
  private buildHeaders(options: RequestOptions): Record<string, string> {
    const headers: Record<string, string> = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'x-api-key': this.config.apiKey,
      ...(options.headers as Record<string, string>),
    };

    return headers;
  }

  /**
   * Handle API error responses
   * @param response Error response
   * @returns Error object
   */
  private async handleErrorResponse(response: globalThis.Response): Promise<Error> {
    let body: any = {};

    try {
      if (response.headers.get('Content-Type')?.includes('application/json')) {
        body = await response.json();
      } else {
        body = { error: await response.text() };
      }
    } catch {
      body = { error: `HTTP Error ${response.status}` };
    }

    // Extract v1 error envelope fields
    const errorCode = body.error?.code;
    const errorStatus = body.error?.status || response.status;
    const errorMessage =
      body.error?.message || body.error || body.details || `HTTP Error ${response.status}`;
    const errorDetails = body.error?.details;
    const requestId = body.metadata?.requestId;

    // Map by v1 error code first
    if (errorCode) {
      switch (errorCode) {
        case 'INVALID_API_KEY':
          return new AuthError(errorMessage);

        case 'INSUFFICIENT_CREDITS':
          return new InsufficientCreditsError(errorMessage, errorDetails?.creditsRequired);

        case 'RATE_LIMIT_EXCEEDED': {
          const retryAfter = parseInt(
            response.headers.get('x-ratelimit-reset-requests') ||
              response.headers.get('Retry-After') ||
              '60',
            10
          );
          return new RateLimitError(errorMessage, retryAfter);
        }

        case 'CONTENT_POLICY':
          return new ContentSafetyError(errorMessage);

        case 'ENDPOINT_DISABLED':
          return new EndpointDisabledError(errorMessage);
      }
    }

    // Fallback to HTTP status code mapping
    switch (response.status) {
      case 401:
        return new AuthError(errorMessage);

      case 402:
        return new InsufficientCreditsError(errorMessage, errorDetails?.creditsRequired);

      case 413:
        return new FileSizeError(errorMessage);

      case 429:
        return new RateLimitError(
          errorMessage,
          parseInt(response.headers.get('Retry-After') || '60', 10)
        );
    }

    // Handle file format errors by message content
    if (
      errorMessage.includes('file format') ||
      errorMessage.includes('SVG files are already in vector format')
    ) {
      return new FileFormatError(errorMessage);
    }

    // Generic API error with all extracted fields
    return new APIError(errorMessage, errorStatus, errorCode, errorDetails, requestId);
  }
}
