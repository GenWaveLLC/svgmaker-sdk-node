import { BaseClient } from './BaseClient';
import { SVGMakerClient } from '../core/SVGMakerClient';
import { z } from 'zod';
import { AccountResponse, AccountUsageParams, AccountUsageResponse } from '../types/api';

/**
 * Schema for validating usage parameters
 */
const usageParamsSchema = z
  .object({
    days: z.number().int().positive().optional(),
    start: z.string().optional(),
    end: z.string().optional(),
  })
  .strict()
  .refine(
    data => !(data.days !== undefined && (data.start !== undefined || data.end !== undefined)),
    { message: 'Use either days or start/end, not both.' }
  )
  .refine(
    data => {
      if (data.start !== undefined || data.end !== undefined) {
        return data.start !== undefined && data.end !== undefined;
      }
      return true;
    },
    { message: 'Both start and end dates are required when using date range.' }
  )
  .optional();

/**
 * Client for the Account API
 * Provides methods to get account information and usage statistics
 */
export class AccountClient extends BaseClient {
  /**
   * Create a new Account client
   * @param client Parent SVGMaker client
   */
  constructor(client: SVGMakerClient) {
    super(client);
  }

  /**
   * Get account information including email, display name, account type, and credit balance
   * @returns Account information
   */
  async getInfo(): Promise<AccountResponse> {
    this.logger.debug('Getting account information');

    return this.handleRequest<AccountResponse>('/v1/account', { method: 'GET' });
  }

  /**
   * Get API usage statistics for your account
   * @param params Optional parameters for date filtering (days or start/end range)
   * @returns Usage statistics
   */
  async getUsage(params?: AccountUsageParams): Promise<AccountUsageResponse> {
    this.logger.debug('Getting usage statistics', { params });

    // Validate parameters
    if (params) {
      this.validateRequest(params, usageParamsSchema as z.ZodType<typeof params>);
    }

    const queryParams: Record<string, string> = {};
    if (params?.days !== undefined) queryParams.days = String(params.days);
    if (params?.start !== undefined) queryParams.start = params.start;
    if (params?.end !== undefined) queryParams.end = params.end;

    return this.handleRequest<AccountUsageResponse>('/v1/account/usage', {
      method: 'GET',
      params: Object.keys(queryParams).length > 0 ? queryParams : undefined,
    });
  }

  /**
   * Create a clone of this client
   * @returns New client instance
   */
  protected clone(): AccountClient {
    return new AccountClient(this.client);
  }
}
