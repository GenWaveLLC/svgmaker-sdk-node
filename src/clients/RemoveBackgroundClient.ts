import { BaseClient } from './BaseClient';
import {
  RemoveBackgroundParams,
  RemoveBackgroundResponse,
  RemoveBackgroundStreamEvent,
} from '../types/api';
import { SVGMakerClient } from '../core/SVGMakerClient';
import { z } from 'zod';
import { Readable } from 'stream';
import { decodeSvgContent } from '../utils/base64';

/**
 * Schema for validating remove background parameters
 */
const removeBackgroundParamsSchema = z
  .object({
    file: z.union([z.string(), z.instanceof(Buffer), z.instanceof(Readable)]).optional(),
    imageUrl: z.string().optional(),
    generationId: z.string().optional(),
    uploadId: z.string().optional(),
    stream: z.boolean().optional(),
    svgText: z.boolean().optional(),
    storage: z.boolean().optional(),
  })
  .refine(
    data =>
      (data.file ? 1 : 0) +
        (data.imageUrl ? 1 : 0) +
        (data.generationId ? 1 : 0) +
        (data.uploadId ? 1 : 0) ===
      1,
    {
      message: "Provide exactly one image source: 'file', 'imageUrl', 'generationId' or 'uploadId'",
    }
  );

/**
 * Client for the Remove Background API
 *
 * Removes the background from an image and returns the result as an SVG with
 * transparency. Accepts any raster image (PNG, JPEG, WebP, etc.) or SVG.
 */
export class RemoveBackgroundClient extends BaseClient {
  private params: Partial<RemoveBackgroundParams> = {};

  /**
   * Create a new Remove Background client
   * @param client Parent SVGMaker client
   */
  constructor(client: SVGMakerClient) {
    super(client);
  }

  /**
   * Execute the Remove Background request
   * @returns Remove Background response
   */
  public async execute(): Promise<RemoveBackgroundResponse> {
    this.logger.debug('Starting background removal', {
      hasFile: !!this.params.file,
      svgTextRequested: !!this.params.svgText,
    });

    // Validate parameters
    this.validateRequest(this.params, removeBackgroundParamsSchema);

    // Prepare form data
    const formData = new FormData();

    await this.appendImageSource(formData, this.params, 'file');

    // Add optional parameters
    this.appendOptionalParams(formData, this.params as Record<string, any>, [
      'storage',
      'stream',
      'svgText',
    ]);

    // Execute request
    const { data, metadata: responseMetadata } = await this.executeFormDataRequest<any>(
      '/v1/remove-background',
      formData
    );

    this.logger.debug('Background removal completed', {
      creditCost: data.creditCost,
      hasSvgText: !!data.svgText,
    });

    // Normalize svgText (API now sends raw SVG text, but we handle legacy base64 too)
    let svgText: string | undefined = undefined;
    if (data.svgText && typeof data.svgText === 'string') {
      svgText = decodeSvgContent(data.svgText);
    }

    return {
      svgUrl: data.svgUrl,
      creditCost: data.creditCost,
      message: data.message ?? '',
      svgUrlExpiresIn: data.svgUrlExpiresIn,
      generationId: data.generationId,
      metadata: responseMetadata,
      svgText,
    } as RemoveBackgroundResponse;
  }

  /**
   * Configure the remove background parameters
   * @param config Configuration object with remove background parameters
   * @returns New client instance
   */
  public configure(config: Partial<RemoveBackgroundParams>): RemoveBackgroundClient {
    this.logger.debug('Configuring remove background parameters', { config });

    const client = this.clone();
    client.params = { ...client.params, ...config };
    return client;
  }

  /**
   * Stream the remove background response
   * @returns Readable stream of events
   */
  public stream(): Readable {
    // Create a clone with streaming enabled
    const client = this.clone();
    client.params.stream = true;

    // Validate parameters
    this.validateRequest(client.params, removeBackgroundParamsSchema);

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

        await this.appendImageSource(formData, client.params, 'file');

        // Add storage option if present
        if (client.params.storage !== undefined) {
          formData.append('storage', String(client.params.storage));
        }

        // Add stream option
        formData.append('stream', 'true');

        if (client.params.svgText) {
          formData.append('svgText', String(client.params.svgText));
        }

        // Make request to the streaming endpoint using native fetch. Auth headers
        // prefer the OAuth Bearer token when present, else the x-api-key.
        const response = await fetch(`${this.config.baseUrl}/v1/remove-background`, {
          method: 'POST',
          headers: {
            Accept: 'text/event-stream',
            ...this.buildAuthHeaders(),
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
              const event = JSON.parse(trimmedLine) as RemoveBackgroundStreamEvent;
              // Normalize svgText (API now sends raw SVG text, but we handle legacy base64 too)
              if (event.svgText && typeof event.svgText === 'string') {
                event.svgText = decodeSvgContent(event.svgText);
              }
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
            const event = JSON.parse(buffer.trim()) as RemoveBackgroundStreamEvent;
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
  protected clone(): RemoveBackgroundClient {
    const client = new RemoveBackgroundClient(this.client);
    this.copyTo(client);
    client.params = { ...this.params };
    return client;
  }
}
