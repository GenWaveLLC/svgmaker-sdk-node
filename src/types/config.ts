/**
 * SVGMaker SDK configuration options
 */
export interface SVGMakerConfig {
  /**
   * API key for authentication
   */
  apiKey: string;

  /**
   * Base URL for the SVGMaker API
   * @default "https://api.svgmaker.io"
   */
  baseUrl: string;

  /**
   * Default timeout for API requests in milliseconds
   * @default 30000 (30 seconds)
   */
  timeout: number;

  /**
   * Maximum number of retries for failed requests
   * @default 3
   */
  maxRetries: number;

  /**
   * Retry backoff factor in milliseconds
   * @default 300
   */
  retryBackoffFactor: number;

  /**
   * Status codes that should trigger a retry
   * @default [408, 429, 500, 502, 503, 504]
   */
  retryStatusCodes: number[];

  /**
   * Enable request/response logging
   * @default false
   */
  logging: boolean;

  /**
   * Log level
   * @default "info"
   */
  logLevel: 'debug' | 'info' | 'warn' | 'error';

  /**
   * Enable request caching
   * @default false
   */
  caching: boolean;

  /**
   * Cache TTL in milliseconds
   * @default 300000 (5 minutes)
   */
  cacheTTL: number;

  /**
   * Maximum number of requests per minute
   * @default 60
   */
  rateLimit: number;
}

/**
 * Default configuration for the SVGMaker SDK
 */
export const DEFAULT_CONFIG: SVGMakerConfig = {
  apiKey: '',
  baseUrl: 'https://api.svgmaker.io',
  timeout: 30000,
  maxRetries: 3,
  retryBackoffFactor: 300,
  retryStatusCodes: [408, 429, 500, 502, 503, 504],
  logging: false,
  logLevel: 'info',
  caching: false,
  cacheTTL: 300000, // 5 minutes
  rateLimit: 60, // Default to 60 requests per minute
};
