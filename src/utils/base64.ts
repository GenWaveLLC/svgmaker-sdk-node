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
 * Detects if SVG content is base64 encoded and decodes it appropriately
 * @param svgContent The SVG content (either base64 or plain text)
 * @returns Decoded SVG text
 */
export function decodeSvgContent(svgContent: string): string {
  if (!svgContent || typeof svgContent !== 'string') {
    return svgContent;
  }

  // Check if it's already plain SVG text
  const trimmed = svgContent.trim();
  if (trimmed.startsWith('<svg') || trimmed.startsWith('<?xml')) {
    return svgContent;
  }

  // Check if it looks like base64
  const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
  if (!base64Regex.test(svgContent.replace(/\s/g, ''))) {
    return svgContent; // Not base64, return as-is
  }

  // Attempt to decode from base64
  try {
    const decoded = Buffer.from(svgContent, 'base64').toString('utf-8');

    // Validate that decoded content looks like SVG
    const decodedTrimmed = decoded.trim();
    if (decodedTrimmed.startsWith('<svg') || decodedTrimmed.startsWith('<?xml')) {
      return decoded;
    }

    // If decoded content doesn't look like SVG, return original
    return svgContent;
  } catch {
    // If decoding fails, return original
    return svgContent;
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
