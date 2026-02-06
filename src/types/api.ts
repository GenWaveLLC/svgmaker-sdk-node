/**
 * Common types for the SVGMaker v1 API
 */

import { Readable } from 'stream';

export type Quality = 'low' | 'medium' | 'high';
export type AspectRatio = 'auto' | 'portrait' | 'landscape' | 'square';
export type Background = 'auto' | 'transparent' | 'opaque';
export type Style =
  | 'flat'
  | 'line_art'
  | 'engraving'
  | 'linocut'
  | 'silhouette'
  | 'isometric'
  | 'cartoon'
  | 'ghibli';
export type ColorMode = 'full_color' | 'monochrome' | 'few_colors';
export type ImageComplexity = 'icon' | 'illustration' | 'scene';
export type Composition =
  | 'centered_object'
  | 'repeating_pattern'
  | 'full_scene'
  | 'objects_in_grid';
export type TextStyle = 'only_title' | 'embedded_text';

/**
 * Response metadata included in all v1 API responses
 */
export interface ResponseMetadata {
  /** Unique identifier for the request */
  requestId: string;

  /** Number of credits consumed by this request */
  creditsUsed: number;

  /** Number of credits remaining on the account */
  creditsRemaining: number;
}

/**
 * Style parameters object
 */
export interface StyleParams {
  /** Optional: Art style preference */
  style?: Style;

  /** Optional: Color scheme preference */
  color_mode?: ColorMode;

  /** Optional: Complexity level */
  image_complexity?: ImageComplexity;

  /** Optional: Layout composition */
  composition?: Composition;

  /** Optional: Text style for the generated SVG */
  text?: TextStyle;
}

/**
 * Generate SVG request parameters
 */
export interface GenerateParams {
  /** Required: Description of the SVG to generate */
  prompt: string;

  /** Optional: Generation quality: "low", "medium", "high" */
  quality?: Quality;

  /** Optional: Aspect ratio: "auto", "portrait", "landscape", "square" */
  aspectRatio?: AspectRatio;

  /** Optional: Background type: "auto", "transparent", "opaque" */
  background?: Background;

  /** Optional: Enable streaming response for real-time updates */
  stream?: boolean;

  /** Optional: Include base64-encoded PNG preview in response (default: false) */
  base64Png?: boolean;

  /** Optional: Include SVG source code as text in response (default: false) */
  svgText?: boolean;

  /** Optional: Style parameters object containing style, color_mode, image_complexity, composition, and text options */
  styleParams?: StyleParams;

  /** Optional: Store the generated SVG on SVGMaker servers (default: false) */
  storage?: boolean;

  /** Optional: Specific AI model ID to use. Cannot be combined with quality. Credits are charged based on the model. */
  model?: string;
}

/**
 * Edit SVG/Image request parameters
 */
export interface EditParams {
  /** Required: Image file to edit */
  image: string | Buffer | Readable;

  /** Optional: Edit instructions as a simple text string */
  prompt?: string;

  /** Optional: Style parameters as JSON object */
  styleParams?: StyleParams;

  /** Optional: Quality level: "low", "medium", "high" (default: "medium") */
  quality?: Quality;

  /** Optional: Aspect ratio: "auto", "portrait", "landscape", "square" (default: "auto") */
  aspectRatio?: AspectRatio;

  /** Optional: Background: "auto", "transparent", "opaque" (default: "auto") */
  background?: Background;

  /** Optional: Enable streaming response (default: false) */
  stream?: boolean;

  /** Optional: Include base64-encoded PNG preview in response (default: false) */
  base64Png?: boolean;

  /** Optional: Include SVG source code as text in response (default: false) */
  svgText?: boolean;

  /** Optional: Store the edited SVG on SVGMaker servers (default: false) */
  storage?: boolean;

  /** Optional: Specific AI model ID to use. Cannot be combined with quality. Credits are charged based on the model. */
  model?: string;
}

/**
 * AI Vectorize (Convert Image to SVG) request parameters
 */
export interface AiVectorizeParams {
  /** Required: File to convert to SVG */
  file: string | Buffer | Readable;

  /** Optional: Enable streaming response (default: false) */
  stream?: boolean;

  /** Optional: Include SVG source code as text in response (default: false) */
  svgText?: boolean;

