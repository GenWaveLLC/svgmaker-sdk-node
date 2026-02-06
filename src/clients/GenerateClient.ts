import { BaseClient } from './BaseClient';
import { GenerateParams, GenerateResponse, GenerateStreamEvent } from '../types/api';
import { SVGMakerClient } from '../core/SVGMakerClient';
import { z } from 'zod';
import { Readable } from 'stream';
import { decodeSvgContent } from '../utils/base64';

/**
 * Schema for validating generate parameters
 */
const generateParamsSchema = z
  .object({
    prompt: z.string().min(1, 'Prompt is required'),
    quality: z.enum(['low', 'medium', 'high']).optional(),
    aspectRatio: z.enum(['auto', 'portrait', 'landscape', 'square']).optional(),
    background: z.enum(['auto', 'transparent', 'opaque']).optional(),
    storage: z.boolean().optional(),
    stream: z.boolean().optional(),
    base64Png: z.boolean().optional(),
    svgText: z.boolean().optional(),
    model: z.string().optional(),
    styleParams: z
      .object({
        style: z
          .enum([
            'flat',
            'line_art',
            'engraving',
            'linocut',
            'silhouette',
            'isometric',
            'cartoon',
            'ghibli',
          ])
          .optional(),
        color_mode: z.enum(['full_color', 'monochrome', 'few_colors']).optional(),
        image_complexity: z.enum(['icon', 'illustration', 'scene']).optional(),
        text: z.enum(['only_title', 'embedded_text']).optional(),
        composition: z
          .enum(['centered_object', 'repeating_pattern', 'full_scene', 'objects_in_grid'])
          .optional(),
      })
      .optional(),
  })
  .refine(data => !(data.model && data.quality), {
    message: "Cannot specify both 'model' and 'quality'. Use one or the other.",
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
    this.logger.debug('Starting SVG generation', {
      prompt: this.params.prompt,
      quality: this.params.quality,
    });

    // Apply defaults before validation
    this.applyDefaults();

    // Validate parameters
    this.validateRequest(this.params, generateParamsSchema);

    // Execute request
    const rawResult = await this.handleRequest<any>('/v1/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(this.params),
    });

    // The interceptor already decodes base64Png to pngImageData
    // Normalize svgText (API now sends raw SVG text, but we handle legacy base64 too)
    let svgText: string | undefined = undefined;
    if (rawResult.svgText && typeof rawResult.svgText === 'string') {
      svgText = decodeSvgContent(rawResult.svgText);
    }

    // Compose the response to match GenerateResponse
    const result: GenerateResponse = {
      svgUrl: rawResult.svgUrl,
      creditCost: rawResult.creditCost,
      message: rawResult.message ?? '',
      svgUrlExpiresIn: rawResult.svgUrlExpiresIn,
      generationId: rawResult.generationId,
      metadata: rawResult.metadata,
      pngImageData: rawResult.pngImageData,
      svgText,
      quality: rawResult.quality ?? this.params.quality ?? 'medium',
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
    // No quality-specific defaults in v1 API
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
        const response = await fetch(`${this.config.baseUrl}/v1/generate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'text/event-stream',
            'x-api-key': this.config.apiKey,
          },
          body: JSON.stringify(client.params),
        });

        if (!response.ok) {
          await this.handleFetchErrorResponse(response);
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('Response body is not readable');
        }

        const decoder = new TextDecoder();
        let buffer = '';
        const accumulated: Record<string, unknown> = {};

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
              // Normalize svgText (API now sends raw SVG text, but we handle legacy base64 too)
              if (event.svgText && typeof event.svgText === 'string') {
                event.svgText = decodeSvgContent(event.svgText);
              }
              // Convert base64Png to pngImageData (Buffer) if present
              if (event.base64Png && typeof event.base64Png === 'string') {
                try {
                  event.pngImageData = Buffer.from(
                    event.base64Png.split(',').pop() || '',
                    'base64'
                  );
                } catch {
                  event.pngImageData = undefined;
                }
              }
              // --- End: Normalize event fields ---

              // Accumulate fields from all events
              for (const [key, value] of Object.entries(event)) {
                if (value !== undefined && key !== 'status' && key !== 'message') {
                  accumulated[key] = value;
                }
              }

              // When complete, merge accumulated fields into the event
              if (event.status === 'complete' || event.status === 'error') {
                const mergedEvent = { ...accumulated, ...event };
                stream.push(mergedEvent);
                stream.push(null);
                return;
              }

              stream.push(event);
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
