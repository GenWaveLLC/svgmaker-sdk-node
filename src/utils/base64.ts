// Utility functions for SVG content handling in SVGMaker SDK

/**
 * Decode a base64-encoded SVG text to a UTF-8 string
 * @deprecated The API now sends raw SVG text. This function is kept for backward compatibility.
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
 * Normalizes SVG content - handles both raw SVG text (current API) and base64-encoded SVG (legacy).
 * The API now sends raw SVG text in the svgText field, so this function primarily passes through
 * the content unchanged. Base64 decoding is only attempted for backward compatibility with older
 * API versions.
 * @param svgContent The SVG content (raw text or base64-encoded)
 * @returns SVG text
 */
export function decodeSvgContent(svgContent: string): string {
  if (!svgContent || typeof svgContent !== 'string') {
    return svgContent;
  }

  // API now sends raw SVG text - check if it's already plain SVG
  if (isSvgContent(svgContent)) {
    return svgContent;
  }

  // Backward compatibility: attempt to decode from base64 for older API versions
  try {
    const decoded = Buffer.from(svgContent, 'base64').toString('utf-8');

    // Validate that decoded content looks like SVG
    if (isSvgContent(decoded)) {
      return decoded;
    }

    // If decoded content doesn't look like SVG, return original
    return svgContent;
  } catch {
    // If decoding fails, return original (may be malformed SVG)
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
