import { BaseClient } from './BaseClient';
import { UploadPrepareParams, UploadPrepareResponse } from '../types/api';
import { SVGMakerClient } from '../core/SVGMakerClient';
import { APIError } from '../errors/CustomErrors';
import { z } from 'zod';

/**
 * Schema for validating upload preparation parameters
 */
const uploadPrepareParamsSchema = z.object({
  filename: z.string().min(1),
});

/**
 * Client for preparing temporary uploads through the SVGMaker API.
 */
export class UploadClient extends BaseClient {
  /**
   * Create a new Upload client
   * @param client Parent SVGMaker client
   */
  constructor(client: SVGMakerClient) {
    super(client);
  }

  /**
   * Prepare a temporary upload endpoint.
   * @param params Original file metadata
   * @returns Short-lived multipart upload URL
   */
  public async prepare(params: UploadPrepareParams): Promise<UploadPrepareResponse> {
    this.logger.debug('Preparing temporary upload', {
      filename: params.filename,
    });

    this.validateRequest(params, uploadPrepareParamsSchema);

    // Raw fetch bypasses the retry/timeout wrapper applied to httpClient.request.
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.config.timeout);

    let response: globalThis.Response;
    try {
      response = await fetch(`${this.config.baseUrl}/v1/upload/prepare`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this.buildAuthHeaders(),
        },
        body: JSON.stringify({ filename: params.filename }),
        signal: controller.signal,
      });
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new APIError(
          `Upload preparation request timed out after ${this.config.timeout}ms`,
          408
        );
      }
      throw error;
    } finally {
      clearTimeout(timer);
    }

    if (!response.ok) {
      await this.handleFetchErrorResponse(response);
    }

    const rawResult = await response.json();
    const { data, metadata: responseMetadata } = this.unwrapEnvelope<any>(rawResult);

    this.logger.debug('Temporary upload prepared');

    return {
      uploadUrl: data.upload_url,
      expiresIn: data.expires_in,
      metadata: responseMetadata,
    };
  }

  /**
   * Create a clone of this client
   * @returns New client instance
   */
  protected clone(): UploadClient {
    const client = new UploadClient(this.client);
    this.copyTo(client);
    return client;
  }
}
