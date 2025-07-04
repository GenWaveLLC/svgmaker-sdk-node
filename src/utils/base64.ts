// Utility functions for base64 decoding used in SVGMaker SDK

/**
 * Decode a base64-encoded SVG text to a UTF-8 string
 * @param base64 Base64-encoded SVG
 * @returns Decoded SVG string
 */
export function decodeBase64SvgText(base64: string): string {
  try {
    return Buffer.from(base64, 'base64').toString('utf-8');
  } catch {
    return base64;
  }
}

/**
 * Decode a base64-encoded PNG (optionally with data URL prefix) to a Buffer
 * @param base64 Base64-encoded PNG (may include data URL prefix)
 * @returns Buffer containing PNG image data
 */
export function decodeBase64Png(base64: string): Buffer {
  // Remove data URL prefix if present
  const cleanBase64 = base64.replace(/^data:image\/png;base64,/, '');
  return Buffer.from(cleanBase64, 'base64');
} 