  /** Optional: Store the converted SVG on SVGMaker servers (default: false) */
  storage?: boolean;
}

/**
 * Convert Image to SVG request parameters
 * @deprecated Use AiVectorizeParams instead
 */
export type ConvertParams = AiVectorizeParams;

/**
 * Base SVGMaker API response
 */
export interface BaseResponse {
  /** URL to the generated/edited/converted SVG */
  svgUrl: string;

  /** Number of credits consumed by the operation */
  creditCost: number;

  /** Response metadata with requestId, creditsUsed, and creditsRemaining */
  metadata: ResponseMetadata;

  /** Human-readable message about the operation result */
  message: string;

  /** Expiration time for the SVG URL (e.g., "24h") */
  svgUrlExpiresIn?: string;

  /** Unique identifier for this generation */
  generationId?: string;
}

/**
 * Generate SVG response
 */
export interface GenerateResponse extends BaseResponse {
  /** PNG image data as Buffer (decoded from server response) - only when base64Png=true */
  pngImageData?: Buffer;

  /** SVG source code as text - only when svgText=true */
  svgText?: string;

  /** The quality level used */
  quality: Quality;
}

/**
 * Edit SVG/Image response
 */
export interface EditResponse extends BaseResponse {
  /** PNG image data as Buffer (decoded from server response) - only when base64Png=true */
  pngImageData?: Buffer;

  /** SVG source code as text - only when svgText=true */
  svgText?: string;
}

/**
 * AI Vectorize (Convert Image to SVG) response
 */
export interface AiVectorizeResponse extends BaseResponse {
  /** SVG source code as text - only when svgText=true */
  svgText?: string;
}

/**
 * Convert Image to SVG response
 * @deprecated Use AiVectorizeResponse instead
 */
export type ConvertResponse = AiVectorizeResponse;

/**
 * Stream event base type
 */
export interface StreamEventBase {
  /** Status of the streaming response */
  status: 'processing' | 'generated' | 'storing' | 'complete' | 'error';
  /** SVG source code as text (decoded, only when svgText=true and available) */
  svgText?: string;
  /** Base64-encoded PNG preview (only when base64Png=true and available) */
  base64Png?: string;
  /** PNG image data as Buffer (decoded from base64Png, only when available) */
  pngImageData?: Buffer;
}

/**
 * Processing stream event
 */
export interface ProcessingStreamEvent extends StreamEventBase {
  status: 'processing' | 'generated' | 'storing';
  /** Progress message */
  message: string;
  /** URL to the generated/edited/converted SVG (may appear in generated event) */
  svgUrl?: string;
  /** Number of credits consumed by the operation (may appear in generated event) */
  creditCost?: number;
  /** Expiration time for the SVG URL (may appear in generated event) */
  svgUrlExpiresIn?: string;
  /** The quality level used (may appear in generated event) */
  quality?: string;
}

/**
 * Complete stream event
 */
export interface CompleteStreamEvent extends StreamEventBase {
  status: 'complete';
  /** URL to the generated/edited/converted SVG */
  svgUrl: string;
  /** SVG source code as text - only when svgText=true */
  svgText?: string;
  /** Expiration time for the SVG URL */
  svgUrlExpiresIn?: string;
  /** Unique identifier for this generation */
  generationId?: string;
  /** Number of credits consumed by the operation */
  creditCost?: number;
  /** Human-readable message about the operation result */
  message?: string;
  /** Response metadata */
  metadata?: ResponseMetadata;
}

/**
 * Error stream event
 */
export interface ErrorStreamEvent extends StreamEventBase {
  status: 'error';
  /** Error message */
  error: string;
  /** Error type */
  errorType: string;
}

/**
 * Any stream event type
 */
export type StreamEvent = ProcessingStreamEvent | CompleteStreamEvent | ErrorStreamEvent;

/**
 * Generate stream event
 */
export type GenerateStreamEvent = StreamEvent;

/**
 * Edit stream event
 */
export type EditStreamEvent = StreamEvent;

/**
 * Convert stream event
 */
export type ConvertStreamEvent = StreamEvent;

/**
 * AI Vectorize stream event
 */
export type AiVectorizeStreamEvent = StreamEvent;
