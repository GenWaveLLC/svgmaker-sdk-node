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

  // Use isSvgContent to check if it's already plain SVG text
  if (isSvgContent(svgContent)) {
    return svgContent;
  }

  // Attempt to decode from base64
  try {
    const decoded = Buffer.from(svgContent, 'base64').toString('utf-8');

    // Validate that decoded content looks like SVG
    if (isSvgContent(decoded)) {
      return decoded;
    }

    // If decoded content doesn't look like SVG, return original
    return svgContent;
  } catch {
    console.error('Failed to decode SVG content from base64:', svgContent);
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

// Utility function to check if a string is SVG content
export function isSvgContent(content: string): boolean {
  if (!content || typeof content !== 'string') return false;
  const lower = content.toLowerCase();
  const svgOpenTag = lower.indexOf('<svg ');
  const svgCloseTag = lower.indexOf('</svg>', svgOpenTag + 1);
  return svgOpenTag !== -1 && svgCloseTag !== -1 && svgCloseTag > svgOpenTag;
}
