import { BaseClient } from '../BaseClient';
import { TraceParams, ConvertResultsResponse } from '../../types/api';
import { SVGMakerClient } from '../../core/SVGMakerClient';
import { z } from 'zod';

/**
 * Schema for validating trace parameters
 */
const traceParamsSchema = z.object({
  file: z.string(),
  algorithm: z.enum(['vtracer']).optional(),
  preset: z.enum(['bw', 'poster', 'photo']).optional(),
  mode: z.enum(['pixel', 'polygon', 'spline']).optional(),
  hierarchical: z.enum(['stacked', 'cutout']).optional(),
  detail: z.number().min(0).max(100).optional(),
  smoothness: z.number().min(0).max(100).optional(),
  corners: z.number().min(0).max(100).optional(),
  reduceNoise: z.number().optional(),
});

/**
 * Client for the Trace (raster to SVG) API
 */
export class TraceClient extends BaseClient {
  private params: Partial<TraceParams> = {};

  /**
   * Create a new Trace client
   * @param client Parent SVGMaker client
   */
  constructor(client: SVGMakerClient) {
    super(client);
  }

  /**
   * Execute the trace request
   * @returns Convert results response with traced SVG results
   */
  public async execute(): Promise<ConvertResultsResponse> {
    this.logger.debug('Starting trace conversion', {
      hasFile: !!this.params.file,
      preset: this.params.preset,
      mode: this.params.mode,
    });

    // Validate parameters
    this.validateRequest(this.params, traceParamsSchema);

    // Prepare form data
    const formData = new FormData();

    // Add file
    await this.addFileToForm(formData, 'file', this.params.file!);

    // Add optional parameters
    this.appendOptionalParams(formData, this.params as Record<string, any>, [
      'algorithm', 'preset', 'mode', 'hierarchical', 'detail', 'smoothness', 'corners', 'reduceNoise',
    ]);

    // Execute request
    const { data, metadata: responseMetadata } = await this.executeFormDataRequest<any>(
      '/v1/convert/trace',
      formData
    );

    this.logger.debug('Trace conversion completed', {
      total: data.summary?.total,
      successful: data.summary?.successful,
    });

    return {
      results: data.results,
      summary: data.summary,
      metadata: responseMetadata,
    };
  }

  /**
   * Configure the trace parameters
   * @param config Configuration object with trace parameters
   * @returns New client instance
   */
  public configure(config: Partial<TraceParams>): TraceClient {
    this.logger.debug('Configuring trace parameters', { config });

    const client = this.clone();
    client.params = { ...client.params, ...config };
    return client;
  }

  /**
   * Create a clone of this client
   * @returns New client instance
   */
  protected clone(): TraceClient {
    const client = new TraceClient(this.client);
    this.copyTo(client);
    client.params = { ...this.params };
    return client;
  }
}
