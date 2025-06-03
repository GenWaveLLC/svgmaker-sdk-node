# Manual Testing Guide for SVGMaker SDK

## Prerequisites

1. **Get API Key**: Obtain your SVGMaker API key from [SVGMaker.io](https://svgmaker.io)
2. **Set Environment**: Create a `.env` file from `.env.example` and add your API key
3. **Build SDK**: Run `npm run build` to compile the TypeScript source

## Testing Methods

### Method 1: Quick Example Testing

Test the existing examples directly:

```bash
# 1. Set your API key
export SVGMAKER_API_KEY="your-actual-api-key"

# 2. Build the SDK
npm run build

# 3. Run JavaScript example
node examples/basic-usage.js

# 4. Run TypeScript example (requires ts-node)
npx ts-node examples/basic-usage.ts
```

### Method 2: Comprehensive Manual Testing

Use the provided manual testing script:

```bash
# TypeScript testing with full type safety
npm run manual-test

# Test generation only
npm run manual-test generate your-api-key

# Test all features
SVGMAKER_API_KEY=your-key npm run manual-test all

# Alternative: Direct ts-node with correct config
npx ts-node --project tsconfig.cjs.json manual-test.ts generate your-api-key
```

### Method 3: Interactive Development Testing

For development and debugging:

```bash
# Start Node.js REPL with the SDK loaded
node -e "
const { SVGMakerClient } = require('./dist/cjs/index.js');
const client = new SVGMakerClient('your-api-key');
global.client = client;
console.log('SVGMaker client available as global.client');
" -i

# Now you can test interactively:
# > await client.generate.withPrompt('test').execute()
```

### Method 4: Testing Specific Features

#### Generate SVG Testing
```typescript
const result = await client.generate
  .configure({
    prompt: 'A minimalist mountain landscape',
    quality: 'high',
    style: 'minimalist',
    color_mode: 'monochrome',
  })
  .execute();
```

#### Edit Image Testing
```typescript
// Requires an image file (create test-image.png first)
const result = await client.edit
  .configure({
    image: './test-image.png',
    prompt: 'Add a red border',
    quality: 'medium',
  })
  .execute();
```

#### Convert Image Testing
```typescript
// Requires an image file
const result = await client.convert
  .configure({
    file: './test-image.jpg',
  })
  .execute();
```

## Test Image Setup

For edit and convert testing, create test images:

```bash
# Option 1: Download a test image
curl -o test-image.png "https://via.placeholder.com/300x200/blue/white?text=Test+Image"

# Option 2: Create using ImageMagick (if installed)
convert -size 300x200 xc:lightblue -pointsize 20 -draw "text 100,100 'Test Image'" test-image.png

# Option 3: Use any existing image file and rename it
cp your-image.jpg test-image.jpg
```

## Debugging Tips

### Enable Detailed Logging
```typescript
const client = new SVGMakerClient(apiKey, {
  logging: true,
  logLevel: 'debug'
});
```

### Check Configuration
```typescript
console.log('Current config:', client.getConfig());
```

### Error Information
```typescript
try {
  await client.generate.configure({ prompt: 'test' }).execute();
} catch (error) {
  console.log('Error name:', error.name);
  console.log('Error message:', error.message);
  console.log('Status code:', error.statusCode);
  console.log('Full error:', error);
}
```

## Common Issues and Solutions

### 1. "API key is required" Error
- Ensure you're passing a valid API key to the constructor
- Check that your API key is not empty or 'your-api-key'

### 2. Build Errors
```bash
# Clean and rebuild
npm run clean
npm run build
```

### 3. Import/Require Issues
```typescript
// ES Modules (published package)
import { SVGMakerClient } from '@genwave/svgmaker-sdk';

// Local development with ts-node
import { SVGMakerClient } from './src/index';
import * as Types from './src/types/api';

// Local development with built JavaScript
import { SVGMakerClient } from './dist/cjs/index.js';
```

### 4. TypeScript Issues
```bash
# Install ts-node for TypeScript execution
npm install -g ts-node

# Or use via npx
npx ts-node manual-test.ts
```

## Performance Testing

### Test Response Times
```typescript
console.time('generate');
const result = await client.generate.configure({ prompt: 'test' }).execute();
console.timeEnd('generate');
```

### Test with Different Qualities
```typescript
const qualities: Types.Quality[] = ['low', 'medium', 'high'];
for (const quality of qualities) {
  console.time(quality);
  await client.generate.configure({ prompt: 'test', quality }).execute();
  console.timeEnd(quality);
}
```

## Validation Testing

Test various parameter combinations to ensure validation works:

```typescript
// These should fail validation
await client.generate.configure({ prompt: '' }).execute(); // Empty prompt
await client.generate.configure({ prompt: 'test', quality: 'invalid' as any }).execute(); // Invalid quality
```

## Production Testing

Before deploying to production:

1. Test with your production API key
2. Test error handling scenarios
3. Test timeout scenarios
4. Test retry logic
5. Validate all response fields

```typescript
const client = new SVGMakerClient(prodApiKey, {
  timeout: 30000,
  maxRetries: 3,
  retryBackoffFactor: 1000
});
```
