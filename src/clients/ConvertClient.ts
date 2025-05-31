import { BaseClient } from './BaseClient';
import { ConvertParams, ConvertResponse, ConvertStreamEvent } from '../types/api';
import { SVGMakerClient } from '../core/SVGMakerClient';
import { z } from 'zod';
import { Readable } from 'stream';
import FormData from 'form-data';
import * as fs from 'fs';
import * as path from 'path';
import { ValidationError } from '../errors/CustomErrors';

/**
 * Schema for validating convert parameters
 */
const convertParamsSchema = z.object({
  file: z.union([z.string(), z.instanceof(Buffer), z.instanceof(Readable)]),
  stream: z.boolean().optional(),
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
    // Validate parameters
    this.validateRequest(this.params, convertParamsSchema);

    // Prepare form data
    const formData = new FormData();

    // Add file
    this.addFileToForm(formData, 'file', this.params.file!);

    // Add stream option if present
    if (this.params.stream) {
      formData.append('stream', String(this.params.stream));
    }

    // Execute request
    return this.handleRequest<ConvertResponse>('/convert', {
      method: 'POST',
      formData,
    });
  }

  /**
   * Configure the convert parameters
   * @param config Configuration object with convert parameters
   * @returns New client instance
   */
  public configure(config: Partial<ConvertParams>): ConvertClient {
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
        this.addFileToForm(formData, 'file', client.params.file!);

        // Add stream option
        formData.append('stream', 'true');

        // In a real implementation, this would handle SSE or other streaming protocol
        // For now, we'll simulate it with a basic implementation
        const response = await fetch(`${this.config.baseUrl}/convert`, {
          method: 'POST',
          headers: {
            Accept: 'text/event-stream',
            'x-api-key': this.config.apiKey,
          },
          // Note: In a real implementation, we'd need to ensure compatibility
          // between form-data and fetch. This might require using a different
          // approach or a compatibility layer.
          body: formData as any,
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
                const event = JSON.parse(data) as ConvertStreamEvent;
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
   * Add a file to the form data
   * @param formData Form data
   * @param fieldName Form field name
   * @param file File path, buffer, or stream
   */
  private addFileToForm(
    formData: FormData,
    fieldName: string,
    file: string | Buffer | Readable
  ): void {
    if (typeof file === 'string') {
      // Check if the file exists
      if (!fs.existsSync(file)) {
        throw new ValidationError(`File not found: ${file}`);
      }

      // Add file from path
      formData.append(fieldName, fs.createReadStream(file), {
        filename: path.basename(file),
      });
    } else if (Buffer.isBuffer(file)) {
      // Add file from buffer
      formData.append(fieldName, file, {
        filename: 'file',
      });
    } else if (file instanceof Readable) {
      // Add file from stream
      formData.append(fieldName, file, {
        filename: 'file',
      });
    } else {
      throw new ValidationError(`Invalid file type: ${typeof file}`);
    }
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
