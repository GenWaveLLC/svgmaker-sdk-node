import { BaseClient } from './BaseClient';
import { GenerateParams, GenerateResponse, GenerateStreamEvent } from '../types/api';
import { SVGMakerClient } from '../core/SVGMakerClient';
import { z } from 'zod';
import { Readable } from 'stream';

/**
 * Schema for validating generate parameters
 */
const generateParamsSchema = z
  .object({
    prompt: z.string().min(1, 'Prompt is required'),
    quality: z.enum(['low', 'medium', 'high']).optional(),
    aspectRatio: z.enum(['auto', 'portrait', 'landscape', 'square', 'wide', 'tall']).optional(),
    background: z.enum(['auto', 'transparent', 'opaque']).optional(),
    stream: z.boolean().optional(),
    base64Png: z.boolean().optional(),
    svgText: z.boolean().optional(),
    styleParams: z
      .object({
        style: z
          .enum(['minimalist', 'cartoon', 'realistic', 'abstract', 'flat', 'isometric'])
          .optional(),
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
      })
      .optional(),
  })
  .refine(
    data => {
      // Validate quality and aspect ratio combinations
      if (data.quality && data.aspectRatio) {
        const quality = data.quality;
        const aspectRatio = data.aspectRatio;

        if (
          (quality === 'low' || quality === 'medium') &&
          !['auto', 'portrait', 'landscape', 'square'].includes(aspectRatio)
        ) {
          return false;
        }

        if (quality === 'high' && aspectRatio === 'auto') {
          return false;
        }
      }

      return true;
    },
    {
      message:
        'Invalid quality and aspect ratio combination. Low/medium quality supports auto, portrait, landscape, square only. High quality supports all except auto.',
    }
  );

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
    this.logger.debug('Starting SVG generation', {
      prompt: this.params.prompt,
      quality: this.params.quality,
    });

    // Apply defaults before validation
    this.applyDefaults();

    // Validate parameters
    this.validateRequest(this.params, generateParamsSchema);

    // Execute request
    const rawResult = await this.handleRequest<any>('/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(this.params),
    });

    

    // The interceptor already decodes base64Png to pngImageData
    // Only decode svgText from base64 to string if needed
    let svgText: string | undefined = undefined;
    if (rawResult.svgText && typeof rawResult.svgText === 'string') {
      try {
        svgText = Buffer.from(rawResult.svgText, 'base64').toString('utf-8');
      } catch {
        svgText = rawResult.svgText;
      }
    }

    // Compose the response to match GenerateResponse
    const result: GenerateResponse = {
      svgUrl: rawResult.svgUrl,
      creditCost: rawResult.creditCost,
      pngImageData: rawResult.pngImageData, // Provided by interceptor
      svgText,
      prompt: rawResult.prompt ?? this.params.prompt,
      quality: rawResult.quality ?? this.params.quality ?? 'medium',
      revisedPrompt: rawResult.revisedPrompt ?? '',
    };

    this.logger.debug('SVG generation completed', {
      creditCost: result.creditCost,
      hasSvgText: !!result.svgText,
      hasPngData: !!result.pngImageData,
    });

    return result;
  }

  /**
   * Configure the generation parameters
   * @param config Configuration object with generation parameters
   * @returns New client instance
   */
  public configure(config: Partial<GenerateParams>): GenerateClient {
    this.logger.debug('Configuring generation parameters', { config });

    const client = this.clone();
    client.params = { ...client.params, ...config };

    // Apply default aspect ratio based on quality if not explicitly set
    client.applyDefaults();

    return client;
  }

  /**
   * Apply default values based on business rules
   * @private
   */
  private applyDefaults(): void {
    // Set default aspect ratio based on quality if not already set
    if (this.params.quality && !this.params.aspectRatio) {
      if (this.params.quality === 'high') {
        this.params.aspectRatio = 'square';
      } else {
        // low or medium quality
        this.params.aspectRatio = 'auto';
      }
    }
  }

  /**
   * Stream the generation response
   * @returns Readable stream of events
   */
  public stream(): Readable {
    // Create a clone with streaming enabled
    const client = this.clone();
    client.params.stream = true;

    // Apply defaults before validation
    client.applyDefaults();

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
        // Make request to the streaming endpoint using native fetch
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
          const errorText = await response.text();
          throw new Error(`HTTP error ${response.status}: ${errorText}`);
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

          // Decode the chunk and add to buffer
          buffer += decoder.decode(value, { stream: true });

          // Split by newlines to get individual JSON objects
          const lines = buffer.split('\n');

          // Keep the last incomplete line in the buffer
          buffer = lines.pop() || '';

          // Process each complete line
          for (const line of lines) {
            const trimmedLine = line.trim();
            if (trimmedLine === '') continue;

            try {
              // Parse the JSON chunk directly (no "data:" prefix like SSE)
              const event = JSON.parse(trimmedLine) as GenerateStreamEvent;

              // --- Begin: Normalize event fields to match non-streaming response ---
              // Decode svgText from base64 if present and is a string
              if (event.svgText && typeof event.svgText === 'string') {
                try {
                  event.svgText = Buffer.from(event.svgText, 'base64').toString('utf-8');
                } catch {
                  // fallback: leave as is
                }
              }
              // Convert base64Png to pngImageData (Buffer) if present
              if (event.base64Png && typeof event.base64Png === 'string') {
                try {
                  event.pngImageData = Buffer.from(event.base64Png.split(',').pop() || '', 'base64');
                } catch {
                  event.pngImageData = undefined;
                }
              }
              // --- End: Normalize event fields ---

              stream.push(event);

              // End the stream when we get a complete or error status
              if (event.status === 'complete' || event.status === 'error') {
                stream.push(null);
                return;
              }
            } catch (e) {
              console.error('Error parsing streaming chunk:', e);
              console.error('Problematic line:', trimmedLine);
            }
          }
        }

        // Process any remaining data in buffer
        if (buffer.trim()) {
          try {
            const event = JSON.parse(buffer.trim()) as GenerateStreamEvent;
            stream.push(event);
          } catch (e) {
            console.error('Error parsing final chunk:', e);
          }
        }

        // End of stream
        stream.push(null);
      } catch (error) {
        console.error('Streaming error:', error);
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
