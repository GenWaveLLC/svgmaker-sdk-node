/**
 * Base error class for SVGMaker SDK
 */
export class SVGMakerError extends Error {
  /**
   * @param message Error message
   */
  constructor(message: string) {
    super(message);
    this.name = 'SVGMakerError';
    Object.setPrototypeOf(this, SVGMakerError.prototype);
  }
}

/**
 * Error for validation failures
 */
export class ValidationError extends SVGMakerError {
  /**
   * @param message Error message
   */
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/**
 * Error for API response errors
 */
export class APIError extends SVGMakerError {
  /**
   * HTTP status code
   */
  public statusCode?: number;

  /**
   * Error code returned by the API
   */
  public code?: string;

  /**
   * Error details returned by the API
   */
  public details?: unknown;

  /**
   * Request ID from the API response metadata
   */
  public requestId?: string;

  /**
   * @param message Error message
   * @param statusCode HTTP status code
   * @param code Error code
   * @param details Error details
   * @param requestId Request ID from the API response metadata
   */
  constructor(
    message: string,
    statusCode?: number,
    code?: string,
    details?: unknown,
    requestId?: string
  ) {
    super(message);
    this.name = 'APIError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.requestId = requestId;
    Object.setPrototypeOf(this, APIError.prototype);
  }
}

/**
 * Error for rate limiting issues
 */
export class RateLimitError extends APIError {
  /**
   * Time in seconds to wait before retrying
   */
  public retryAfter?: number;

  /**
   * @param message Error message
   * @param retryAfter Time in seconds to wait before retrying
   */
  constructor(message: string, retryAfter?: number) {
    super(message, 429);
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
    Object.setPrototypeOf(this, RateLimitError.prototype);
  }
}

/**
 * Error for authorization issues
 */
export class AuthError extends APIError {
  /**
   * @param message Error message
   */
  constructor(message: string) {
    super(message, 401);
    this.name = 'AuthError';
    Object.setPrototypeOf(this, AuthError.prototype);
  }
}

/**
 * Error for insufficient credits
 */
export class InsufficientCreditsError extends APIError {
  /**
   * Number of credits required
   */
  public creditsRequired?: number;

  /**
   * @param message Error message
   * @param creditsRequired Number of credits required
   */
  constructor(message: string, creditsRequired?: number) {
    super(message, 402);
    this.name = 'InsufficientCreditsError';
    this.creditsRequired = creditsRequired;
    Object.setPrototypeOf(this, InsufficientCreditsError.prototype);
  }
}

/**
 * Error for timeout issues
 */
export class TimeoutError extends SVGMakerError {
  /**
   * Request timeout in milliseconds
   */
  public timeout: number;

  /**
   * @param message Error message
   * @param timeout Request timeout in milliseconds
   */
  constructor(message: string, timeout: number) {
    super(message);
    this.name = 'TimeoutError';
    this.timeout = timeout;
    Object.setPrototypeOf(this, TimeoutError.prototype);
  }
}

/**
 * Error for network issues
 */
export class NetworkError extends SVGMakerError {
  /**
   * Original error
   */
  public originalError?: Error;

  /**
   * @param message Error message
   * @param originalError Original error
   */
  constructor(message: string, originalError?: Error) {
    super(message);
    this.name = 'NetworkError';
    this.originalError = originalError;
    Object.setPrototypeOf(this, NetworkError.prototype);
  }
}

/**
 * Error for content safety issues
 */
export class ContentSafetyError extends APIError {
  /**
   * @param message Error message
   */
  constructor(message: string) {
    super(message, 422, 'CONTENT_POLICY');
    this.name = 'ContentSafetyError';
    Object.setPrototypeOf(this, ContentSafetyError.prototype);
  }
}

/**
 * Error for disabled endpoint
 */
export class EndpointDisabledError extends APIError {
  /**
   * @param message Error message
   */
  constructor(message: string) {
    super(message, 503, 'ENDPOINT_DISABLED');
    this.name = 'EndpointDisabledError';
    Object.setPrototypeOf(this, EndpointDisabledError.prototype);
  }
}

/**
 * Error for file size issues
 */
export class FileSizeError extends APIError {
  /**
   * @param message Error message
   */
  constructor(message: string) {
    super(message, 413);
    this.name = 'FileSizeError';
    Object.setPrototypeOf(this, FileSizeError.prototype);
  }
}

/**
 * Error for file format issues
 */
export class FileFormatError extends APIError {
  /**
   * @param message Error message
   */
  constructor(message: string) {
    super(message, 400);
    this.name = 'FileFormatError';
    Object.setPrototypeOf(this, FileFormatError.prototype);
  }
}
