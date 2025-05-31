# SVGMaker SDK for Node.js

Official Node.js SDK for the SVGMaker API, providing a clean, type-safe wrapper for generating, editing, and converting SVGs.

[![npm version](https://img.shields.io/npm/v/svgmaker-sdk.svg)](https://www.npmjs.com/package/svgmaker-sdk)
[![License](https://img.shields.io/npm/l/svgmaker-sdk.svg)](https://github.com/svgmaker/svgmaker-sdk-node/blob/main/LICENSE)

## Features

- 🎨 **Full API Support**: Generate, edit, and convert SVGs
- 🧰 **TypeScript First**: Complete type definitions for all API parameters and responses
- 🚀 **Clean Configuration**: Object-based configuration for better developer experience
- 🔁 **Automatic Retries**: Built-in retry logic with exponential backoff
- 🌊 **Streaming Support**: Real-time progress updates via streaming responses
- 🔒 **Input Validation**: Schema-based validation for all API requests
- 📦 **Dual Package**: Support for both ESM and CommonJS
## Installation

```bash
npm install svgmaker-sdk
```

## Quick Start

```typescript
import { SVGMakerClient } from 'svgmaker-sdk';

// Create a client with your API key
const svgmaker = new SVGMakerClient('your-api-key');

// Generate an SVG
const generateResult = await svgmaker.generate
  .configure({
    prompt: 'A minimalist mountain landscape with geometric shapes',
    quality: 'high',
    style: 'minimalist',
  })
  .execute();

console.log('Generated SVG URL:', generateResult.svgUrl);

// Edit an image
const editResult = await svgmaker.edit
  .configure({
    image: './input.png',
    prompt: 'Add a red border',
    quality: 'medium'
  })
  .execute();

console.log('Edited SVG URL:', editResult.svgUrl);

// Convert an image to SVG
const convertResult = await svgmaker.convert
  .configure({
    file: './image.jpg'
  })
  .execute();

console.log('Converted SVG URL:', convertResult.svgUrl);
```

## Configuration-Based API

The SVGMaker SDK uses a clean configuration object approach instead of method chaining. This provides better TypeScript support, cleaner code, and easier maintenance.

### Basic Pattern

```typescript
// Configure all parameters in a single object
const result = await client.generate
  .configure({
    prompt: 'Your description here',
    quality: 'high',
    style: 'minimalist',
    // ... other options
  })
  .execute();
```

### Benefits

- **Type Safety**: Full TypeScript intellisense and validation
- **Cleaner Code**: Single configuration object instead of method chains
- **Flexible**: Easy to pass configuration from variables or functions
- **Maintainable**: Adding new options doesn't require new methods

## API Reference

### SVGMakerClient

The main client for interacting with the SVGMaker API.

```typescript
// Create client with API key
const client = new SVGMakerClient('your-api-key');

// Create client with API key and custom configuration
const client = new SVGMakerClient('your-api-key', {
  baseUrl: 'https://custom-svgmaker-api.com/api',
  timeout: 60000, // 60 seconds
  maxRetries: 5,
});
```

### Configuration Options

```typescript
interface SVGMakerConfig {
  apiKey: string;                   // API key for authentication
  baseUrl: string;                  // Base URL for the API
  timeout: number;                  // Request timeout in milliseconds
  maxRetries: number;               // Maximum number of retries for failed requests
  retryBackoffFactor: number;       // Retry backoff factor in milliseconds
  retryStatusCodes: number[];       // Status codes that should trigger a retry
  logging: boolean;                 // Enable request/response logging
  logLevel: string;                 // Log level: 'debug', 'info', 'warn', 'error'
  caching: boolean;                 // Enable request caching
### Generate SVG

Generate SVG from text prompts using AI.

```typescript
// Basic generation
const result = await client.generate
  .configure({
    prompt: 'A minimalist mountain landscape',
  })
  .execute();

// Advanced generation with options
const result = await client.generate
  .configure({
    prompt: 'A minimalist mountain landscape with geometric shapes',
    quality: 'high',
    aspectRatio: 'landscape',
    background: 'transparent',
    style: 'minimalist',
    color_mode: 'monochrome',
    composition: 'center-object',
    advanced: {
      stroke_weight: 'thin',
      corner_style: 'rounded',
      shadow_effect: 'none'
    }
  })
  .execute();
```

### Edit SVG/Image

Edit existing images or SVGs using AI-powered modifications.

```typescript
// Basic editing
const result = await client.edit
  .configure({
    image: './input.png',
    prompt: 'Add a red border'
  })
  .execute();

// Advanced editing with options
const result = await client.edit
  .configure({
    image: './input.svg',
    prompt: {
      prompt: 'Make this more cartoonish',
      style: 'cartoon',
      color_mode: '3-colors'
    },
    quality: 'medium',
    aspectRatio: 'square',
    background: 'transparent'
  })
  .execute();

// Editing with a mask
const result = await client.edit
  .configure({
    image: './input.png',
    prompt: 'Change the color to blue',
    mask: './mask.png'
  })
  .execute();
```

### Convert Image to SVG

Convert raster images (PNG, JPEG, etc.) to SVG format.

```typescript
// Basic conversion
const result = await client.convert
  .configure({
    file: './image.jpg'
  })
  .execute();

// Conversion with streaming
const result = await client.convert
  .configure({
    file: './image.png',
    stream: true
  })
  .execute();
```

## Streaming Support

All API endpoints support streaming responses for real-time updates on the progress of operations.

```typescript
// Generate with streaming
const stream = client.generate
  .configure({
    prompt: 'A geometric mountain landscape',
    quality: 'high',
  })
  .stream();

// Handle stream events
for await (const event of stream) {
  if (event.status === 'processing') {
    console.log(`Progress: ${event.message}`);
  } else if (event.status === 'complete') {
    console.log(`Complete! SVG URL: ${event.svgUrl}`);
  } else if (event.status === 'error') {
    console.error(`Error: ${event.error}`);
  }
```

### Configuration Options

```typescript
interface SVGMakerConfig {
  apiKey: string;                   // API key for authentication
  baseUrl: string;                  // Base URL for the API (default: "https://svgmaker.io/api")
  timeout: number;                  // Request timeout in milliseconds (default: 30000)
  maxRetries: number;               // Maximum number of retries for failed requests (default: 3)
  retryBackoffFactor: number;       // Retry backoff factor in milliseconds (default: 300)
  retryStatusCodes: number[];       // Status codes that should trigger a retry (default: [408, 429, 500, 502, 503, 504])
  logging: boolean;                 // Enable request/response logging (default: false)
  logLevel: 'debug' | 'info' | 'warn' | 'error';  // Log level (default: "info")
  caching: boolean;                 // Enable request caching (default: false)
  cacheTTL: number;                 // Cache TTL in milliseconds (default: 300000)
  rateLimit: number;                // Maximum number of requests per minute (default: 60)
}
```

#### Using Custom Configuration

```typescript
// Create client with custom configuration
const client = new SVGMakerClient('your-api-key', {
  baseUrl: 'https://svgmaker.io/api',
  timeout: 30000,                   // 30 seconds timeout
  maxRetries: 3,                    // Retry failed requests up to 3 times
  retryBackoffFactor: 300,          // Wait 300ms before first retry
  retryStatusCodes: [408, 429, 500, 502, 503, 504],  // Retry on these status codes
  logging: true,                    // Enable request/response logging
  logLevel: 'info',                 // Log level
  caching: true,                    // Enable response caching
  cacheTTL: 300000,                 // Cache for 5 minutes
  rateLimit: 60                     // Maximum 60 requests per minute
});

// The client will now use these custom settings for all requests
const result = await client.generate
  .configure({
    prompt: 'A minimalist mountain landscape',
  })
  .execute();
```

## Error Handling

The SDK provides custom error classes for different types of errors.

```typescript
try {
  const result = await client.generate
    .configure({
      prompt: 'A minimalist mountain landscape',
      quality: 'high',
    })
    .execute();
} catch (error) {
  if (error instanceof SVGMaker.Errors.ValidationError) {
    console.error('Invalid parameters:', error.message);
  } else if (error instanceof SVGMaker.Errors.APIError) {
    console.error('API error:', error.message, error.statusCode);
  } else if (error instanceof SVGMaker.Errors.RateLimitError) {
    console.error('Rate limit exceeded. Try again in', error.retryAfter, 'seconds');
  } else if (error instanceof SVGMaker.Errors.TimeoutError) {
    console.error('Request timed out after', error.timeout, 'ms');
  } else if (error instanceof SVGMaker.Errors.NetworkError) {
    console.error('Network error:', error.message);
  } else {
    console.error('Unexpected error:', error);
  }
}
```

## TypeScript Support

The SDK is written in TypeScript and provides comprehensive type definitions for all API parameters and responses.

```typescript
import { SVGMakerClient, Types } from 'svgmaker-sdk';

// Type-safe parameters for generation
const generateParams: Types.GenerateParams = {
  prompt: 'A minimalist mountain landscape',
  quality: 'high',
  aspectRatio: 'landscape',
  background: 'transparent'
};

// Type-safe parameters for editing
const editParams: Types.EditParams = {
  image: './input.png',
  prompt: 'Add a red border',
  quality: 'medium',
  aspectRatio: 'square'
};

// Type-safe parameters for conversion
const convertParams: Types.ConvertParams = {
  file: './image.jpg'
};

// Type-safe responses
const generateResult = await client.generate.configure(generateParams).execute();
const editResult = await client.edit.configure(editParams).execute();
const convertResult = await client.convert.configure(convertParams).execute();

// TypeScript knows the shape of all responses
console.log(generateResult.svgUrl);
console.log(generateResult.pngImageData);
console.log(generateResult.revisedPrompt);

console.log(editResult.svgUrl);
console.log(editResult.originalImageUrl);

console.log(convertResult.svgUrl);
console.log(convertResult.originalImageUrl);
```

## Contributing

We welcome contributions to the SVGMaker SDK! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
