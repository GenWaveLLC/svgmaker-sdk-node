import { BaseClient } from '../BaseClient';
import { AiVectorizeParams, AiVectorizeResponse, AiVectorizeStreamEvent } from '../../types/api';
import { SVGMakerClient } from '../../core/SVGMakerClient';
import { z } from 'zod';
import { Readable } from 'stream';
import * as fs from 'fs';
import * as path from 'path';
import { ValidationError } from '../../errors/CustomErrors';
import { decodeSvgContent } from '../../utils/base64';

/**
 * Schema for validating AI vectorize parameters
 */
const aiVectorizeParamsSchema = z.object({
  file: z.union([z.string(), z.instanceof(Buffer), z.instanceof(Readable)]),
  storage: z.boolean().optional(),
  stream: z.boolean().optional(),
  svgText: z.boolean().optional(),
});

/**
 * Client for the AI Vectorize (Convert Image to SVG) API
 */
export class AIVectorizeClient extends BaseClient {
  private params: Partial<AiVectorizeParams> = {};

  /**
   * Create a new AI Vectorize client
   * @param client Parent SVGMaker client
   */
  constructor(client: SVGMakerClient) {
    super(client);
  }

  /**
   * Execute the AI Vectorize request
   * @returns AI Vectorize response
   */
  public async execute(): Promise<AiVectorizeResponse> {
    this.logger.debug('Starting AI vectorize conversion', {
      hasFile: !!this.params.file,
      svgTextRequested: !!this.params.svgText,
    });

    // Validate parameters
    this.validateRequest(this.params, aiVectorizeParamsSchema);

    // Prepare form data
    const formData = new FormData();

    // Add file
    await this.addFileToForm(formData, 'file', this.params.file!);

    // Add storage option if present
    if (this.params.storage !== undefined) {
      formData.append('storage', String(this.params.storage));
    }

    // Add stream option if present
    if (this.params.stream) {
      formData.append('stream', String(this.params.stream));
    }

    if (this.params.svgText) {
      formData.append('svgText', String(this.params.svgText));
    }

    // Execute request using native fetch
    const response = await fetch(`${this.config.baseUrl}/v1/convert/ai-vectorize`, {
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

    this.logger.debug('AI vectorize conversion completed', {
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
    } as AiVectorizeResponse;
  }

  /**
   * Configure the AI vectorize parameters
   * @param config Configuration object with AI vectorize parameters
   * @returns New client instance
   */
  public configure(config: Partial<AiVectorizeParams>): AIVectorizeClient {
    this.logger.debug('Configuring AI vectorize parameters', { config });

    const client = this.clone();
    client.params = { ...client.params, ...config };
    return client;
  }

  /**
   * Stream the AI vectorize response
   * @returns Readable stream of events
   */
  public stream(): Readable {
    // Create a clone with streaming enabled
    const client = this.clone();
    client.params.stream = true;

    // Validate parameters
    this.validateRequest(client.params, aiVectorizeParamsSchema);

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

        // Add file
        await this.addFileToForm(formData, 'file', client.params.file!);

        // Add storage option if present
        if (client.params.storage !== undefined) {
          formData.append('storage', String(client.params.storage));
        }

        // Add stream option
        formData.append('stream', 'true');

        if (client.params.svgText) {
          formData.append('svgText', String(client.params.svgText));
        }

        // Make request to the streaming endpoint using native fetch
        const response = await fetch(`${this.config.baseUrl}/v1/convert/ai-vectorize`, {
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
              const event = JSON.parse(trimmedLine) as AiVectorizeStreamEvent;
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
            const event = JSON.parse(buffer.trim()) as AiVectorizeStreamEvent;
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
  protected clone(): AIVectorizeClient {
    const client = new AIVectorizeClient(this.client);
    this.copyTo(client);
    client.params = { ...this.params };
    return client;
  }
}
