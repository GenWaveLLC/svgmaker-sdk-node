import retry from 'async-retry';
import { SVGMakerConfig } from '../types/config';
import { ValidationError, AuthError, NetworkError, TimeoutError } from '../errors/CustomErrors';
import { RequestOptions } from './httpClient';

interface RetryableError extends Error {
  statusCode?: number;
  name: string;
}

// Custom error class to signal that retries should be aborted
export class AbortError extends Error {
  readonly name = 'AbortError';
  readonly aborted = true;
}

/**
 * Creates a retry wrapper for API requests
 * @param config SDK configuration containing retry settings
 * @returns Function that wraps API calls with retry logic
 */
export function createRetryWrapper<T>(config: SVGMakerConfig) {
  return function retryWrapper(
    fn: (url: string, options?: RequestOptions) => Promise<T>
  ): typeof fn {
    return async (url: string, options?: RequestOptions): Promise<T> => {
      return retry(
        async (bail, attemptNumber) => {
          if (config.logging) {
            console.log(`Attempt ${attemptNumber} starting...`);
          }

          try {
            return await fn(url, options);
          } catch (error) {
            const err = error as RetryableError;

            // Don't retry on validation errors or auth errors
            if (err instanceof ValidationError || err instanceof AuthError) {
              bail(new AbortError(err.message));
              throw new AbortError(err.message); // This will never execute but satisfies TypeScript
            }

            // Retry on configured status codes
            if (err.statusCode && config.retryStatusCodes.includes(err.statusCode)) {
              if (config.logging) {
                console.log(`Retrying due to status code ${err.statusCode}`);
              }
              throw err;
            }

            // Retry on network errors
            if (err instanceof NetworkError || err instanceof TimeoutError) {
              if (config.logging) {
                console.log(`Retrying due to network/timeout error: ${err.message}`);
              }
              throw err;
            }

            // Don't retry on other errors
            bail(new AbortError(err.message));
            throw new AbortError(err.message); // This will never execute but satisfies TypeScript
          }
        },
        {
          retries: config.maxRetries,
          factor: config.retryBackoffFactor / 1000, // Convert ms to seconds
          minTimeout: 1000,
          maxTimeout: 60000,
          randomize: true,
          onRetry: (error, attemptNumber) => {
            if (config.logging) {
              console.log(`Attempt ${attemptNumber} failed. Retrying...`);
            }
          },
        }
      );
    };
  };
}
