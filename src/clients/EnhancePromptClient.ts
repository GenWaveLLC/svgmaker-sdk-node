import { BaseClient } from './BaseClient';
import { EnhancePromptParams, EnhancePromptResponse } from '../types/api';
import { SVGMakerClient } from '../core/SVGMakerClient';
import { z } from 'zod';

/**
 * Schema for validating enhance prompt parameters
 */
const enhancePromptParamsSchema = z.object({
  prompt: z.string(),
});

/**
 * Client for the Enhance Prompt API
 */
export class EnhancePromptClient extends BaseClient {
  private params: Partial<EnhancePromptParams> = {};

  /**
   * Create a new Enhance Prompt client
   * @param client Parent SVGMaker client
   */
  constructor(client: SVGMakerClient) {
    super(client);
  }

  /**
   * Execute the enhance prompt request
   * @returns Enhanced prompt response
   */
  public async execute(): Promise<EnhancePromptResponse> {
    this.logger.debug('Starting prompt enhancement', {
      hasPrompt: !!this.params.prompt,
    });

    // Validate parameters
    this.validateRequest(this.params, enhancePromptParamsSchema);

    // Execute request using native fetch with JSON body
    const response = await fetch(`${this.config.baseUrl}/v1/enhance-prompt`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.config.apiKey,
      },
      body: JSON.stringify({ prompt: this.params.prompt }),
    });

    if (!response.ok) {
      await this.handleFetchErrorResponse(response);
    }

    const rawResult = await response.json();
    const { data, metadata: responseMetadata } = this.unwrapEnvelope<any>(rawResult);

    this.logger.debug('Prompt enhancement completed');

    return {
      enhancedPrompt: data.enhancedPrompt,
      metadata: responseMetadata,
    };
  }

  /**
   * Configure the enhance prompt parameters
   * @param config Configuration object with enhance prompt parameters
   * @returns New client instance
   */
  public configure(config: Partial<EnhancePromptParams>): EnhancePromptClient {
    this.logger.debug('Configuring enhance prompt parameters', { config });

    const client = this.clone();
    client.params = { ...client.params, ...config };
    return client;
  }

  /**
   * Create a clone of this client
   * @returns New client instance
   */
  protected clone(): EnhancePromptClient {
    const client = new EnhancePromptClient(this.client);
    this.copyTo(client);
    client.params = { ...this.params };
    return client;
  }
}
