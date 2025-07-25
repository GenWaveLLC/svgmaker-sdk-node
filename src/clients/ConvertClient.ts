import { BaseClient } from './BaseClient';
import { ConvertParams, ConvertResponse, ConvertStreamEvent } from '../types/api';
import { SVGMakerClient } from '../core/SVGMakerClient';
import { z } from 'zod';
import { Readable } from 'stream';
import * as fs from 'fs';
import * as path from 'path';
import { ValidationError } from '../errors/CustomErrors';
import { decodeSvgContent } from '../utils/base64';

/**
 * Schema for validating convert parameters
 */
const convertParamsSchema = z.object({
  file: z.union([z.string(), z.instanceof(Buffer), z.instanceof(Readable)]),
  stream: z.boolean().optional(),
  svgText: z.boolean().optional(),
});

/**
 * Client for the Convert Image to SVG API
 */
export class ConvertClient extends BaseClient {
  private params: Partial<ConvertParams> = {};

  /**
   * Create a new Convert client
   * @param client Parent SVGMaker client
   */
  constructor(client: SVGMakerClient) {
    super(client);
  }

  /**
   * Execute the Convert request
   * @returns Convert response
   */
  public async execute(): Promise<ConvertResponse> {
    this.logger.debug('Starting image to SVG conversion', {
      hasFile: !!this.params.file,
      svgTextRequested: !!this.params.svgText,
    });

    // Validate parameters
    this.validateRequest(this.params, convertParamsSchema);

    // Prepare form data
    const formData = new FormData();

    // Add file
    await this.addFileToForm(formData, 'file', this.params.file!);

    // Add stream option if present
    if (this.params.stream) {
      formData.append('stream', String(this.params.stream));
    }

    if (this.params.svgText) {
      formData.append('svgText', String(this.params.svgText));
    }

    // Execute request using native fetch
    const response = await fetch(`${this.config.baseUrl}/convert`, {
      method: 'POST',
      headers: {
        'x-api-key': this.config.apiKey,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      this.logger.error('Convert request failed', { status: response.status, error: errorText });
      throw new Error(`HTTP error ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    this.logger.debug('Image to SVG conversion completed', {
      creditCost: result.creditCost,
      hasSvgText: !!result.svgText,
    });

    // Decode base64 SVG text if present
    if (result.svgText && typeof result.svgText === 'string') {
      result.svgText = decodeSvgContent(result.svgText);
    }

    return result as ConvertResponse;
  }

  /**
   * Configure the convert parameters
   * @param config Configuration object with convert parameters
   * @returns New client instance
   */
  public configure(config: Partial<ConvertParams>): ConvertClient {
    this.logger.debug('Configuring convert parameters', { config });

    const client = this.clone();
    client.params = { ...client.params, ...config };
    return client;
  }

  /**
   * Stream the convert response
   * @returns Readable stream of events
   */
  public stream(): Readable {
    // Create a clone with streaming enabled
    const client = this.clone();
    client.params.stream = true;

    // Validate parameters
    this.validateRequest(client.params, convertParamsSchema);

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

        // Add stream option
        formData.append('stream', 'true');

        if (client.params.svgText) {
          formData.append('svgText', String(client.params.svgText));
        }

        // Make request to the streaming endpoint using native fetch
        const response = await fetch(`${this.config.baseUrl}/convert`, {
          method: 'POST',
          headers: {
            Accept: 'text/event-stream',
            'x-api-key': this.config.apiKey,
          },
          body: formData,
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
              const event = JSON.parse(trimmedLine) as ConvertStreamEvent;
              // Decode svgText from base64 if present and is a string
              if (event.svgText && typeof event.svgText === 'string') {
                event.svgText = decodeSvgContent(event.svgText);
              }
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
            const event = JSON.parse(buffer.trim()) as ConvertStreamEvent;
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
   * Add a file to the form data
   * @param formData Form data
   * @param fieldName Form field name
   * @param file File path, buffer, or stream
   */
  private async addFileToForm(
    formData: FormData,
    fieldName: string,
    file: string | Buffer | Readable
  ): Promise<void> {
    if (typeof file === 'string') {
      // Check if the file exists
      if (!fs.existsSync(file)) {
        throw new ValidationError(`File not found: ${file}`);
      }

      // Read file and create a Blob
      const fileBuffer = fs.readFileSync(file);
      const filename = path.basename(file);
      const mimeType = this.getMimeType(filename);

      const blob = new Blob([fileBuffer], { type: mimeType });
      formData.append(fieldName, blob, filename);
    } else if (Buffer.isBuffer(file)) {
      // Convert buffer to Blob
      const blob = new Blob([file], { type: 'application/octet-stream' });
      formData.append(fieldName, blob, 'file');
    } else if (file instanceof Readable) {
      // Convert stream to buffer then to Blob
      const chunks: Buffer[] = [];
      for await (const chunk of file) {
        chunks.push(Buffer.from(chunk));
      }
      const buffer = Buffer.concat(chunks);
      const blob = new Blob([buffer], { type: 'application/octet-stream' });
      formData.append(fieldName, blob, 'file');
    } else {
      throw new ValidationError(`Invalid file type: ${typeof file}`);
    }
  }

  /**
   * Get MIME type from filename
   * @param filename File name
   * @returns MIME type
   */
  private getMimeType(filename: string): string {
    const ext = path.extname(filename).toLowerCase();
    const mimeTypes: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      '.webp': 'image/webp',
      '.bmp': 'image/bmp',
    };
    return mimeTypes[ext] || 'application/octet-stream';
  }

  /**
   * Create a clone of this client
   * @returns New client instance
   */
  protected clone(): ConvertClient {
    const client = new ConvertClient(this.client);
    this.copyTo(client);
    client.params = { ...this.params };
    return client;
  }
}
