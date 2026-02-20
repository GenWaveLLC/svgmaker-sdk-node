import { BaseClient } from './BaseClient';
import { SVGMakerClient } from '../core/SVGMakerClient';
import { z } from 'zod';
import {
  GenerationsListParams,
  GenerationsListResponse,
  GenerationResponse,
  GenerationDeleteResponse,
  GenerationShareResponse,
  GenerationDownloadParams,
  GenerationDownloadResponse,
} from '../types/api';

/**
 * Schema for validating list parameters
 */
const listParamsSchema = z
  .object({
    page: z.number().int().positive().optional(),
    limit: z.number().int().min(1).max(100).optional(),
    type: z.union([z.string(), z.array(z.string())]).optional(),
    hashtags: z.union([z.string(), z.array(z.string())]).optional(),
    categories: z.union([z.string(), z.array(z.string())]).optional(),
    query: z.string().optional(),
  })
  .strict()
  .optional();

/**
 * Schema for validating download parameters
 */
const downloadParamsSchema = z
  .object({
    format: z.enum(['svg', 'webp', 'png', 'svg-optimized', 'svgz']).optional(),
    optimize: z.boolean().optional(),
  })
  .strict()
  .optional();

/**
 * Schema for validating generation ID
 */
const idSchema = z.string().min(1, 'Generation ID is required');

/**
 * Client for the Generations Management API
 * Provides methods to list, get, delete, share, and download generations
 */
export class GenerationsClient extends BaseClient {
  /**
   * Create a new Generations client
   * @param client Parent SVGMaker client
   */
  constructor(client: SVGMakerClient) {
    super(client);
  }

  /**
   * List generations with pagination and optional filters
   * @param params Optional filtering and pagination parameters
   * @returns Paginated list of generation IDs
   */
  async list(params?: GenerationsListParams): Promise<GenerationsListResponse> {
    this.logger.debug('Listing generations', { params });

    // Validate parameters
    if (params) {
      this.validateRequest(params, listParamsSchema as z.ZodType<typeof params>);
    }

    // Build URL with query params (handle arrays manually since buildUrl only supports scalars)
    const searchParams = new URLSearchParams();
    if (params) {
      if (params.page !== undefined) searchParams.append('page', String(params.page));
      if (params.limit !== undefined) searchParams.append('limit', String(params.limit));
      if (params.query !== undefined) searchParams.append('query', params.query);

      // Handle array params (type=generate&type=edit)
      const appendArray = (key: string, value?: string | string[]) => {
        if (!value) return;
        const values = Array.isArray(value) ? value : [value];
        values.forEach(v => searchParams.append(key, v));
      };
      appendArray('type', params.type);
      appendArray('hashtags', params.hashtags);
      appendArray('categories', params.categories);
    }

    const queryString = searchParams.toString();
    const url = `/v1/generations${queryString ? `?${queryString}` : ''}`;

    return this.handleRequest<GenerationsListResponse>(url, { method: 'GET' });
  }

  /**
   * Get details of a single generation by ID
   * @param id Generation ID
   * @returns Generation details
   */
  async get(id: string): Promise<GenerationResponse> {
    this.logger.debug('Getting generation', { id });

    this.validateRequest(id, idSchema);

    const url = `${this.config.baseUrl}/v1/generations/${encodeURIComponent(id)}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'x-api-key': this.config.apiKey,
      },
    });

    if (!response.ok) {
      await this.handleFetchErrorResponse(response);
    }

    const rawResult = await response.json();
    const { data, metadata } = this.unwrapEnvelope<any>(rawResult);

    return {
      id: data.id,
      prompt: data.prompt,
      type: data.type,
      quality: data.quality,
      isPublic: data.isPublic,
      hashTags: data.metadata?.hashTags ?? [],
      categories: data.metadata?.category ?? [],
      metadata,
    };
  }

  /**
   * Delete a generation and its associated files (paid users only)
   * @param id Generation ID
   * @returns Deletion confirmation
   */
  async delete(id: string): Promise<GenerationDeleteResponse> {
    this.logger.debug('Deleting generation', { id });

    this.validateRequest(id, idSchema);

    return this.handleRequest<GenerationDeleteResponse>(
      `/v1/generations/${encodeURIComponent(id)}`,
      { method: 'DELETE' }
    );
  }

  /**
   * Share a generation (make it public)
   * @param id Generation ID
   * @returns Share confirmation with public URL
   */
  async share(id: string): Promise<GenerationShareResponse> {
    this.logger.debug('Sharing generation', { id });

    this.validateRequest(id, idSchema);

    return this.handleRequest<GenerationShareResponse>(
      `/v1/generations/${encodeURIComponent(id)}/share`,
      { method: 'POST' }
    );
  }

  /**
   * Download a generation in various formats (paid users only)
   * @param id Generation ID
   * @param params Optional download parameters (format, optimize)
   * @returns Download URL and file metadata
   */
  async download(
    id: string,
    params?: GenerationDownloadParams
  ): Promise<GenerationDownloadResponse> {
    this.logger.debug('Downloading generation', { id, params });

    this.validateRequest(id, idSchema);
    if (params) {
      this.validateRequest(params, downloadParamsSchema as z.ZodType<typeof params>);
    }

    const queryParams: Record<string, string | undefined> = {};
    if (params?.format) queryParams.format = params.format;
    if (params?.optimize !== undefined) queryParams.optimize = String(params.optimize);

    return this.handleRequest<GenerationDownloadResponse>(
      `/v1/generations/${encodeURIComponent(id)}/download`,
      { method: 'GET', params: queryParams as Record<string, string> }
    );
  }

  /**
   * Create a clone of this client
   * @returns New client instance
   */
  protected clone(): GenerationsClient {
    return new GenerationsClient(this.client);
  }
}
