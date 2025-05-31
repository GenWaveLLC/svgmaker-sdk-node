# Configuration Object Changes

This document outlines the changes made to replace individual `with*` methods with configuration objects in the SVGMaker SDK clients.

## Summary of Changes

### Before (Individual Methods)
```typescript
const result = await client.generate
  .withPrompt('A modern minimalist logo design')
  .withQuality('high')
  .withStyle('minimalist')
  .withColorMode('monochrome')
  .withAspectRatio('square')
  .withBackground('transparent')
  .execute();
```

### After (Configuration Object)
```typescript
const result = await client.generate
  .configure({
    prompt: 'A modern minimalist logo design',
    quality: 'high',
    style: 'minimalist',
    color_mode: 'monochrome',
    aspectRatio: 'square',
    background: 'transparent',
  })
  .execute();
```

## Changes Made

### 1. GenerateClient
- **Removed methods**: `withPrompt()`, `withQuality()`, `withAspectRatio()`, `withBackground()`, `withStyle()`, `withColorMode()`, `withImageComplexity()`, `withCategory()`, `withComposition()`, `withAdvancedStyling()`, `withStream()`
- **Added method**: `configure(config: Partial<GenerateParams>)`

### 2. EditClient
- **Removed methods**: `withQuality()`, `withAspectRatio()`, `withBackground()`, `withStream()`
- **Added method**: `configure(options: Partial<EditOptions>)`
- **Kept methods**: `withImage()`, `withPrompt()`, `withMask()` (these are core file/data setters)

### 3. ConvertClient
- **Removed methods**: `withStream()`
- **Added method**: `configure(options: Partial<ConvertOptions>)`
- **Kept methods**: `withFile()` (core file setter)

## Usage Examples

### Generate SVG with Configuration
```typescript
import { SVGMakerClient } from 'svgmaker-sdk';

const client = new SVGMakerClient('your-api-key');

// Basic generation
const result = await client.generate
  .configure({
    prompt: 'A mountain landscape',
    quality: 'high',
    style: 'minimalist',
  })
  .execute();

// Advanced generation with all options
const advancedResult = await client.generate
  .configure({
    prompt: 'A complex geometric pattern',
    quality: 'high',
    aspectRatio: 'square',
    background: 'transparent',
    style: 'abstract',
    color_mode: 'monochrome',
    image_complexity: 'detailed',
    category: 'pattern',
    composition: 'center-object',
    advanced: {
      stroke_weight: 'medium',
      corner_style: 'rounded',
      shadow_effect: 'soft',
    },
  })
  .execute();
```

### Edit Image with Configuration
```typescript
// Edit with configuration
const editResult = await client.edit
  .withImage('./input.png')
  .withPrompt('Add a red border')
  .configure({
    quality: 'medium',
    aspectRatio: 'square',
    background: 'transparent',
  })
  .execute();
```

### Convert Image with Configuration
```typescript
// Convert with streaming
const convertResult = await client.convert
  .withFile('./image.jpg')
  .configure({
    stream: true,
  })
  .execute();
```

### Streaming with Configuration
```typescript
// Streaming generation
const stream = client.generate
  .configure({
    prompt: 'A geometric mountain landscape',
    quality: 'medium',
    stream: true,
  })
  .stream();

for await (const event of stream) {
  if (event.status === 'processing') {
    console.log(`Progress: ${event.message}`);
  } else if (event.status === 'complete') {
    console.log(`Complete! SVG URL: ${event.svgUrl}`);
  }
}
```

## Benefits

1. **Cleaner API**: Single method call instead of chaining multiple methods
2. **Better TypeScript Support**: Full type checking for the entire configuration object
3. **More Flexible**: Easier to pass configuration objects from variables
4. **Consistent**: All clients now follow the same pattern
5. **Maintainable**: Easier to add new configuration options without adding new methods

## Migration Guide

To migrate existing code:

1. Replace method chains with a single `configure()` call
2. Move all parameters into a configuration object
3. Remove type assertions (TypeScript will infer types automatically)
4. Update imports if needed (no longer need individual type imports)

### Example Migration
```typescript
// Old way
const result = await client.generate
  .withPrompt('A logo')
  .withQuality('high' as Types.Quality)
  .withStyle('minimalist' as Types.Style)
  .execute();

// New way
const result = await client.generate
  .configure({
    prompt: 'A logo',
    quality: 'high',
    style: 'minimalist',
  })
  .execute();