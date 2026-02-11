import { BaseClient } from './BaseClient';
import { SVGMakerClient } from '../core/SVGMakerClient';
import { z } from 'zod';
import {
  GalleryListParams,
  GalleryListResponse,
  GalleryItemResponse,
  GalleryDownloadParams,
  GalleryDownloadResponse,
} from '../types/api';

/**
 * Schema for validating gallery list parameters
 */
const listParamsSchema = z
  .object({
    page: z.number().int().positive().optional(),
    limit: z.number().int().min(1).max(100).optional(),
    type: z.union([z.string(), z.array(z.string())]).optional(),
    hashtags: z.union([z.string(), z.array(z.string())]).optional(),
    categories: z.union([z.string(), z.array(z.string())]).optional(),
    query: z.string().optional(),
    pro: z.string().optional(),
    gold: z.string().optional(),
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
 * Schema for validating gallery item ID
 */
const idSchema = z.string().min(1, 'Gallery item ID is required');

/**
 * Client for the Gallery API
 * Provides methods to browse, get details, and download public gallery items
 */
export class GalleryClient extends BaseClient {
  /**
   * Create a new Gallery client
   * @param client Parent SVGMaker client
   */
  constructor(client: SVGMakerClient) {
    super(client);
  }

  /**
   * Browse the public gallery with pagination and optional filters
   * @param params Optional filtering and pagination parameters
   * @returns Paginated list of gallery item IDs
   */
  async list(params?: GalleryListParams): Promise<GalleryListResponse> {
    this.logger.debug('Browsing gallery', { params });

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
      if (params.pro !== undefined) searchParams.append('pro', params.pro);
      if (params.gold !== undefined) searchParams.append('gold', params.gold);

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
    const url = `/v1/gallery${queryString ? `?${queryString}` : ''}`;

    return this.handleRequest<GalleryListResponse>(url, { method: 'GET' });
  }

  /**
   * Get details of a single gallery item by ID
   * @param id Gallery item ID
   * @returns Gallery item details
   */
  async get(id: string): Promise<GalleryItemResponse> {
    this.logger.debug('Getting gallery item', { id });

    this.validateRequest(id, idSchema);

    const url = `${this.config.baseUrl}/v1/gallery/${encodeURIComponent(id)}`;
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
   * Download a gallery item in various formats
   * @param id Gallery item ID
   * @param params Optional download parameters (format, optimize)
   * @returns Download URL and file metadata
   */
  async download(
    id: string,
    params?: GalleryDownloadParams
  ): Promise<GalleryDownloadResponse> {
    this.logger.debug('Downloading gallery item', { id, params });

    this.validateRequest(id, idSchema);
    if (params) {
      this.validateRequest(params, downloadParamsSchema as z.ZodType<typeof params>);
    }

    const queryParams: Record<string, string | undefined> = {};
    if (params?.format) queryParams.format = params.format;
    if (params?.optimize !== undefined) queryParams.optimize = String(params.optimize);

    return this.handleRequest<GalleryDownloadResponse>(
      `/v1/gallery/${encodeURIComponent(id)}/download`,
      { method: 'GET', params: queryParams as Record<string, string> }
    );
  }

  /**
   * Create a clone of this client
   * @returns New client instance
   */
  protected clone(): GalleryClient {
    return new GalleryClient(this.client);
  }
}
