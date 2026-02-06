import { BaseClient } from './BaseClient';
import { EditParams, EditResponse, EditStreamEvent } from '../types/api';
import { SVGMakerClient } from '../core/SVGMakerClient';
import { z } from 'zod';
import { Readable } from 'stream';
import { decodeSvgContent, decodeBase64Png } from '../utils/base64';

/**
 * Schema for validating edit parameters
 */
const editParamsSchema = z
  .object({
    image: z.union([z.string(), z.instanceof(Buffer), z.instanceof(Readable)]),
    prompt: z.string().optional(),
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
    quality: z.enum(['low', 'medium', 'high']).optional(),
    aspectRatio: z.enum(['auto', 'portrait', 'landscape', 'square']).optional(),
    background: z.enum(['auto', 'transparent', 'opaque']).optional(),
    storage: z.boolean().optional(),
    stream: z.boolean().optional(),
    base64Png: z.boolean().optional(),
    svgText: z.boolean().optional(),
    model: z.string().optional(),
  })
  .refine(data => data.prompt || data.styleParams, {
    message: 'Either prompt or styleParams must be provided',
  })
  .refine(data => !(data.model && data.quality), {
    message: "Cannot specify both 'model' and 'quality'. Use one or the other.",
  });

/**
 * Client for the Edit SVG/Image API
 */
export class EditClient extends BaseClient {
  private params: Partial<EditParams> = {};

  /**
   * Create a new Edit client
   * @param client Parent SVGMaker client
   */
  constructor(client: SVGMakerClient) {
    super(client);
  }

  /**
   * Execute the Edit SVG/Image request
   * @returns Edit response
   */
  public async execute(): Promise<EditResponse> {
    this.logger.debug('Starting image/SVG edit', {
      prompt: this.params.prompt,
      quality: this.params.quality,
      hasImage: !!this.params.image,
    });

    // Apply defaults before validation
    this.applyDefaults();

    // Validate parameters
    this.validateRequest(this.params, editParamsSchema);

    // Prepare form data
    const formData = new FormData();

    // Add image file
    await this.addFileToForm(formData, 'image', this.params.image!);

    // Add styleParams if present (requires JSON.stringify)
    if (this.params.styleParams) {
      formData.append('styleParams', JSON.stringify(this.params.styleParams));
    }

    // Add optional parameters
    this.appendOptionalParams(formData, this.params as Record<string, any>, [
      'prompt', 'quality', 'aspectRatio', 'background', 'storage', 'stream', 'base64Png', 'svgText', 'model',
    ]);

    // Execute request
    const { data, metadata: responseMetadata } = await this.executeFormDataRequest<any>(
      '/v1/edit',
      formData
    );

    let pngImageData: Buffer | undefined = undefined;
    if (data.base64Png && typeof data.base64Png === 'string') {
      pngImageData = decodeBase64Png(data.base64Png);
    }

    let svgText: string | undefined = undefined;
    if (data.svgText && typeof data.svgText === 'string') {
      svgText = decodeSvgContent(data.svgText);
    }

    const result: EditResponse = {
      svgUrl: data.svgUrl,
      creditCost: data.creditCost,
      message: data.message ?? '',
      svgUrlExpiresIn: data.svgUrlExpiresIn,
      generationId: data.generationId,
      metadata: responseMetadata,
      pngImageData,
      svgText,
    };

    this.logger.debug('Image/SVG edit completed', {
      creditCost: result.creditCost,
      hasSvgText: !!result.svgText,
      hasPngData: !!result.pngImageData,
    });

    return result;
  }

  /**
   * Configure the edit parameters
   * @param config Configuration object with edit parameters
   * @returns New client instance
   */
  public configure(config: Partial<EditParams>): EditClient {
    this.logger.debug('Configuring edit parameters', { config });

    const client = this.clone();
    client.params = { ...client.params, ...config };

    // Apply default values for edit mode
    client.applyDefaults();

    return client;
  }

  /**
   * Apply default values for edit mode
   * @private
   */
  private applyDefaults(): void {
    // Set default quality to medium if not specified (but not when model is used)
    if (!this.params.quality && !this.params.model) {
      this.params.quality = 'medium';
    }
  }

  /**
   * Stream the edit response
   * @returns Readable stream of events
   */
  public stream(): Readable {
    // Create a clone with streaming enabled
    const client = this.clone();
    client.params.stream = true;

    // Apply defaults before validation
    client.applyDefaults();

    // Validate parameters
    this.validateRequest(client.params, editParamsSchema);

    // Create a readable stream for the events
    const stream = new Readable({
      objectMode: true,
      read() {},
    });

    // Execute the request and handle streaming
    (async () => {
      try {
        // Prepare form data
        const formData = new FormData();

        // Add image file
        await this.addFileToForm(formData, 'image', client.params.image!);

        // Add prompt if present
        if (client.params.prompt) {
          formData.append('prompt', client.params.prompt);
        }

        // Add styleParams if present
        if (client.params.styleParams) {
          formData.append('styleParams', JSON.stringify(client.params.styleParams));
        }

        // Add options
        if (client.params.quality) {
          formData.append('quality', client.params.quality);
        }

        if (client.params.aspectRatio) {
          formData.append('aspectRatio', client.params.aspectRatio);
        }

        if (client.params.background) {
          formData.append('background', client.params.background);
        }

        formData.append('stream', 'true');

        if (client.params.base64Png) {
          formData.append('base64Png', String(client.params.base64Png));
        }

        if (client.params.svgText) {
          formData.append('svgText', String(client.params.svgText));
        }

        if (client.params.storage !== undefined) {
          formData.append('storage', String(client.params.storage));
        }

        if (client.params.model) {
          formData.append('model', client.params.model);
        }

        // Make request to the streaming endpoint using native fetch
        const response = await fetch(`${this.config.baseUrl}/v1/edit`, {
          method: 'POST',
          headers: {
            Accept: 'text/event-stream',
            'x-api-key': this.config.apiKey,
          },
          body: formData,
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
              const event = JSON.parse(trimmedLine) as EditStreamEvent;

              // --- Begin: Normalize event fields to match non-streaming response ---
              // Normalize svgText (API now sends raw SVG text, but we handle legacy base64 too)
              if (event.svgText && typeof event.svgText === 'string') {
                event.svgText = decodeSvgContent(event.svgText);
              }
              // Convert base64Png to pngImageData (Buffer) if present
              if (event.base64Png && typeof event.base64Png === 'string') {
                try {
                  event.pngImageData = decodeBase64Png(event.base64Png);
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
            const event = JSON.parse(buffer.trim()) as EditStreamEvent;
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
  protected clone(): EditClient {
    const client = new EditClient(this.client);
    this.copyTo(client);
    client.params = { ...this.params };
    return client;
  }
}
