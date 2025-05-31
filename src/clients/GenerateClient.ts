import { BaseClient } from './BaseClient';
import { GenerateParams, GenerateResponse, GenerateStreamEvent } from '../types/api';
import { SVGMakerClient } from '../core/SVGMakerClient';
import { z } from 'zod';
import { Readable } from 'stream';

/**
 * Schema for validating generate parameters
 */
const generateParamsSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required'),
  quality: z.enum(['low', 'medium', 'high']).optional(),
  aspectRatio: z.enum(['auto', 'portrait', 'landscape', 'square', 'wide', 'tall']).optional(),
  background: z.enum(['auto', 'transparent', 'opaque']).optional(),
  stream: z.boolean().optional(),
  style: z.enum(['minimalist', 'cartoon', 'realistic', 'abstract', 'flat', 'isometric']).optional(),
  color_mode: z.enum(['monochrome', '2-colors', '3-colors', 'full-color']).optional(),
  image_complexity: z.enum(['simple', 'detailed']).optional(),
  category: z.enum(['icon', 'illustration', 'pattern', 'logo', 'scene']).optional(),
  composition: z.enum(['center-object', 'full-scene']).optional(),
  advanced: z
    .object({
      stroke_weight: z.enum(['thin', 'medium', 'thick']).optional(),
      corner_style: z.enum(['none', 'rounded', 'sharp']).optional(),
      shadow_effect: z.enum(['none', 'soft', 'hard']).optional(),
    })
    .optional(),
});

/**
 * Client for the Generate SVG API
 */
export class GenerateClient extends BaseClient {
  private params: GenerateParams = {
    prompt: '',
  };

  /**
   * Create a new Generate client
   * @param client Parent SVGMaker client
   */
  constructor(client: SVGMakerClient) {
    super(client);
  }

  /**
   * Execute the Generate SVG request
   * @returns Generate response
   */
  public async execute(): Promise<GenerateResponse> {
    // Validate parameters
    this.validateRequest(this.params, generateParamsSchema);

    // Execute request
    return this.handleRequest<GenerateResponse>('/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(this.params),
    });
  }

  /**
   * Configure the generation parameters
   * @param config Configuration object with generation parameters
   * @returns New client instance
   */
  public configure(config: Partial<GenerateParams>): GenerateClient {
    const client = this.clone();
    client.params = { ...client.params, ...config };
    return client;
  }

  /**
   * Stream the generation response
   * @returns Readable stream of events
   */
  public stream(): Readable {
    // Create a clone with streaming enabled
    const client = this.clone();
    client.params.stream = true;

    // Validate parameters
    this.validateRequest(client.params, generateParamsSchema);

    // Create a readable stream for the events
    const stream = new Readable({
      objectMode: true,
      read() {}, // No-op
    });

    // Execute the request and handle streaming
    (async () => {
      try {
        // In a real implementation, this would handle SSE or other streaming protocol
        // For now, we'll simulate it with a basic implementation
        const response = await fetch(`${this.config.baseUrl}/generate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'text/event-stream',
            'x-api-key': this.config.apiKey,
          },
          body: JSON.stringify(client.params),
        });

        if (!response.ok) {
          throw new Error(`HTTP error ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('Response body is not readable');
        }

        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.trim() === '') continue;
            if (line.startsWith('data:')) {
              const data = line.slice(5).trim();
              try {
                const event = JSON.parse(data) as GenerateStreamEvent;
                stream.push(event);
                if (event.status === 'complete' || event.status === 'error') {
                  stream.push(null); // End the stream
                  return;
                }
              } catch (e) {
                console.error('Error parsing event data:', e);
              }
            }
          }
        }

        // End of stream
        stream.push(null);
      } catch (error) {
        stream.emit('error', error);
        stream.push(null);
      }
    })();

    return stream;
  }

  /**
   * Create a clone of this client
   * @returns New client instance
   */
  protected clone(): GenerateClient {
    const client = new GenerateClient(this.client);
    this.copyTo(client);
    client.params = { ...this.params };
    return client;
  }
}
