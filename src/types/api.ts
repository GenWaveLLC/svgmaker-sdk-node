/**
 * Common types for the SVGMaker API
 */

import { Readable } from 'stream';

export type Quality = 'low' | 'medium' | 'high';
export type AspectRatio = 'auto' | 'portrait' | 'landscape' | 'square' | 'wide' | 'tall';
export type Background = 'auto' | 'transparent' | 'opaque';
export type Style = 'minimalist' | 'cartoon' | 'realistic' | 'abstract' | 'flat' | 'isometric';
export type ColorMode = 'monochrome' | '2-colors' | '3-colors' | 'full-color';
export type ImageComplexity = 'simple' | 'detailed';
export type Category = 'icon' | 'illustration' | 'pattern' | 'logo' | 'scene';
export type Composition = 'center-object' | 'full-scene';
export type StrokeWeight = 'thin' | 'medium' | 'thick';
export type CornerStyle = 'none' | 'rounded' | 'sharp';
export type ShadowEffect = 'none' | 'soft' | 'hard';

/**
 * Advanced style parameters
 */
export interface AdvancedStyleParams {
  stroke_weight?: StrokeWeight;
  corner_style?: CornerStyle;
  shadow_effect?: ShadowEffect;
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

  /** Optional: Content category */
  category?: Category;

  /** Optional: Layout composition */
  composition?: Composition;

  /** Optional: Advanced styling parameters */
  advanced?: AdvancedStyleParams;
}

/**
 * Generate SVG request parameters
 */
export interface GenerateParams {
  /** Required: Description of the SVG to generate */
  prompt: string;

  /** Optional: Generation quality: "low", "medium", "high" */
  quality?: Quality;

  /** Optional: Aspect ratio: "auto", "portrait", "landscape", "square", "wide", "tall" */
  aspectRatio?: AspectRatio;

  /** Optional: Background type: "auto", "transparent", "opaque" */
  background?: Background;

  /** Optional: Enable streaming response for real-time updates */
  stream?: boolean;

  /** Optional: Include base64-encoded PNG preview in response (default: false) */
  base64Png?: boolean;

  /** Optional: Include SVG source code as text in response (default: false) */
  svgText?: boolean;

  /** Optional: Style parameters object containing style, color_mode, image_complexity, category, composition, and advanced options */
  styleParams?: StyleParams;
}

/**
 * Edit SVG/Image request parameters
 */
export interface EditParams {
  /** Required: Image file to edit */
  image: string | Buffer | Readable;

  /** Required: Edit instructions as a simple text string */
  prompt: string;

  /** Optional: Style parameters as JSON object */
  styleParams?: StyleParams;

  /** Optional: Mask file for targeted editing */
  mask?: string | Buffer | Readable;

  /** Optional: Quality level: "low", "medium", "high" (default: "medium") */
  quality?: Quality;

  /** Optional: Aspect ratio: "auto", "portrait", "landscape", "square", "wide", "tall" (default: "auto") */
  aspectRatio?: AspectRatio;

  /** Optional: Background: "auto", "transparent", "opaque" (default: "auto") */
  background?: Background;

  /** Optional: Enable streaming response (default: false) */
  stream?: boolean;

  /** Optional: Include base64-encoded PNG preview in response (default: false) */
  base64Png?: boolean;

  /** Optional: Include SVG source code as text in response (default: false) */
  svgText?: boolean;
}

/**
 * Convert Image to SVG request parameters
 */
export interface ConvertParams {
  /** Required: File to convert to SVG */
  file: string | Buffer | Readable;

  /** Optional: Enable streaming response (default: false) */
  stream?: boolean;

  /** Optional: Include SVG source code as text in response (default: false) */
  svgText?: boolean;
}

/**
 * Base SVGMaker API response
 */
export interface BaseResponse {
  /** URL to the generated/edited/converted SVG */
  svgUrl: string;

  /** Number of credits consumed by the operation */
  creditCost: number;
}

/**
 * Generate SVG response
 */
export interface GenerateResponse extends BaseResponse {
  /** PNG image data as Buffer (decoded from server response) - only when base64Png=true */
  pngImageData?: Buffer;

  /** SVG source code as text - only when svgText=true */
  svgText?: string;

  /** The prompt used for generation */
  prompt: string;

  /** The quality level used */
  quality: Quality;

  /** The revised prompt used by the AI */
  revisedPrompt: string;
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
 * Convert Image to SVG response
 */
export interface ConvertResponse extends BaseResponse {
  /** SVG source code as text - only when svgText=true */
  svgText?: string;
}

/**
 * Stream event base type
 */
export interface StreamEventBase {
  /** Status of the streaming response */
  status: 'processing' | 'complete' | 'error';
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
  status: 'processing';
  /** Progress message */
  message: string;
}

/**
 * Complete stream event
 */
export interface CompleteStreamEvent extends StreamEventBase {
  status: 'complete';
  /** URL to the generated/edited/converted SVG */
  svgUrl: string;
  /** Simulation mode flag */
  simulationMode: boolean;
  /** SVG source code as text - only when svgText=true */
  svgText?: string;
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
