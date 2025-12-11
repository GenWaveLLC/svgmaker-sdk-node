import { BaseClient } from './BaseClient';
import { EditParams, EditResponse, EditStreamEvent } from '../types/api';
import { SVGMakerClient } from '../core/SVGMakerClient';
import { z } from 'zod';
import { Readable } from 'stream';
import * as fs from 'fs';
import * as path from 'path';
import { ValidationError } from '../errors/CustomErrors';
import { decodeSvgContent, decodeBase64Png } from '../utils/base64';

/**
 * Schema for validating edit parameters
 */
const editParamsSchema = z.object({
  image: z.union([z.string(), z.instanceof(Buffer), z.instanceof(Readable)]),
  prompt: z.string(),
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
  mask: z.union([z.string(), z.instanceof(Buffer), z.instanceof(Readable)]).optional(),
  quality: z.enum(['low', 'medium', 'high']).optional(),
  aspectRatio: z.enum(['auto', 'portrait', 'landscape', 'square']).optional(), // Edit mode only supports these aspect ratios
  background: z.enum(['auto', 'transparent', 'opaque']).optional(),
  stream: z.boolean().optional(),
  base64Png: z.boolean().optional(),
  svgText: z.boolean().optional(),
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
      hasMask: !!this.params.mask,
    });

    // Apply defaults before validation
    this.applyDefaults();

    // Validate parameters
    this.validateRequest(this.params, editParamsSchema);

    // Prepare form data
    const formData = new FormData();

    // Add image file
    await this.addFileToForm(formData, 'image', this.params.image!);

    // Add prompt
    formData.append('prompt', this.params.prompt!);

    // Add styleParams if present
    if (this.params.styleParams) {
      formData.append('styleParams', JSON.stringify(this.params.styleParams));
    }

    // Add mask if present
    if (this.params.mask) {
      await this.addFileToForm(formData, 'mask', this.params.mask);
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

    if (this.params.base64Png) {
      formData.append('base64Png', String(this.params.base64Png));
    }

    if (this.params.svgText) {
      formData.append('svgText', String(this.params.svgText));
    }

    // Execute request using native fetch (for FormData compatibility)
    const response = await fetch(`${this.config.baseUrl}/edit`, {
      method: 'POST',
      headers: {
        'x-api-key': this.config.apiKey,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      this.logger.error('Edit request failed', { status: response.status, error: errorText });
      throw new Error(`HTTP error ${response.status}: ${errorText}`);
    }

    const rawResult = await response.json();
    // Only log the base64Png field for debugging PNG issues
    console.log('base64Png from /edit API:', rawResult.base64Png);

    // Manually decode base64Png to pngImageData (like the interceptor)
    let pngImageData: Buffer | undefined = undefined;
    if (rawResult.base64Png && typeof rawResult.base64Png === 'string') {
      pngImageData = decodeBase64Png(rawResult.base64Png);
    }

    // Normalize svgText (API now sends raw SVG text, but we handle legacy base64 too)
    let svgText: string | undefined = undefined;
    if (rawResult.svgText && typeof rawResult.svgText === 'string') {
      svgText = decodeSvgContent(rawResult.svgText);
    }

    // Compose the response to match EditResponse (only fields present in backend response)
    const result: EditResponse = {
      svgUrl: rawResult.svgUrl,
      creditCost: rawResult.creditCost,
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
    // Set default quality to medium if not specified
    if (!this.params.quality) {
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

        // Add prompt
        formData.append('prompt', client.params.prompt!);

        // Add styleParams if present
        if (client.params.styleParams) {
          formData.append('styleParams', JSON.stringify(client.params.styleParams));
        }

        // Add mask if present
        if (client.params.mask) {
          await this.addFileToForm(formData, 'mask', client.params.mask);
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

        // Make request to the streaming endpoint using native fetch
        const response = await fetch(`${this.config.baseUrl}/edit`, {
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
      const blob = new Blob([new Uint8Array(file)], { type: 'application/octet-stream' });
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
  protected clone(): EditClient {
    const client = new EditClient(this.client);
    this.copyTo(client);
    client.params = { ...this.params };
    return client;
  }
}
