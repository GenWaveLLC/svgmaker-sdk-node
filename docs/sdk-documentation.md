# SVGMaker Node.js SDK Documentation

Official Node.js SDK for the [SVGMaker](https://svgmaker.io) API, providing a clean, type-safe interface for generating, editing, and converting SVG graphics using AI.
[!IMPORTANT]
**Access Notice:** The SVGMaker Node.js SDK is available only for paid users. You must have an active paid SVGMaker account to use the SDK and obtain an API key.

[![npm version](https://img.shields.io/npm/v/@genwave/svgmaker-sdk.svg)](https://www.npmjs.com/package/@genwave/svgmaker-sdk)
[![License](https://img.shields.io/npm/l/@genwave/svgmaker-sdk.svg)](https://github.com/GenWaveLLC/svgmaker-sdk-node/blob/main/LICENSE)

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Core Concepts](#core-concepts)
- [API Reference](#api-reference)
- [Advanced Features](#advanced-features)
- [Error Handling](#error-handling)
- [TypeScript Support](#typescript-support)
- [Best Practices](#best-practices)
- [Examples](#examples)
- [Troubleshooting](#troubleshooting)
- [Support](#support)

## Features

- 🎨 **Complete API Coverage**: Generate, edit, and convert SVGs with AI
- 🧰 **TypeScript Native**: Full type safety with comprehensive type definitions  
- ⚙️ **Configuration-Based**: Clean, object-based parameter configuration
- 🔄 **Automatic Retries**: Built-in retry logic with exponential backoff
- 🌊 **Streaming Support**: Real-time progress updates via Server-Sent Events
- ✅ **Input Validation**: Zod-based schema validation for all requests
- 📦 **Dual Package**: ESM and CommonJS support with proper exports
- 🔌 **Extensible**: Request/response interceptors for customization

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
      style: 'minimalist',
    },
    svgText: true, // Get SVG source code
  })
  .execute();

console.log('SVG URL:', result.svgUrl);
console.log('Credits used:', result.creditCost);
```

## Core Concepts

### Client Architecture

The SDK is built around a main `SVGMakerClient` class that provides access to three specialized clients:

- **`generate`**: Create SVGs from text descriptions
- **`edit`**: Modify existing images or SVGs
- **`convert`**: Convert raster images to SVG format

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
      style: 'minimalist',
      color_mode: 'monochrome',
      composition: 'center-object',
      advanced: {
        stroke_weight: 'thin',
        corner_style: 'rounded',
        shadow_effect: 'none'
      }
    },
    base64Png: true, // Include PNG preview
    svgText: true,   // Include SVG source
  })
  .execute();

// Access results
console.log('SVG URL:', result.svgUrl);
console.log('Credits used:', result.creditCost);
console.log('Revised prompt:', result.revisedPrompt);

if (result.pngImageData) {
  // PNG preview as Buffer
  console.log('PNG size:', result.pngImageData.length, 'bytes');
}

if (result.svgText) {
  // SVG source code
  console.log('SVG content:', result.svgText);
}
```

#### Generation Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `prompt` | `string` | - | **Required.** Description of the SVG to generate |
| `quality` | `'low' \| 'medium' \| 'high'` | `'medium'` | Generation quality level |
| `aspectRatio` | `'auto' \| 'portrait' \| 'landscape' \| 'square' \| 'wide' \| 'tall'` | `'auto'` for low/medium, `'square'` for high | Output aspect ratio |
| `background` | `'auto' \| 'transparent' \| 'opaque'` | `'auto'` | Background type |
| `styleParams` | `StyleParams` | `{}` | Style parameters object |
| `base64Png` | `boolean` | `false` | Include PNG preview in response |
| `svgText` | `boolean` | `false` | Include SVG source code in response |

#### Style Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `style` | `'minimalist' \| 'cartoon' \| 'realistic' \| 'abstract' \| 'flat' \| 'isometric'` | Art style preference |
| `color_mode` | `'monochrome' \| '2-colors' \| '3-colors' \| 'full-color'` | Color scheme preference |
| `image_complexity` | `'simple' \| 'detailed'` | Complexity level |
| `category` | `'icon' \| 'illustration' \| 'pattern' \| 'logo' \| 'scene'` | Content category |
| `composition` | `'center-object' \| 'full-scene'` | Layout composition |
| `advanced.stroke_weight` | `'thin' \| 'medium' \| 'thick'` | Stroke weight for lines and shapes |
| `advanced.corner_style` | `'none' \| 'rounded' \| 'sharp'` | Corner style for shapes |
| `advanced.shadow_effect` | `'none' \| 'soft' \| 'hard'` | Shadow effect type |

### Edit SVG/Image

Modify existing images or SVGs using AI-powered editing.

```typescript
// Basic editing
const result = await client.edit
  .configure({
    image: './input.png',
    prompt: 'Add a red border and make it more vibrant',
    quality: 'medium',
    base64Png: true,
    svgText: true,
  })
  .execute();

// Advanced editing with style parameters
const result = await client.edit
  .configure({
    image: fs.readFileSync('./input.svg'),
    prompt: 'Make this more cartoonish',
    styleParams: {
      style: 'cartoon',
      color_mode: '3-colors',
      advanced: {
        stroke_weight: 'medium',
        corner_style: 'rounded'
      }
    },
    mask: './mask.png', // Optional mask for targeted editing
  })
  .execute();
```

#### Edit Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `image` | `string \| Buffer \| Readable` | - | **Required.** Image file to edit |
| `prompt` | `string` | - | **Required.** Edit instructions |
| `styleParams` | `StyleParams` | `{}` | Style parameters object |
| `mask` | `string \| Buffer \| Readable` | `none` | Optional mask for targeted editing |
| `quality` | `'low' \| 'medium' \| 'high'` | `'medium'` | Processing quality |
| `aspectRatio` | `'auto' \| 'portrait' \| 'landscape' \| 'square'` | `'auto'` | Output aspect ratio |
| `background` | `'auto' \| 'transparent' \| 'opaque'` | `'auto'` | Background handling |
| `base64Png` | `boolean` | `false` | Include PNG preview in response |
| `svgText` | `boolean` | `false` | Include SVG source code in response |

### Convert Image to SVG

Convert raster images to vector SVG format.

```typescript
const result = await client.convert
  .configure({
    file: './photo.jpg',
    svgText: true,
  })
  .execute();

console.log('SVG:', result.svgUrl);
console.log('SVG source:', result.svgText);
```

#### Convert Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `file` | `string \| Buffer \| Readable` | - | **Required.** File to convert to SVG |
| `svgText` | `boolean` | `false` | Include SVG source code in response |

## Advanced Features

### Streaming Responses

All operations support real-time progress updates via streaming.

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
    style: 'minimalist',
    color_mode: 'monochrome',
  },
};

// Typed responses
const result: Types.GenerateResponse = await client.generate
  .configure(generateParams)
  .execute();

// Type-safe access
console.log(result.svgUrl);      // string
console.log(result.creditCost);  // number
console.log(result.pngImageData); // Buffer | undefined
```

### Available Types

- `GenerateParams`, `EditParams`, `ConvertParams`
- `GenerateResponse`, `EditResponse`, `ConvertResponse`
- `StyleParams`, `AdvancedStyleParams`
- `Quality`, `AspectRatio`, `Background`
- `Style`, `ColorMode`, `ImageComplexity`
- `StreamEvent`, `GenerateStreamEvent`, `EditStreamEvent`, `ConvertStreamEvent`

## Best Practices

### Performance Optimization

1. **Reuse Client Instances**: Create one client instance and reuse it
2. **Use Appropriate Quality Levels**: Choose quality based on your needs
3. **Enable Streaming for Long Operations**: Use streaming for better UX
4. **Handle Errors Gracefully**: Implement proper error handling

```typescript
// Good: Reuse client instance
const client = new SVGMakerClient('your-api-key');

// Bad: Creating new client for each request
const result = await new SVGMakerClient('your-api-key').generate...
```

### Error Handling

1. **Catch Specific Errors**: Handle different error types appropriately
2. **Implement Retry Logic**: Use built-in retry mechanisms
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

1. **Protect API Keys**: Never expose API keys in client-side code
2. **Use Environment Variables**: Store API keys securely
3. **Validate Input**: Always validate user input before sending to API

```typescript
// Good: Use environment variables
const client = new SVGMakerClient(process.env.SVGMAKER_API_KEY);

// Bad: Hardcode API key
const client = new SVGMakerClient('hardcoded-api-key');
```

## Examples

### Basic Usage

```typescript
import { SVGMakerClient } from '@genwave/svgmaker-sdk';

const client = new SVGMakerClient('your-api-key');

// Generate a simple SVG
const result = await client.generate
  .configure({
    prompt: 'A simple geometric logo',
    quality: 'medium',
    svgText: true,
  })
  .execute();

console.log('Generated SVG:', result.svgUrl);
```

### Advanced Styling

```typescript
const result = await client.generate
  .configure({
    prompt: 'A modern app icon',
    quality: 'high',
    aspectRatio: 'square',
    styleParams: {
      style: 'flat',
      color_mode: '3-colors',
      category: 'icon',
      composition: 'center-object',
      advanced: {
        stroke_weight: 'medium',
        corner_style: 'rounded',
        shadow_effect: 'soft'
      }
    },
    base64Png: true,
    svgText: true,
  })
  .execute();
```

### Batch Processing

```typescript
const prompts = [
  'A mountain landscape',
  'A city skyline',
  'A forest scene'
];

const results = await Promise.all(
  prompts.map(prompt =>
    client.generate
      .configure({ prompt, quality: 'medium' })
      .execute()
  )
);

console.log('Generated SVGs:', results.map(r => r.svgUrl));
```

### Streaming with Progress

```typescript
const stream = client.generate
  .configure({
    prompt: 'A complex illustration',
    quality: 'high',
    base64Png: true,
  })
  .stream();

for await (const event of stream) {
  switch (event.status) {
    case 'processing':
      console.log(`Progress: ${event.message}`);
      break;
    case 'complete':
      console.log('Generation complete!');
      console.log('SVG URL:', event.svgUrl);
      if (event.pngImageData) {
        console.log('PNG preview available');
      }
      break;
    case 'error':
      console.error('Generation failed:', event.error);
      break;
  }
}
```

### File Upload and Editing

```typescript
import fs from 'fs';

// Edit an existing image
const result = await client.edit
  .configure({
    image: fs.createReadStream('./input.png'),
    prompt: 'Add a blue background and make it more vibrant',
    quality: 'medium',
    styleParams: {
      style: 'realistic',
      color_mode: 'full-color'
    },
    base64Png: true,
  })
  .execute();

console.log('Edited SVG:', result.svgUrl);
```

## Troubleshooting

### Common Issues

#### Authentication Errors

**Problem**: `AuthError: Invalid API key`

**Solution**: 
- Verify your API key is correct
- Check that the API key has sufficient credits
- Ensure the API key is properly formatted

#### Rate Limiting

**Problem**: `RateLimitError: Rate limit exceeded`

**Solution**:
- Implement exponential backoff
- Use the `retryAfter` property to wait
- Consider upgrading your plan for higher limits

#### File Upload Issues

**Problem**: `FileSizeError: File too large`

**Solution**:
- Check file size limits (typically 10MB)
- Compress images before upload
- Use supported file formats

#### Network Issues

**Problem**: `NetworkError: Connection timeout`

**Solution**:
- Check internet connectivity
- Increase timeout configuration
- Implement retry logic

### Debugging

Enable detailed logging for debugging:

```typescript
const client = new SVGMakerClient('your-api-key', {
  logging: true,
  logLevel: 'debug',
});
```

### Performance Issues

1. **Slow Generation**: Use lower quality settings for faster results
2. **Memory Issues**: Process files in smaller batches
3. **Network Timeouts**: Increase timeout configuration

## Support

### Resources

- **Repository**: [GitHub Repository](https://github.com/GenWaveLLC/svgmaker-sdk-node)
- **NPM Package**: [@genwave/svgmaker-sdk](https://www.npmjs.com/package/@genwave/svgmaker-sdk)
- **API Documentation**: [SVGMaker API Docs](https://svgmaker.io/docs)

### Contributing

We welcome contributions! Please see [`CONTRIBUTING.md`](../CONTRIBUTING.md) for guidelines.

## License

MIT License - see the [`LICENSE`](../LICENSE) file for details.

---

**Version**: 0.3.0  
**Node.js**: >=18.0.0  
**License**: MIT  
**Repository**: [GitHub](https://github.com/GenWaveLLC/svgmaker-sdk-node) 