import { BaseClient } from '../BaseClient';
import { SvgToVectorParams, ConvertResultsResponse } from '../../types/api';
import { SVGMakerClient } from '../../core/SVGMakerClient';
import { z } from 'zod';

/**
 * Schema for validating SVG to vector parameters
 */
const svgToVectorParamsSchema = z.object({
  file: z.string(),
  toFormat: z.enum(['PDF', 'EPS', 'DXF', 'AI', 'PS']),
  textToPath: z.boolean().optional(),
  dxfVersion: z.enum(['R12', 'R14']).optional(),
});

/**
 * Client for the SVG to Vector conversion API
 */
export class SvgToVectorClient extends BaseClient {
  private params: Partial<SvgToVectorParams> = {};

  /**
   * Create a new SVG to Vector client
   * @param client Parent SVGMaker client
   */
  constructor(client: SVGMakerClient) {
    super(client);
  }

  /**
   * Execute the SVG to vector conversion request
   * @returns Convert results response with converted vector file results
   */
  public async execute(): Promise<ConvertResultsResponse> {
    this.logger.debug('Starting SVG to vector conversion', {
      hasFile: !!this.params.file,
      toFormat: this.params.toFormat,
    });

    // Validate parameters
    this.validateRequest(this.params, svgToVectorParamsSchema);

    // Prepare form data
    const formData = new FormData();

    // Add file
    await this.addFileToForm(formData, 'file', this.params.file!);

    // Add required toFormat
    formData.append('toFormat', this.params.toFormat!);

    // Add optional parameters
    this.appendOptionalParams(formData, this.params as Record<string, any>, ['textToPath', 'dxfVersion']);

    // Execute request
    const { data, metadata: responseMetadata } = await this.executeFormDataRequest<any>(
      '/v1/convert/svg-to-vector',
      formData
    );

    this.logger.debug('SVG to vector conversion completed', {
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
   * Configure the SVG to vector parameters
   * @param config Configuration object with SVG to vector parameters
   * @returns New client instance
   */
  public configure(config: Partial<SvgToVectorParams>): SvgToVectorClient {
    this.logger.debug('Configuring SVG to vector parameters', { config });

    const client = this.clone();
    client.params = { ...client.params, ...config };
    return client;
  }

  /**
   * Create a clone of this client
   * @returns New client instance
   */
  protected clone(): SvgToVectorClient {
    const client = new SvgToVectorClient(this.client);
    this.copyTo(client);
    client.params = { ...this.params };
    return client;
  }
}
