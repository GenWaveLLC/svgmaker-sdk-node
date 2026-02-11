import { ResponseMetadata } from '../../src/types/api';

// ============================================================================
// Mock Data Factories
// ============================================================================

/**
 * Create mock response metadata
 */
export function createMockMetadata(
  overrides?: Partial<ResponseMetadata>,
): ResponseMetadata {
  return {
    requestId: 'test-req-id',
    creditsUsed: 1,
    creditsRemaining: 99,
    ...overrides,
  };
}

/**
 * Create mock generate response data (v1 envelope data field)
 */
export function createMockGenerateResponse(
  overrides?: Record<string, any>,
): Record<string, any> {
  return {
    svgUrl: 'https://storage.example.com/test.svg',
    creditCost: 1,
    message: 'SVG generated successfully',
    quality: 'medium',
    svgUrlExpiresIn: '24h',
    generationId: 'gen-test-123',
    ...overrides,
  };
}

/**
 * Create mock edit response data (v1 envelope data field)
 */
export function createMockEditResponse(
  overrides?: Record<string, any>,
): Record<string, any> {
  return {
    svgUrl: 'https://storage.example.com/test-edit.svg',
    creditCost: 2,
    message: 'Image edited successfully',
    quality: 'medium',
    svgUrlExpiresIn: '24h',
    generationId: 'edit-test-123',
    ...overrides,
  };
}

/**
 * Create mock stream events for generate/edit streaming
 */
export function createMockStreamEvents(): Record<string, any>[] {
  return [
    { status: 'processing', message: 'Generating SVG...' },
    {
      status: 'generated',
      message: 'SVG generated',
      svgUrl: 'https://storage.example.com/test.svg',
      creditCost: 1,
      svgText:
        '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><circle cx="50" cy="50" r="40"/></svg>',
    },
    {
      status: 'complete',
      message: 'Generation complete',
      generationId: 'gen-stream-001',
      metadata: {
        requestId: 'test-req-id',
        creditsUsed: 1,
        creditsRemaining: 99,
      },
    },
  ];
}

/**
 * Create mock AI vectorize response data (v1 envelope data field)
 */
export function createMockAiVectorizeResponse(
  overrides?: Record<string, any>,
): Record<string, any> {
  return {
    svgUrl: 'https://storage.example.com/vectorized.svg',
    creditCost: 2,
    message: 'Image vectorized successfully',
    svgUrlExpiresIn: '24h',
    generationId: 'vec-test-123',
    ...overrides,
  };
}

/**
 * Create mock convert results response data (v1 envelope data field)
 */
export function createMockConvertResultsResponse(
  overrides?: Record<string, any>,
): Record<string, any> {
  return {
    results: [
      {
        filename: 'test-image.png',
        success: true,
        url: 'https://storage.example.com/converted/test-image.svg',
        urlExpiresIn: '24h',
        format: 'svg',
      },
    ],
    summary: {
      total: 1,
      successful: 1,
      failed: 0,
    },
    ...overrides,
  };
}

/**
 * Create mock AI vectorize stream events
 */
export function createMockAiVectorizeStreamEvents(): Record<string, any>[] {
  return [
    { status: 'processing', message: 'Vectorizing image...' },
    {
      status: 'generated',
      message: 'SVG generated',
      svgUrl: 'https://storage.example.com/vectorized.svg',
      creditCost: 2,
      svgText:
        '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><circle cx="50" cy="50" r="40"/></svg>',
    },
    {
      status: 'complete',
      message: 'Vectorization complete',
      generationId: 'vec-stream-001',
      metadata: {
        requestId: 'test-req-id',
        creditsUsed: 2,
        creditsRemaining: 97,
      },
    },
  ];
}

/**
 * Create mock optimize SVG response data
 */
export function createMockOptimizeSvgResponse(
  overrides?: Record<string, any>,
): Record<string, any> {
  return {
    svgUrl: 'https://storage.example.com/optimized.svg',
    svgUrlExpiresIn: '24h',
    ...overrides,
  };
}

/**
 * Create mock enhance prompt response data
 */
export function createMockEnhancePromptResponse(
  overrides?: Record<string, any>,
): Record<string, any> {
  return {
    enhancedPrompt: 'A beautifully detailed mountain landscape with snow-capped peaks',
    ...overrides,
  };
}

/**
 * Create mock generations list response data (v1 envelope data field)
 */
export function createMockGenerationsListData(
  overrides?: Record<string, any>,
): Record<string, any> {
  return {
    items: ['gen-001', 'gen-002'],
    pagination: {
      page: 1,
      limit: 10,
      totalItems: 2,
      totalPages: 1,
      hasNextPage: false,
      hasPrevPage: false,
    },
    ...overrides,
  };
}

/**
 * Create mock single generation response data (v1 envelope data field)
 */
export function createMockGenerationData(
  overrides?: Record<string, any>,
): Record<string, any> {
  return {
    id: 'gen-001',
    prompt: 'A mountain landscape',
    type: 'generate',
    quality: 'medium',
    isPublic: false,
    metadata: {
      hashTags: ['svg', 'landscape', 'mountain'],
      category: ['flat', 'illustration'],
    },
    ...overrides,
  };
}

/**
 * Create mock generation delete response data (v1 envelope data field)
 */
export function createMockGenerationDeleteData(
  overrides?: Record<string, any>,
): Record<string, any> {
  return {
    message: 'Generation deleted successfully',
    ...overrides,
  };
}

/**
 * Create mock generation share response data (v1 envelope data field)
 */
export function createMockGenerationShareData(
  overrides?: Record<string, any>,
): Record<string, any> {
  return {
    message: 'Generation shared',
    isPublic: true,
    shareUrl: 'https://svgmaker.io/gallery/gen-001',
    ...overrides,
  };
}

/**
 * Create mock generation download response data (v1 envelope data field)
 */
export function createMockGenerationDownloadData(
  overrides?: Record<string, any>,
): Record<string, any> {
  return {
    id: 'gen-001',
    url: 'https://storage.example.com/gen-001.svg',
    urlExpiresIn: '12h',
    format: 'svg',
    filename: 'gen-001.svg',
    ...overrides,
  };
}

/**
 * Create mock account info response data (v1 envelope data field)
 */
export function createMockAccountInfoData(
  overrides?: Record<string, any>,
): Record<string, any> {
  return {
    email: 'user@example.com',
    displayName: 'Test User',
    accountType: 'premium',
    credits: 500,
    ...overrides,
  };
}

/**
 * Create mock account usage response data (v1 envelope data field)
 */
export function createMockAccountUsageData(
  overrides?: Record<string, any>,
): Record<string, any> {
  return {
    period: { type: 'all' },
    summary: {
      requests: 42,
      creditsUsed: 35,
      successCount: 40,
      errorCount: 2,
      successRate: 0.95,
    },
    byCategory: {
      generate: { requests: 30, creditsUsed: 25 },
      edit: { requests: 12, creditsUsed: 10 },
    },
    ...overrides,
  };
}
