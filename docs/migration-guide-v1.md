# Migrating to v1.0.0

This guide covers all breaking changes when upgrading from `@genwave/svgmaker-sdk` v0.x to v1.0.0.

## Base URL Changed

The SDK now targets the dedicated API domain.

```diff
- https://svgmaker.io/api
+ https://api.svgmaker.io
```

If you were using the default `baseUrl`, no code changes are needed — the new default is applied automatically. If you hardcoded the old URL, update it:

```typescript
const client = new SVGMakerClient('key', {
  baseUrl: 'https://api.svgmaker.io', // new default
});
```

## Convert Client Restructured

The old `client.convert` was a single flat client. It is now a **namespace** with specialized sub-clients.

### Before (v0.x)

```typescript
// Single convert client for AI vectorization only
const result = await client.convert
  .configure({ file: './photo.jpg', svgText: true })
  .execute();
```

### After (v1.0.0)

```typescript
// AI vectorization
const result = await client.convert.aiVectorize
  .configure({ file: './photo.jpg', svgText: true })
  .execute();

// New: algorithmic tracing
const traced = await client.convert.trace
  .configure({ file: './logo.png' })
  .execute();

// New: SVG to vector formats (PDF, EPS, DXF, AI, PS)
const pdf = await client.convert.svgToVector
  .configure({ file: './icon.svg', format: 'pdf' })
  .execute();

// New: raster-to-raster conversion
const webp = await client.convert.rasterToRaster
  .configure({ file: './photo.jpg', format: 'webp' })
  .execute();

// New: batch conversion (up to 10 files)
const batch = await client.convert.batch
  .configure({ files: ['./a.png', './b.png'], format: 'webp' })
  .execute();
```

**Action required:** Replace `client.convert.configure(...)` with `client.convert.aiVectorize.configure(...)`.

## Generate: Style Parameters Overhauled

The `styleParams` options have been completely redesigned to match the v1 API.

### Before (v0.x)

```typescript
await client.generate.configure({
  prompt: 'A mountain icon',
  styleParams: {
    style: 'minimalist',           // removed
    color_mode: '2-colors',        // values changed
    image_complexity: 'simple',    // removed
    category: 'icon',              // removed
    composition: 'center-object',  // values changed
    advanced: {                    // removed entirely
      stroke_weight: 'thin',
      corner_style: 'rounded',
      shadow_effect: 'soft',
    },
  },
}).execute();
```

### After (v1.0.0)

```typescript
await client.generate.configure({
  prompt: 'A mountain icon',
  styleParams: {
    style: 'flat',                         // new values: flat, line_art, engraving, linocut, silhouette, isometric, cartoon, ghibli
    color_mode: 'few_colors',              // new values: full_color, monochrome, few_colors
    image_complexity: 'icon',              // now: icon, illustration, scene
    text: 'only_title',                    // new field
    composition: 'centered_object',        // new values: centered_object, repeating_pattern, full_scene, objects_in_grid
  },
}).execute();
```

### Key differences

| Field | v0.x | v1.0.0 |
|-------|------|--------|
| `style` | minimalist, cartoon, realistic, abstract, flat, isometric | flat, line_art, engraving, linocut, silhouette, isometric, cartoon, ghibli |
| `color_mode` | monochrome, 2-colors, 3-colors, full-color | full_color, monochrome, few_colors |
| `image_complexity` | simple, detailed | icon, illustration, scene |
| `composition` | center-object, full-scene | centered_object, repeating_pattern, full_scene, objects_in_grid |
| `category` | icon, illustration, pattern, logo, scene | **removed** (use `image_complexity` instead) |
| `advanced` | stroke_weight, corner_style, shadow_effect | **removed** |
| `text` | — | **new**: only_title, embedded_text |

## New `model` Parameter (Generate & Edit)

Both `generate` and `edit` now accept a `model` parameter to specify the AI model directly instead of using `quality`:

```typescript
// Using quality (still works)
await client.generate.configure({ prompt: '...', quality: 'high' }).execute();

// Using model directly (new — works on both generate and edit)
await client.generate.configure({ prompt: '...', model: 'flux-fast' }).execute();
await client.edit.configure({ image: './input.png', prompt: '...', model: 'flux-fast' }).execute();
```

**Note:** `model` and `quality` are mutually exclusive — you cannot use both.

## Generate: Aspect Ratio Values Changed

High quality no longer requires explicit aspect ratio. The `wide` and `tall` aspect ratios have been removed.

| v0.x | v1.0.0 |
|------|--------|
| auto, portrait, landscape, square, wide, tall | auto, portrait, landscape, square |

## Cloud Storage Default Changed

In v0.x, `generate`, `edit`, and `convert` (now `convert.aiVectorize`) **stored results to cloud by default**. In v1.0.0, **results are not stored by default**. You must explicitly opt in with `storage: true`.

### Before (v0.x)

```typescript
// Results were automatically stored to your account
const result = await client.generate
  .configure({ prompt: 'A logo' })
  .execute();
// result.svgUrl pointed to a persisted cloud URL
```

### After (v1.0.0)

```typescript
// Results are NOT stored by default — URLs are temporary
const result = await client.generate
  .configure({ prompt: 'A logo' })
  .execute();

// To persist results, explicitly pass storage: true
const stored = await client.generate
  .configure({ prompt: 'A logo', storage: true })
  .execute();
// stored.svgUrl is now a permanent cloud URL
```

This applies to `generate`, `edit`, and `convert.aiVectorize`. If your application depends on persisted URLs (e.g. saving them to a database), add `storage: true` to those calls.

## New Error Types

v1.0.0 adds error classes for more precise error handling:

```typescript
import { Errors } from '@genwave/svgmaker-sdk';

try {
  await client.generate.configure({ prompt: '...' }).execute();
} catch (error) {
  if (error instanceof Errors.ContentSafetyError) {
    // prompt flagged by content moderation
  } else if (error instanceof Errors.FileSizeError) {
    // uploaded file exceeds size limit
  } else if (error instanceof Errors.FileFormatError) {
    // unsupported file format
  } else if (error instanceof Errors.EndpointDisabledError) {
    // endpoint temporarily unavailable
  }
}
```

All new error types extend `APIError`, so existing `catch (error instanceof Errors.APIError)` blocks will still catch them.

## New Clients

v1.0.0 adds these clients that did not exist in v0.x:

| Client | Access | Purpose |
|--------|--------|---------|
| `enhancePrompt` | `client.enhancePrompt` | Improve prompts with AI before generating |
| `optimizeSvg` | `client.optimizeSvg` | Optimize SVG files using SVGO |
| `generations` | `client.generations` | List, download, share, delete your generations |
| `gallery` | `client.gallery` | Browse and download public gallery items |
| `account` | `client.account` | Account info and credit usage |

## Response Types Updated

Response types now include a `metadata` field with request tracking:

```typescript
const result = await client.generate.configure({ prompt: '...' }).execute();
// result.metadata.requestId — unique request ID for support inquiries
```

## Summary Checklist

- [ ] Replace `client.convert.configure(...)` with `client.convert.aiVectorize.configure(...)`
- [ ] Update `styleParams` to use new enum values (if used)
- [ ] Remove `advanced` style params (if used)
- [ ] Remove `wide`/`tall` aspect ratios (if used)
- [ ] Remove hardcoded `baseUrl` pointing to `svgmaker.io/api` (if set)
- [ ] Add `storage: true` to generate/edit/aiVectorize calls if you need persisted cloud URLs
- [ ] Update error handling to use new error types (optional, existing catches still work)
