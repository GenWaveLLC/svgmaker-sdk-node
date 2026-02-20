# SVGMaker Node.js SDK Documentation

Official Node.js SDK for the [SVGMaker](https://svgmaker.io) API, providing a clean, type-safe interface for generating, editing, converting, and managing SVG graphics using AI.

> **Access Notice:** The SVGMaker Node.js SDK is available only for paid users. You must have an active paid SVGMaker account to use the SDK and obtain an API key.

[![npm version](https://img.shields.io/npm/v/@genwave/svgmaker-sdk.svg)](https://www.npmjs.com/package/@genwave/svgmaker-sdk)
[![License](https://img.shields.io/npm/l/@genwave/svgmaker-sdk.svg)](https://github.com/GenWaveLLC/svgmaker-sdk-node/blob/main/LICENSE)

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Core Concepts](#core-concepts)
- [API Reference](#api-reference)
  - [Client Initialization](#client-initialization)
  - [Generate SVG](#generate-svg)
  - [Edit SVG/Image](#edit-svgimage)
  - [Convert Namespace](#convert-namespace)
    - [AI Vectorize](#ai-vectorize)
    - [Trace](#trace)
    - [SVG to Vector](#svg-to-vector)
    - [Raster to Raster](#raster-to-raster)
    - [Batch Convert](#batch-convert)
  - [Enhance Prompt](#enhance-prompt)
  - [Optimize SVG](#optimize-svg)
  - [Generations](#generations)
  - [Gallery](#gallery)
  - [Account](#account)
- [Advanced Features](#advanced-features)
- [Error Handling](#error-handling)
- [TypeScript Support](#typescript-support)
- [Best Practices](#best-practices)
- [Examples](#examples)
- [Troubleshooting](#troubleshooting)
- [Support](#support)

## Features

- **Complete API Coverage**: Generate, edit, convert, optimize, and manage SVGs with AI
- **TypeScript Native**: Full type safety with comprehensive type definitions
- **Configuration-Based**: Clean, object-based parameter configuration
- **Automatic Retries**: Built-in retry logic with exponential backoff
- **Streaming Support**: Real-time progress updates via Server-Sent Events
- **Input Validation**: Zod-based schema validation for all requests
- **Dual Package**: ESM and CommonJS support with proper exports
- **Extensible**: Request/response interceptors for customization

## Installation

```bash
npm install @genwave/svgmaker-sdk
```

### Requirements

- Node.js 18.0.0 or higher
- Valid SVGMaker API key

## Quick Start

```typescript
import { SVGMakerClient } from '@genwave/svgmaker-sdk';

// Initialize client
const client = new SVGMakerClient('your-api-key');

// Generate an SVG
const result = await client.generate
  .configure({
    prompt: 'A minimalist mountain landscape',
    quality: 'high',
    styleParams: {
      style: 'flat',
      color_mode: 'monochrome',
    },
    svgText: true, // Get SVG source code
  })
  .execute();

console.log('SVG URL:', result.svgUrl);
console.log('Generation ID:', result.generationId);
console.log('Credits used:', result.creditCost);
```

## Core Concepts

### Client Architecture

The SDK is built around a main `SVGMakerClient` class that provides access to specialized clients:

- **`generate`**: Create SVGs from text descriptions (configure/execute/stream)
- **`edit`**: Modify existing images or SVGs with AI (configure/execute/stream)
- **`convert.aiVectorize`**: AI-powered raster-to-SVG vectorization (configure/execute/stream)
- **`convert.trace`**: Trace raster images to SVG using VTracer (configure/execute)
- **`convert.svgToVector`**: Convert SVG to vector formats such as PDF, EPS, DXF, AI, PS (configure/execute)
- **`convert.rasterToRaster`**: Convert between raster image formats (configure/execute)
- **`convert.batch`**: Batch convert multiple files at once (configure/execute)
- **`enhancePrompt`**: Improve text prompts using AI (configure/execute)
- **`optimizeSvg`**: Optimize and compress SVG files (configure/execute)
- **`generations`**: Manage your generation history (list, get, delete, share, download)
- **`gallery`**: Browse and download public gallery items (list, get, download)
- **`account`**: Retrieve account info and usage statistics (getInfo, getUsage)

### Configuration System

The SDK uses a flexible configuration system that supports:

- **Client-level configuration**: Timeout, retries, logging, etc.
- **Request-level configuration**: Parameters specific to each operation
- **Runtime updates**: Change configuration during execution

### Type Safety

Built with TypeScript from the ground up, providing:

- **Complete type definitions** for all parameters and responses
- **IntelliSense support** in modern IDEs
- **Compile-time validation** of API usage

## API Reference

### Client Initialization

```typescript
// Basic client
const client = new SVGMakerClient('your-api-key');

// Client with custom configuration
const client = new SVGMakerClient('your-api-key', {
  timeout: 60000,
  maxRetries: 5,
  logging: true,
});
```

### Generate SVG

Create SVGs from text descriptions using AI.

```typescript
const result = await client.generate
  .configure({
    prompt: 'A geometric mountain landscape with sun',
    quality: 'high',
    aspectRatio: 'landscape',
    styleParams: {
      style: 'flat',
      color_mode: 'monochrome',
      image_complexity: 'illustration',
      composition: 'centered_object',
    },
    base64Png: true, // Include PNG preview
    svgText: true,   // Include SVG source
  })
  .execute();

console.log('SVG URL:', result.svgUrl);
console.log('Generation ID:', result.generationId);
console.log('Credits used:', result.creditCost);

if (result.pngImageData) {
  // PNG preview as Buffer
  console.log('PNG size:', result.pngImageData.length, 'bytes');
}

if (result.svgText) {
  console.log('SVG content:', result.svgText);
}
```

#### Generation Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `prompt` | `string` | - | **Required.** Description of the SVG to generate |
| `quality` | `'low' \| 'medium' \| 'high'` | `'medium'` | Generation quality level. Mutually exclusive with `model` |
| `model` | `string` | - | Specific model to use. Mutually exclusive with `quality` |
| `aspectRatio` | `'auto' \| 'portrait' \| 'landscape' \| 'square'` | `'auto'` | Output aspect ratio |
| `background` | `'auto' \| 'transparent' \| 'opaque'` | `'auto'` | Background type |
| `styleParams` | `StyleParams` | `{}` | Style parameters object |
| `base64Png` | `boolean` | `false` | Include PNG preview in response |
| `svgText` | `boolean` | `false` | Include SVG source code in response |

#### Generation Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `svgUrl` | `string` | URL of the generated SVG |
| `creditCost` | `number` | Credits consumed by the request |
| `quality` | `string` | Quality level used |
| `message` | `string` | API response message |
| `svgUrlExpiresIn` | `number` | Seconds until the SVG URL expires |
| `generationId` | `string` | Unique ID for the generation |
| `pngImageData` | `Buffer \| undefined` | Decoded PNG preview (when `base64Png` is true) |
| `svgText` | `string \| undefined` | SVG source code (when `svgText` is true) |
| `revisedPrompt` | `string \| undefined` | Prompt as revised by the model |
| `metadata` | `object` | Additional API metadata |

#### Style Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `style` | `'flat' \| 'line_art' \| 'engraving' \| 'linocut' \| 'silhouette' \| 'isometric' \| 'cartoon' \| 'ghibli'` | Art style preference |
| `color_mode` | `'full_color' \| 'monochrome' \| 'few_colors'` | Color scheme preference |
| `image_complexity` | `'icon' \| 'illustration' \| 'scene'` | Complexity level |
| `text` | `'only_title' \| 'embedded_text'` | Text inclusion option |
| `composition` | `'centered_object' \| 'repeating_pattern' \| 'full_scene' \| 'objects_in_grid'` | Layout composition |

### Edit SVG/Image

Modify existing images or SVGs using AI-powered editing.

```typescript
import fs from 'fs';

// Edit using a file path
const result = await client.edit
  .configure({
    image: './input.png',
    prompt: 'Add a red border and make it more vibrant',
    quality: 'medium',
    base64Png: true,
    svgText: true,
  })
  .execute();

// Edit using a Buffer with style parameters
const result2 = await client.edit
  .configure({
    image: fs.readFileSync('./input.svg'),
    prompt: 'Make this more cartoonish',
    styleParams: {
      style: 'cartoon',
      color_mode: 'few_colors',
    },
  })
  .execute();
```

#### Edit Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `image` | `string \| Buffer \| Readable` | - | **Required.** Image file path, Buffer, or stream |
| `prompt` | `string` | - | **Required.** Edit instructions |
| `quality` | `'low' \| 'medium' \| 'high'` | `'medium'` | Processing quality. Mutually exclusive with `model` |
| `model` | `string` | - | Specific model to use. Mutually exclusive with `quality` |
| `styleParams` | `StyleParams` | `{}` | Style parameters object |
| `mask` | `string \| Buffer \| Readable` | - | Optional mask image for inpainting |
| `aspectRatio` | `'auto' \| 'portrait' \| 'landscape' \| 'square'` | `'auto'` | Output aspect ratio |
| `background` | `'auto' \| 'transparent' \| 'opaque'` | `'auto'` | Background handling |
| `base64Png` | `boolean` | `false` | Include PNG preview in response |
| `svgText` | `boolean` | `false` | Include SVG source code in response |

The response shape is identical to the [Generation Response Fields](#generation-response-fields) table above.

### Convert Namespace

The `convert` namespace groups all image conversion operations. Each sub-client follows the `configure().execute()` pattern.

#### AI Vectorize

Convert raster images to SVG using AI-powered vectorization. Supports streaming.

```typescript
const result = await client.convert.aiVectorize
  .configure({
    file: './photo.jpg',
    svgText: true,
  })
  .execute();

console.log('SVG URL:', result.svgUrl);
console.log('SVG source:', result.svgText);
console.log('Generation ID:', result.generationId);
```

**Streaming AI Vectorize:**

```typescript
const stream = client.convert.aiVectorize
  .configure({ file: './photo.jpg' })
  .stream();

for await (const event of stream) {
  if (event.status === 'complete') {
    console.log('SVG URL:', event.svgUrl);
  }
}
```

**AI Vectorize Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `file` | `string \| Buffer \| Readable` | - | **Required.** Image file to vectorize |
| `storage` | `boolean` | - | Whether to store the result |
| `svgText` | `boolean` | `false` | Include SVG source code in response |

**AI Vectorize Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `svgUrl` | `string` | URL of the generated SVG |
| `creditCost` | `number` | Credits consumed |
| `message` | `string` | API response message |
| `svgUrlExpiresIn` | `number` | Seconds until URL expires |
| `generationId` | `string` | Unique ID for the generation |
| `svgText` | `string \| undefined` | SVG source code (when requested) |
| `metadata` | `object` | Additional API metadata |

#### Trace

Trace raster images to SVG using VTracer with fine-grained control over the tracing algorithm.

```typescript
const result = await client.convert.trace
  .configure({
    file: './logo.png',
    preset: 'bw',
    mode: 'spline',
    detail: 80,
    smoothness: 60,
  })
  .execute();

for (const file of result.results) {
  if (file.success) {
    console.log(`${file.filename}: ${file.url}`);
  } else {
    console.error(`${file.filename} failed: ${file.error}`);
  }
}
console.log(`Converted ${result.summary.successful} of ${result.summary.total} files`);
```

**Trace Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `file` | `string \| Buffer \| Readable` | - | **Required.** Image file to trace |
| `preset` | `'bw' \| 'poster' \| 'photo'` | - | Tracing preset |
| `mode` | `'pixel' \| 'polygon' \| 'spline'` | - | Path generation mode |
| `hierarchical` | `'stacked' \| 'cutout'` | - | Layer hierarchy mode |
| `detail` | `number` (0–100) | - | Level of detail |
| `smoothness` | `number` (0–100) | - | Path smoothness |
| `corners` | `number` (0–100) | - | Corner detection sensitivity |
| `reduceNoise` | `number` | - | Noise reduction level |

**Trace / Conversion Response Fields (shared by Trace, SvgToVector, RasterToRaster, and Batch):**

| Field | Type | Description |
|-------|------|-------------|
| `results` | `array` | Per-file results |
| `results[].filename` | `string` | Original filename |
| `results[].success` | `boolean` | Whether conversion succeeded |
| `results[].url` | `string \| undefined` | Download URL (on success) |
| `results[].urlExpiresIn` | `number \| undefined` | Seconds until URL expires |
| `results[].format` | `string \| undefined` | Output format |
| `results[].error` | `string \| undefined` | Error message (on failure) |
| `summary.total` | `number` | Total files processed |
| `summary.successful` | `number` | Number of successful conversions |
| `summary.failed` | `number` | Number of failed conversions |
| `metadata` | `object` | Additional API metadata |

#### SVG to Vector

Convert SVG files to other vector formats such as PDF, EPS, DXF, AI, or PS.

```typescript
const result = await client.convert.svgToVector
  .configure({
    file: './diagram.svg',
    toFormat: 'PDF',
    textToPath: true,
  })
  .execute();

console.log('Download URL:', result.results[0].url);
```

**SVG to Vector Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `file` | `string \| Buffer \| Readable` | - | **Required.** SVG file to convert |
| `toFormat` | `'PDF' \| 'EPS' \| 'DXF' \| 'AI' \| 'PS'` | - | **Required.** Target vector format |
| `textToPath` | `boolean` | - | Convert text elements to paths |
| `dxfVersion` | `'R12' \| 'R14'` | - | DXF format version (DXF output only) |

#### Raster to Raster

Convert between raster image formats with optional resizing and quality control.

```typescript
const result = await client.convert.rasterToRaster
  .configure({
    file: './image.png',
    toFormat: 'WEBP',
    quality: 85,
    width: 1920,
  })
  .execute();

console.log('Download URL:', result.results[0].url);
```

**Raster to Raster Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `file` | `string \| Buffer \| Readable` | - | **Required.** Image file to convert |
| `toFormat` | `'PNG' \| 'JPG' \| 'WEBP' \| 'TIFF' \| 'GIF' \| 'AVIF'` | - | **Required.** Target raster format |
| `quality` | `number` (1–100) | - | Output quality |
| `width` | `number` | - | Output width in pixels |
| `height` | `number` | - | Output height in pixels |

#### Batch Convert

Convert multiple files (up to 10) in a single request. Accepts any combination of options from the individual convert clients.

```typescript
const result = await client.convert.batch
  .configure({
    files: ['./a.png', './b.png', './c.png'],
    toFormat: 'WEBP',
    quality: 80,
  })
  .execute();

for (const file of result.results) {
  console.log(`${file.filename}: ${file.success ? file.url : file.error}`);
}
```

**Batch Convert Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `files` | `string[]` (1–10) | - | **Required.** Array of file paths to convert |
| `toFormat` | `string` | - | **Required.** Target output format |
| ...other | - | - | All options from Trace, SvgToVector, and RasterToRaster are also accepted |

### Enhance Prompt

Use AI to improve and expand text prompts before using them for generation.

```typescript
const result = await client.enhancePrompt
  .configure({
    prompt: 'a cat',
  })
  .execute();

console.log('Enhanced prompt:', result.enhancedPrompt);

// Use the enhanced prompt with generate
const svg = await client.generate
  .configure({
    prompt: result.enhancedPrompt,
    quality: 'high',
  })
  .execute();
```

**Enhance Prompt Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `prompt` | `string` | **Required.** The prompt to enhance |

**Enhance Prompt Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `enhancedPrompt` | `string` | The improved prompt |
| `metadata` | `object` | Additional API metadata |

### Optimize SVG

Optimize and optionally compress SVG files using SVGO.

```typescript
const result = await client.optimizeSvg
  .configure({
    file: './unoptimized.svg',
    compress: true, // Also produce a .svgz file
  })
  .execute();

console.log('Optimized SVG URL:', result.svgUrl);
console.log('Compressed SVG URL:', result.svgzUrl);
console.log('Compressed size:', result.compressedSize, 'bytes');
```

**Optimize SVG Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `file` | `string \| Buffer \| Readable` | - | **Required.** SVG file to optimize |
| `compress` | `boolean` | `false` | Also produce a gzip-compressed `.svgz` file |

**Optimize SVG Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `svgUrl` | `string` | URL of the optimized SVG |
| `svgUrlExpiresIn` | `number` | Seconds until SVG URL expires |
| `svgzUrl` | `string \| undefined` | URL of the compressed `.svgz` file (when `compress` is true) |
| `svgzUrlExpiresIn` | `number \| undefined` | Seconds until svgz URL expires |
| `filename` | `string` | Output filename |
| `compressedSize` | `number` | File size after optimization in bytes |
| `metadata` | `object` | Additional API metadata |

### Generations

Manage your personal generation history. This client uses direct method calls rather than the `configure().execute()` pattern.

```typescript
// List recent generations
const { items, pagination } = await client.generations.list({
  page: 1,
  limit: 20,
  type: 'generate',
});

for (const item of items) {
  console.log(item.id, item.prompt);
}

// Get a specific generation
const generation = await client.generations.get('generation-id');
console.log('Prompt:', generation.prompt);
console.log('Public:', generation.isPublic);

// Share a generation
const shared = await client.generations.share('generation-id');
console.log('Share URL:', shared.shareUrl);

// Download a generation in a specific format
const download = await client.generations.download('generation-id', {
  format: 'png',
  optimize: true,
});
console.log('Download URL:', download.url);

// Delete a generation (paid users only)
await client.generations.delete('generation-id');
```

**generations.list() Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | `number` | Page number |
| `limit` | `number` | Items per page |
| `type` | `string` | Filter by generation type |
| `hashtags` | `string[]` | Filter by hashtags |
| `categories` | `string[]` | Filter by categories |
| `query` | `string` | Search query |

**generations.download() Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `format` | `'svg' \| 'webp' \| 'png' \| 'svg-optimized' \| 'svgz'` | Output format |
| `optimize` | `boolean` | Optimize SVG output |

### Gallery

Browse and download items from the public gallery. Uses the same direct method pattern as the Generations client.

```typescript
// List gallery items
const { items } = await client.gallery.list({
  page: 1,
  limit: 20,
  query: 'mountain',
});

// Get a specific gallery item
const item = await client.gallery.get('item-id');
console.log('Prompt:', item.prompt);

// Download a gallery item
const download = await client.gallery.download('item-id', {
  format: 'svg',
});
console.log('Download URL:', download.url);
```

The `gallery.list()` method accepts the same parameters as `generations.list()` with additional `pro` and `gold` boolean filters for filtering by creator tier.

### Account

Retrieve account information and API usage statistics.

```typescript
// Get account information
const info = await client.account.getInfo();
console.log('Email:', info.email);
console.log('Account type:', info.accountType);
console.log('Credits remaining:', info.credits);

// Get usage statistics for the last 7 days
const usage = await client.account.getUsage({ days: 7 });
console.log('Period:', usage.period);
console.log('Total requests:', usage.summary.requests);
console.log('Credits used:', usage.summary.creditsUsed);
console.log('Success rate:', usage.summary.successRate);

// Get usage statistics for a specific date range
const rangeUsage = await client.account.getUsage({
  start: '2025-01-01',
  end: '2025-01-31',
});
```

**account.getInfo() Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `email` | `string` | Account email address |
| `displayName` | `string` | Display name |
| `accountType` | `string` | Account tier |
| `credits` | `number` | Remaining credits |
| `metadata` | `object` | Additional API metadata |

**account.getUsage() Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `days` | `number` | Number of recent days to include. Mutually exclusive with `start`/`end` |
| `start` | `string` | Start date (ISO format). Use with `end` |
| `end` | `string` | End date (ISO format). Use with `start` |

**account.getUsage() Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `period` | `object` | Period covered by the report |
| `summary.requests` | `number` | Total API requests |
| `summary.creditsUsed` | `number` | Total credits consumed |
| `summary.successCount` | `number` | Successful requests |
| `summary.errorCount` | `number` | Failed requests |
| `summary.successRate` | `number` | Success rate (0–1) |
| `byCategory` | `object` | Usage broken down by endpoint category |
| `daily` | `array` | Day-by-day usage data |
| `allTime` | `object` | All-time usage totals |
| `metadata` | `object` | Additional API metadata |

## Advanced Features

### Streaming Responses

`generate`, `edit`, and `convert.aiVectorize` support real-time progress updates via streaming.

```typescript
const stream = client.generate
  .configure({
    prompt: 'A detailed cityscape illustration',
    quality: 'high',
  })
  .stream();

for await (const event of stream) {
  switch (event.status) {
    case 'processing':
      console.log(`Progress: ${event.message}`);
      break;
    case 'complete':
      console.log(`Complete! SVG: ${event.svgUrl}`);
      break;
    case 'error':
      console.error(`Error: ${event.error}`);
      break;
  }
}
```

### Configuration Management

```typescript
// Update configuration at runtime
client.setConfig({
  timeout: 120000,
  maxRetries: 2,
});

// Get current configuration
const config = client.getConfig();
console.log('Current timeout:', config.timeout);
```

### Request/Response Interceptors

Customize requests and responses with interceptors.

```typescript
// Add request interceptor
client.addRequestInterceptor(async (request) => {
  console.log('Making request:', request.url);
  return request;
});

// Add response interceptor
client.addResponseInterceptor(async (response) => {
  console.log('Received response:', response);
  return response;
});
```

### Logging

The SDK includes built-in logging functionality.

```typescript
// Enable logging
const client = new SVGMakerClient('your-api-key', {
  logging: true,
  logLevel: 'debug', // 'debug' | 'info' | 'warn' | 'error'
});

// Change log level during runtime
client.setConfig({
  logging: true,
  logLevel: 'warn',
});
```

## Error Handling

The SDK provides comprehensive error handling with custom error types.

```typescript
import { SVGMakerClient, Errors } from '@genwave/svgmaker-sdk';

try {
  const result = await client.generate
    .configure({ prompt: 'A landscape' })
    .execute();
} catch (error) {
  if (error instanceof Errors.ValidationError) {
    console.error('Invalid parameters:', error.message);
  } else if (error instanceof Errors.APIError) {
    console.error('API error:', error.message, error.statusCode);
  } else if (error instanceof Errors.RateLimitError) {
    console.error('Rate limited. Retry after:', error.retryAfter, 'seconds');
  } else if (error instanceof Errors.AuthError) {
    console.error('Authentication failed:', error.message);
  } else if (error instanceof Errors.TimeoutError) {
    console.error('Request timed out after:', error.timeout, 'ms');
  } else if (error instanceof Errors.NetworkError) {
    console.error('Network error:', error.message);
  } else if (error instanceof Errors.InsufficientCreditsError) {
    console.error('Insufficient credits. Required:', error.creditsRequired);
  } else if (error instanceof Errors.ContentSafetyError) {
    console.error('Content safety violation:', error.message);
  } else if (error instanceof Errors.FileSizeError) {
    console.error('File too large:', error.message);
  } else if (error instanceof Errors.FileFormatError) {
    console.error('Unsupported file format:', error.message);
  }
}
```

### Error Types

| Error Type | Description | Properties |
|------------|-------------|------------|
| `ValidationError` | Invalid parameters or configuration | `message` |
| `APIError` | Server-side API errors | `message`, `statusCode`, `code`, `details` |
| `RateLimitError` | Rate limit exceeded | `message`, `retryAfter` |
| `AuthError` | Authentication failures | `message` |
| `TimeoutError` | Request timeout | `message`, `timeout` |
| `NetworkError` | Network connectivity issues | `message`, `originalError` |
| `InsufficientCreditsError` | Insufficient account credits | `message`, `creditsRequired` |
| `ContentSafetyError` | Content safety violations | `message` |
| `FileSizeError` | File size exceeds limits | `message` |
| `FileFormatError` | Unsupported file format | `message` |

## TypeScript Support

Full TypeScript support with comprehensive type definitions.

```typescript
import { SVGMakerClient, Types } from '@genwave/svgmaker-sdk';

// Typed parameters
const generateParams: Types.GenerateParams = {
  prompt: 'A minimalist logo',
  quality: 'high',
  styleParams: {
    style: 'flat',
    color_mode: 'monochrome',
  },
};

// Typed responses
const result: Types.GenerateResponse = await client.generate
  .configure(generateParams)
  .execute();

// Type-safe access
console.log(result.svgUrl);       // string
console.log(result.generationId); // string
console.log(result.creditCost);   // number
console.log(result.pngImageData); // Buffer | undefined
```

### Available Types

**Parameters:**
- `GenerateParams`, `EditParams`
- `AIVectorizeParams`, `TraceParams`, `SvgToVectorParams`, `RasterToRasterParams`, `BatchConvertParams`
- `EnhancePromptParams`, `OptimizeSvgParams`
- `StyleParams`

**Responses:**
- `GenerateResponse`, `EditResponse`
- `AIVectorizeResponse`, `ConvertResponse` (shared by Trace, SvgToVector, RasterToRaster, Batch)
- `EnhancePromptResponse`, `OptimizeSvgResponse`
- `GenerationItem`, `GenerationDownloadResponse`
- `GalleryItem`, `GalleryDownloadResponse`
- `AccountInfo`, `AccountUsage`

**Style and Enum Types:**
- `Quality`, `AspectRatio`, `Background`
- `Style`, `ColorMode`, `ImageComplexity`, `TextOption`, `Composition`

**Stream Types:**
- `StreamEvent`, `GenerateStreamEvent`, `EditStreamEvent`, `AIVectorizeStreamEvent`

**Exports:**
- `SVGMakerClient`, `GenerateClient`, `EditClient`, `AIVectorizeClient`
- `TraceClient`, `SvgToVectorClient`, `RasterToRasterClient`, `BatchConvertClient`
- `EnhancePromptClient`, `OptimizeSvgClient`
- `GenerationsClient`, `GalleryClient`, `AccountClient`
- `HttpClient`, `Types`, `SVGMakerConfig`, `Errors`
- `ConvertClient` (retained for backward compatibility)

## Best Practices

### Performance Optimization

1. **Reuse Client Instances**: Create one client instance and reuse it across your application
2. **Use Appropriate Quality Levels**: Choose quality based on your needs to avoid unnecessary credit spend
3. **Enable Streaming for Long Operations**: Use streaming for better UX on high-quality generations
4. **Handle Errors Gracefully**: Implement proper error handling for all API calls

```typescript
// Good: Reuse client instance
const client = new SVGMakerClient(process.env.SVGMAKER_API_KEY);

// Bad: Creating new client for each request
const result = await new SVGMakerClient('your-api-key').generate...
```

### Using model vs. quality

The `generate` and `edit` clients accept either `quality` or `model`, but not both. Use `quality` for a simple high/medium/low selection, or `model` to target a specific model version directly.

```typescript
// Using quality (recommended for most cases)
await client.generate.configure({ prompt: '...', quality: 'high' }).execute();

// Using model (for specific model targeting)
await client.generate.configure({ prompt: '...', model: 'specific-model-id' }).execute();
```

### Error Handling

1. **Catch Specific Errors**: Handle different error types appropriately
2. **Implement Retry Logic**: Use built-in retry mechanisms or handle `RateLimitError` manually
3. **Log Errors**: Enable logging for debugging

```typescript
try {
  const result = await client.generate.configure(params).execute();
} catch (error) {
  if (error instanceof Errors.RateLimitError) {
    // Wait and retry
    await new Promise(resolve => setTimeout(resolve, error.retryAfter * 1000));
    return await client.generate.configure(params).execute();
  }
  throw error;
}
```

### Security

1. **Protect API Keys**: Never expose API keys in client-side code or version control
2. **Use Environment Variables**: Store API keys securely
3. **Validate Input**: Always validate user input before sending to the API

```typescript
// Good: Use environment variables
const client = new SVGMakerClient(process.env.SVGMAKER_API_KEY);

// Bad: Hardcode API key
const client = new SVGMakerClient('hardcoded-api-key');
```

## Examples

### Generate an SVG with Full Style Control

```typescript
import { SVGMakerClient } from '@genwave/svgmaker-sdk';

const client = new SVGMakerClient(process.env.SVGMAKER_API_KEY);

const result = await client.generate
  .configure({
    prompt: 'A modern app icon for a fitness tracker',
    quality: 'high',
    aspectRatio: 'square',
    styleParams: {
      style: 'flat',
      color_mode: 'few_colors',
      image_complexity: 'icon',
      composition: 'centered_object',
    },
    base64Png: true,
    svgText: true,
  })
  .execute();

console.log('SVG URL:', result.svgUrl);
console.log('Revised prompt:', result.revisedPrompt);
```

### Enhance a Prompt then Generate

```typescript
const enhanced = await client.enhancePrompt
  .configure({ prompt: 'a mountain' })
  .execute();

const result = await client.generate
  .configure({
    prompt: enhanced.enhancedPrompt,
    quality: 'high',
    svgText: true,
  })
  .execute();

console.log('Generated from enhanced prompt:', result.svgUrl);
```

### Edit an Image with Streaming Progress

```typescript
import fs from 'fs';

const stream = client.edit
  .configure({
    image: fs.createReadStream('./input.png'),
    prompt: 'Add a blue background and make it more vibrant',
    quality: 'medium',
    styleParams: {
      style: 'flat',
      color_mode: 'full_color',
    },
    base64Png: true,
  })
  .stream();

for await (const event of stream) {
  switch (event.status) {
    case 'processing':
      console.log(`Progress: ${event.message}`);
      break;
    case 'complete':
      console.log('Edited SVG:', event.svgUrl);
      break;
    case 'error':
      console.error('Edit failed:', event.error);
      break;
  }
}
```

### Convert Multiple Files with Batch

```typescript
const result = await client.convert.batch
  .configure({
    files: ['./a.png', './b.png', './c.png'],
    toFormat: 'WEBP',
    quality: 80,
    width: 1280,
  })
  .execute();

console.log(`Batch complete: ${result.summary.successful}/${result.summary.total} succeeded`);
for (const file of result.results) {
  if (file.success) {
    console.log(`  ${file.filename} -> ${file.url}`);
  }
}
```

### Manage Generations History

```typescript
// List, filter, and download recent generations
const { items } = await client.generations.list({
  limit: 10,
  type: 'generate',
});

for (const item of items) {
  console.log(`${item.id}: ${item.prompt}`);
}

// Share a generation and get a public link
const shared = await client.generations.share(items[0].id);
console.log('Public URL:', shared.shareUrl);

// Download as optimized PNG
const download = await client.generations.download(items[0].id, {
  format: 'png',
  optimize: true,
});
console.log('PNG download URL:', download.url);
```

### Check Account Usage

```typescript
const info = await client.account.getInfo();
console.log(`Account: ${info.displayName} (${info.accountType})`);
console.log(`Credits remaining: ${info.credits}`);

const usage = await client.account.getUsage({ days: 30 });
console.log(`Last 30 days: ${usage.summary.requests} requests, ${usage.summary.creditsUsed} credits used`);
console.log(`Success rate: ${(usage.summary.successRate * 100).toFixed(1)}%`);
```

### Optimize an SVG File

```typescript
const result = await client.optimizeSvg
  .configure({
    file: './large-diagram.svg',
    compress: true,
  })
  .execute();

console.log('Optimized SVG:', result.svgUrl);
console.log('Compressed (.svgz):', result.svgzUrl);
console.log('Compressed size:', result.compressedSize, 'bytes');
```

## Troubleshooting

### Common Issues

#### Authentication Errors

**Problem**: `AuthError: Invalid API key`

**Solution**:
- Verify your API key is correct
- Check that your account is active and has remaining credits
- Ensure the API key is properly formatted and not truncated

#### Rate Limiting

**Problem**: `RateLimitError: Rate limit exceeded`

**Solution**:
- Implement exponential backoff using the `retryAfter` property
- The SDK has built-in retry logic; increase `maxRetries` in the client config if needed
- Consider upgrading your plan for higher rate limits

#### File Upload Issues

**Problem**: `FileSizeError: File too large`

**Solution**:
- Check file size limits for the specific endpoint
- Compress images before upload
- Use a supported file format for the target operation

#### Network Issues

**Problem**: `NetworkError: Connection timeout`

**Solution**:
- Check internet connectivity
- Increase the `timeout` value in the client configuration
- The SDK will automatically retry failed requests based on the `maxRetries` config

### Debugging

Enable detailed logging for debugging:

```typescript
const client = new SVGMakerClient('your-api-key', {
  logging: true,
  logLevel: 'debug',
});
```

### Performance Issues

1. **Slow Generation**: Use lower quality settings or the `model` parameter to select a faster model
2. **Memory Issues**: When processing many files, use batch operations or process in smaller groups
3. **Network Timeouts**: Increase the `timeout` configuration, especially for high-quality generation requests

## Support

### Resources

- **Repository**: [GitHub Repository](https://github.com/GenWaveLLC/svgmaker-sdk-node)
- **NPM Package**: [@genwave/svgmaker-sdk](https://www.npmjs.com/package/@genwave/svgmaker-sdk)
- **API Documentation**: [API Documentation](v1-api-documentation.md)

### Contributing

We welcome contributions! Please see [`CONTRIBUTING.md`](../CONTRIBUTING.md) for guidelines.

## License

MIT License - see the [`LICENSE`](../LICENSE) file for details.

---

**Version**: v1.0.0
**Node.js**: >=18.0.0
**License**: MIT
**Repository**: [GitHub](https://github.com/GenWaveLLC/svgmaker-sdk-node)
