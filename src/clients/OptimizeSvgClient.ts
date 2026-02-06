import { BaseClient } from './BaseClient';
import { OptimizeSvgParams, OptimizeSvgResponse } from '../types/api';
import { SVGMakerClient } from '../core/SVGMakerClient';
import { z } from 'zod';

/**
 * Schema for validating optimize SVG parameters
 */
const optimizeSvgParamsSchema = z.object({
  file: z.string(),
  compress: z.boolean().optional(),
});

/**
 * Client for the Optimize SVG API
 */
export class OptimizeSvgClient extends BaseClient {
  private params: Partial<OptimizeSvgParams> = {};

  /**
   * Create a new Optimize SVG client
   * @param client Parent SVGMaker client
   */
  constructor(client: SVGMakerClient) {
    super(client);
  }

  /**
   * Execute the Optimize SVG request
   * @returns Optimize SVG response
   */
  public async execute(): Promise<OptimizeSvgResponse> {
    this.logger.debug('Starting SVG optimization');

    // Validate parameters
    this.validateRequest(this.params, optimizeSvgParamsSchema);

    // Prepare form data
    const formData = new FormData();

    // Add file
    await this.addFileToForm(formData, 'file', this.params.file!);

    // Add compress option if present
    if (this.params.compress !== undefined) {
      formData.append('compress', String(this.params.compress));
    }

    // Execute request using native fetch
    const response = await fetch(`${this.config.baseUrl}/v1/svg/optimize`, {
      method: 'POST',
      headers: {
        'x-api-key': this.config.apiKey,
      },
      body: formData,
    });

    if (!response.ok) {
      await this.handleFetchErrorResponse(response);
    }

    const rawResult = await response.json();
    const { data, metadata: responseMetadata } = this.unwrapEnvelope<any>(rawResult);

    this.logger.debug('SVG optimization completed');

    return {
      svgUrl: data.svgUrl,
      svgUrlExpiresIn: data.svgUrlExpiresIn,
      svgzUrl: data.svgzUrl,
      svgzUrlExpiresIn: data.svgzUrlExpiresIn,
      filename: data.filename,
      compressedSize: data.compressedSize,
      metadata: responseMetadata,
    };
  }

  /**
   * Configure the optimize SVG parameters
   * @param config Configuration object with optimize SVG parameters
   * @returns New client instance
   */
  public configure(config: Partial<OptimizeSvgParams>): OptimizeSvgClient {
    this.logger.debug('Configuring optimize SVG parameters', { config });

    const client = this.clone();
    client.params = { ...client.params, ...config };
    return client;
  }

  /**
   * Create a clone of this client
   * @returns New client instance
   */
  protected clone(): OptimizeSvgClient {
    const client = new OptimizeSvgClient(this.client);
    this.copyTo(client);
    client.params = { ...this.params };
    return client;
  }
}
