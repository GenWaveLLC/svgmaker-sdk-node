import { BaseClient } from '../BaseClient';
import { BatchConvertParams, ConvertResultsResponse } from '../../types/api';
import { SVGMakerClient } from '../../core/SVGMakerClient';
import { z } from 'zod';

/**
 * Schema for validating batch conversion parameters
 */
const batchConvertParamsSchema = z.object({
  files: z.array(z.string()).min(1).max(10),
  toFormat: z.string(),
  preset: z.enum(['bw', 'poster', 'photo']).optional(),
  mode: z.enum(['pixel', 'polygon', 'spline']).optional(),
  hierarchical: z.enum(['stacked', 'cutout']).optional(),
  detail: z.number().optional(),
  smoothness: z.number().optional(),
  corners: z.number().optional(),
  reduceNoise: z.number().optional(),
  textToPath: z.boolean().optional(),
  dxfVersion: z.enum(['R12', 'R14']).optional(),
  quality: z.number().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
});

/**
 * Client for the Batch Convert API
 */
export class BatchConvertClient extends BaseClient {
  private params: Partial<BatchConvertParams> = {};

  /**
   * Create a new Batch Convert client
   * @param client Parent SVGMaker client
   */
  constructor(client: SVGMakerClient) {
    super(client);
  }

  /**
   * Execute the batch conversion request
   * @returns Conversion results response
   */
  public async execute(): Promise<ConvertResultsResponse> {
    this.logger.debug('Starting batch conversion', {
      fileCount: this.params.files?.length,
      toFormat: this.params.toFormat,
    });

    // Validate parameters
    this.validateRequest(this.params, batchConvertParamsSchema);

    // Prepare form data
    const formData = new FormData();

    // Add each file using the inherited addFileToForm method
    for (const file of this.params.files!) {
      await this.addFileToForm(formData, 'file', file);
    }

    // Add toFormat
    formData.append('toFormat', this.params.toFormat!);

    // Add optional parameters
    this.appendOptionalParams(formData, this.params as Record<string, any>, [
      'preset',
      'mode',
      'hierarchical',
      'detail',
      'smoothness',
      'corners',
      'reduceNoise',
      'textToPath',
      'dxfVersion',
      'quality',
      'width',
      'height',
    ]);

    // Execute request
    const { data, metadata: responseMetadata } = await this.executeFormDataRequest<any>(
      '/v1/convert/batch',
      formData
    );

    this.logger.debug('Batch conversion completed', {
      total: data.summary?.total,
      successful: data.summary?.successful,
      failed: data.summary?.failed,
    });

    return {
      results: data.results,
      summary: data.summary,
      metadata: responseMetadata,
    };
  }

  /**
   * Configure the batch conversion parameters
   * @param config Configuration object with batch conversion parameters
   * @returns New client instance
   */
  public configure(config: Partial<BatchConvertParams>): BatchConvertClient {
    this.logger.debug('Configuring batch conversion parameters', { config });

    const client = this.clone();
    client.params = { ...client.params, ...config };
    return client;
  }

  /**
   * Create a clone of this client
   * @returns New client instance
   */
  protected clone(): BatchConvertClient {
    const client = new BatchConvertClient(this.client);
    this.copyTo(client);
    client.params = { ...this.params };
    return client;
  }
}
