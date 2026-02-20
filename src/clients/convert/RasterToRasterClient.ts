import { BaseClient } from '../BaseClient';
import { RasterToRasterParams, ConvertResultsResponse } from '../../types/api';
import { SVGMakerClient } from '../../core/SVGMakerClient';
import { z } from 'zod';

/**
 * Schema for validating raster-to-raster conversion parameters
 */
const rasterToRasterParamsSchema = z.object({
  file: z.string(),
  toFormat: z.enum(['PNG', 'JPG', 'WEBP', 'TIFF', 'GIF', 'AVIF']),
  quality: z.number().min(1).max(100).optional(),
  width: z.number().positive().optional(),
  height: z.number().positive().optional(),
});

/**
 * Client for the Raster-to-Raster conversion API
 */
export class RasterToRasterClient extends BaseClient {
  private params: Partial<RasterToRasterParams> = {};

  /**
   * Create a new Raster-to-Raster client
   * @param client Parent SVGMaker client
   */
  constructor(client: SVGMakerClient) {
    super(client);
  }

  /**
   * Execute the raster-to-raster conversion request
   * @returns Conversion results response
   */
  public async execute(): Promise<ConvertResultsResponse> {
    this.logger.debug('Starting raster-to-raster conversion', {
      hasFile: !!this.params.file,
      toFormat: this.params.toFormat,
    });

    // Validate parameters
    this.validateRequest(this.params, rasterToRasterParamsSchema);

    // Prepare form data
    const formData = new FormData();

    // Add file
    await this.addFileToForm(formData, 'file', this.params.file!);

    // Add toFormat
    formData.append('toFormat', this.params.toFormat!);

    // Add optional parameters
    this.appendOptionalParams(formData, this.params as Record<string, any>, [
      'quality',
      'width',
      'height',
    ]);

    // Execute request
    const { data, metadata: responseMetadata } = await this.executeFormDataRequest<any>(
      '/v1/convert/raster-to-raster',
      formData
    );

    this.logger.debug('Raster-to-raster conversion completed');

    return {
      results: data.results,
      summary: data.summary,
      metadata: responseMetadata,
    };
  }

  /**
   * Configure the raster-to-raster conversion parameters
   * @param config Configuration object with raster-to-raster parameters
   * @returns New client instance
   */
  public configure(config: Partial<RasterToRasterParams>): RasterToRasterClient {
    this.logger.debug('Configuring raster-to-raster parameters', { config });

    const client = this.clone();
    client.params = { ...client.params, ...config };
    return client;
  }

  /**
   * Create a clone of this client
   * @returns New client instance
   */
  protected clone(): RasterToRasterClient {
    const client = new RasterToRasterClient(this.client);
    this.copyTo(client);
    client.params = { ...this.params };
    return client;
  }
}
