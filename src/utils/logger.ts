import { SVGMakerConfig } from '../types/config';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

/**
 * Logger class for SVGMaker SDK
 */
export class Logger {
  private readonly config: SVGMakerConfig;

  constructor(config: SVGMakerConfig) {
    this.config = config;
  }

  /**
   * Log a debug message
   * @param message Message to log
   * @param args Additional arguments
   */
  public debug(message: string, ...args: any[]): void {
    this.log('debug', message, ...args);
  }

  /**
   * Log an info message
   * @param message Message to log
   * @param args Additional arguments
   */
  public info(message: string, ...args: any[]): void {
    this.log('info', message, ...args);
  }

  /**
   * Log a warning message
   * @param message Message to log
   * @param args Additional arguments
   */
  public warn(message: string, ...args: any[]): void {
    this.log('warn', message, ...args);
  }

  /**
   * Log an error message
   * @param message Message to log
   * @param args Additional arguments
   */
  public error(message: string, ...args: any[]): void {
    this.log('error', message, ...args);
  }

  /**
   * Log a message at the specified level
   * @param level Log level
   * @param message Message to log
   * @param args Additional arguments
   */
  private log(level: LogLevel, message: string, ...args: any[]): void {
    if (!this.config.logging || !this.shouldLog(level)) {
      return;
    }

    const timestamp = new Date().toISOString();
    const prefix = `[SVGMaker SDK][${timestamp}][${level.toUpperCase()}]`;

    if (args.length > 0) {
      console[level](`${prefix} ${message}`, ...args);
    } else {
      console[level](`${prefix} ${message}`);
    }
  }

  /**
   * Check if a message at the given level should be logged
   * @param level Log level to check
   * @returns True if the message should be logged
   */
  private shouldLog(level: LogLevel): boolean {
    const configLevel = LOG_LEVELS[this.config.logLevel];
    const messageLevel = LOG_LEVELS[level];
    return messageLevel >= configLevel;
  }
}

/**
 * Create a logger instance
 * @param config SDK configuration
 * @returns Logger instance
 */
export function createLogger(config: SVGMakerConfig): Logger {
  return new Logger(config);
}
