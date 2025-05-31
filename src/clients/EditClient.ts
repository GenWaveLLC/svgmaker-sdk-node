import { BaseClient } from './BaseClient';
import { EditParams, EditResponse, EditStreamEvent } from '../types/api';
import { SVGMakerClient } from '../core/SVGMakerClient';
import { z } from 'zod';
import { Readable } from 'stream';
import FormData from 'form-data';
import * as fs from 'fs';
import * as path from 'path';
import { ValidationError } from '../errors/CustomErrors';

/**
 * Schema for validating edit parameters
 */
const editParamsSchema = z.object({
  image: z.union([z.string(), z.instanceof(Buffer), z.instanceof(Readable)]),
  prompt: z.union([
    z.string(),
    z.object({
      prompt: z.string(),
      style: z
        .enum(['minimalist', 'cartoon', 'realistic', 'abstract', 'flat', 'isometric'])
        .optional(),
      color_mode: z.enum(['monochrome', '2-colors', '3-colors', 'full-color']).optional(),
      advanced: z
        .object({
          stroke_weight: z.enum(['thin', 'medium', 'thick']).optional(),
          corner_style: z.enum(['none', 'rounded', 'sharp']).optional(),
          shadow_effect: z.enum(['none', 'soft', 'hard']).optional(),
        })
        .optional(),
    }),
  ]),
  mask: z.union([z.string(), z.instanceof(Buffer), z.instanceof(Readable)]).optional(),
  quality: z.enum(['low', 'medium', 'high']).optional(),
  aspectRatio: z.enum(['auto', 'portrait', 'landscape', 'square', 'wide', 'tall']).optional(),
  background: z.enum(['auto', 'transparent', 'opaque']).optional(),
  stream: z.boolean().optional(),
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
    // Validate parameters
    this.validateRequest(this.params, editParamsSchema);

    // Prepare form data
    const formData = new FormData();

    // Add image file
    this.addFileToForm(formData, 'image', this.params.image!);

    // Add prompt
    if (typeof this.params.prompt === 'string') {
      formData.append('prompt', this.params.prompt);
    } else {
      formData.append('prompt', JSON.stringify(this.params.prompt));
    }

    // Add mask if present
    if (this.params.mask) {
      this.addFileToForm(formData, 'mask', this.params.mask);
    }

    // Add options
    if (this.params.quality) {
      formData.append('quality', this.params.quality);
    }

    if (this.params.aspectRatio) {
      formData.append('aspectRatio', this.params.aspectRatio);
    }

    if (this.params.background) {
      formData.append('background', this.params.background);
    }

    if (this.params.stream) {
      formData.append('stream', String(this.params.stream));
    }

    // Execute request
    return this.handleRequest<EditResponse>('/edit', {
      method: 'POST',
      formData,
    });
  }

  /**
   * Configure the edit parameters
   * @param config Configuration object with edit parameters
   * @returns New client instance
   */
  public configure(config: Partial<EditParams>): EditClient {
    const client = this.clone();
    client.params = { ...client.params, ...config };
    return client;
  }

  /**
   * Stream the edit response
   * @returns Readable stream of events
   */
  public stream(): Readable {
    // Create a clone with streaming enabled
    const client = this.clone();
    client.params.stream = true;

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
        this.addFileToForm(formData, 'image', client.params.image!);

        // Add prompt
        if (typeof client.params.prompt === 'string') {
          formData.append('prompt', client.params.prompt);
        } else {
          formData.append('prompt', JSON.stringify(client.params.prompt));
        }

        // Add mask if present
        if (client.params.mask) {
          this.addFileToForm(formData, 'mask', client.params.mask);
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

        // In a real implementation, this would handle SSE or other streaming protocol
        // For now, we'll simulate it with a basic implementation
        const response = await fetch(`${this.config.baseUrl}/edit`, {
          method: 'POST',
          headers: {
            Accept: 'text/event-stream',
            'x-api-key': this.config.apiKey,
          },
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
                const event = JSON.parse(data) as EditStreamEvent;
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
  protected clone(): EditClient {
    const client = new EditClient(this.client);
    this.copyTo(client);
    client.params = { ...this.params };
    return client;
  }
}
