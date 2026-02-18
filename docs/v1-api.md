# SVGMaker API v1 Documentation

## Overview

The SVGMaker API v1 provides a RESTful interface for generating, editing, and converting images to SVG format using advanced AI technology. All endpoints require authentication via API key and use a consistent response format.

**Base URL:** `https://api.svgmaker.io`

**API Version:** v1

---

## Authentication

All API endpoints require authentication using an API key passed in the `x-api-key` header.

### Header Format

```
x-api-key: svgmaker-io{your-api-key}
```

### Getting Your API Key

1. Sign up or log in to your SVGMaker account
2. Navigate to your account settings
3. Generate your API key
4. Keep your API key secure and never share it publicly

### Security Best Practices

- Store API keys in environment variables, not in your code
- Rotate your API keys regularly for enhanced security
- Monitor your API usage to detect any unauthorized access
- Never commit API keys to version control

---

## Response Format

All API responses follow a consistent structure:

### Success Response

```json
{
  "success": true,
  "data": {
    // Response data here
  },
  "metadata": {
    "requestId": "req_6-vXlRW6lfD_",
    "creditsUsed": 2,
    "creditsRemaining": 105.5
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "status": 400,
    "message": "Human-readable error message",
    "details": {}
  },
  "metadata": {
    "requestId": "req_6-vXlRW6lfD_"
  }
}
```

**Note:** The `status` field in the error object matches the HTTP status code in the response header. Both are included for convenience - clients can use either the HTTP status code or the `status` field in the error object.

---

## Credit System

Credits are consumed based on the operation type and quality level:

| Operation | Quality | Credits | Description |
|-----------|---------|---------|-------------|
| Generate | Low | 1 | Basic quality SVG generation |
| Generate | Medium | 2 | Standard quality SVG generation |
| Generate | High | 3 | Premium quality SVG generation |
| Edit | Low | 2 | Basic quality image/SVG editing |
| Edit | Medium | 3 | Standard quality image/SVG editing |
| Edit | High | 5 | Premium quality image/SVG editing |
| Convert (AI Vectorize) | - | 1 | Convert raster image to SVG using AI |
| Convert (Trace) | - | 0.5 | Trace raster image to SVG using VTracer |
| Convert (SVG to Vector) | - | 0.5 | Convert SVG to vector format (PDF/EPS/DXF/AI/PS) |
| Convert (Raster to Raster) | - | 0.25 | Convert between raster formats |
| Convert (Batch) | - | 0.5/0.25 | Batch convert files (0.5 per vector, 0.25 per raster) |
| Enhance Prompt | - | 0.5 | Enhance text prompts using AI |
| Optimize SVG | - | 0.5 | Optimize SVG files using SVGO. Use compress=true for SVGZ. |

### Model-Based Credits

When using the `model` parameter instead of `quality`, credits are charged based on the specific model selected. The `model` and `quality` parameters are **mutually exclusive** — providing both will return an error.

**Note:** Pro tier models require a paid account. Free tier models are available to all users.

#### Available Models

| Model ID | Tier | Generate Credits | Edit Credits | Description |
|----------|------|-----------------|--------------|-------------|
| `gpt-image-1-mini` | Free | 1 | 2 | Fast, lightweight image generation |
| `flux-1-dev` | Free | 1 | - | Painterly renders from Black Forest Labs |
| `flux-2-dev` | Free | 1 | 2 | Next-gen Flux model with edit support |
| `z-image-turbo` | Free | 1 | - | Fast turbo generation |
| `qwen-image` | Free | 2 | - | Alibaba's image generation model |
| `qwen-image-edit-plus` | Free | - | 2 | Alibaba's image editing model |
| `flux-kontext-dev` | Free | - | 1 | Context-aware editing model |
| `gpt-image-1` | Pro | 2 | 3 | OpenAI's standard image model |
| `gpt-image-1.5` | Pro | 2 | 3 | OpenAI's enhanced image model |
| `nano-banana` | Pro | 2 | 3 | Google's Gemini image model |
| `nano-banana-pro` | Pro | 5 | 5 | Google's premium Gemini model |
| `imagen-4` | Pro | 2 | - | Google's Imagen 4 model |
| `imagen-4-ultra` | Pro | 3 | - | Google's Imagen 4 Ultra model |
| `seedream-4.5` | Pro | 2 | 3 | ByteDance's Seedream model |

**"-"** indicates the model does not support that operation.

---

## Endpoints

### Generate SVG

Generate SVG graphics from text descriptions using AI.

**Endpoint:** `POST /v1/generate`

**Request Format:** JSON

**Credits:** 1-3 credits (depending on quality)

#### Headers

```
Content-Type: application/json
x-api-key: svgmaker-io{your-api-key}
```

#### Request Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `prompt` | string | Yes | - | Text description of the SVG to generate |
| `quality` | string | No | `medium` | Quality level: `low`, `medium`, or `high` |
| `aspectRatio` | string | No | `auto` | Aspect ratio: `auto`, `portrait`, `landscape`, or `square` |
| `background` | string | No | `auto` | Background type: `auto`, `transparent`, or `opaque` |
| `storage` | boolean | No | `false` | Whether to save files to cloud storage. When `false`, returns proxy URLs immediately (files not persisted). When `true`, saves files to Firebase Storage. `generationId` is always returned. |
| `stream` | boolean | No | `false` | Enable streaming response (Server-Sent Events) |
| `base64Png` | boolean | No | `false` | Include base64-encoded PNG preview in response |
| `svgText` | boolean | No | `false` | Include raw SVG source code as text in response |
| `styleParams` | object | No | - | Style configuration object (see Style Parameters section below) |
| `model` | string | No | - | Specific AI model ID to use. Cannot be combined with `quality`. Credits are charged based on the model. See Available Models section. |

#### Style Parameters

The `styleParams` object can include:

```json
{
  "style": "flat|line_art|engraving|linocut|silhouette|isometric|cartoon|ghibli",
  "color_mode": "full_color|monochrome|few_colors",
  "image_complexity": "icon|illustration|scene",
  "text": "only_title|embedded_text",
  "composition": "centered_object|repeating_pattern|full_scene|objects_in_grid"
}
```

#### Example Request

```bash
curl -X POST https://api.svgmaker.io/v1/generate \
  -H "Content-Type: application/json" \
  -H "x-api-key: svgmaker-io{your-api-key}" \
  -d '{
    "prompt": "A minimalist mountain landscape with geometric shapes",
    "quality": "high",
    "aspectRatio": "landscape",
    "background": "transparent",
    "storage": false,
    "base64Png": true,
    "svgText": true,
    "styleParams": {
      "style": "flat",
      "color_mode": "monochrome",
      "composition": "centered_object"
    }
  }'
```

#### Example Request (with model)

```bash
curl -X POST https://api.svgmaker.io/v1/generate \
  -H "Content-Type: application/json" \
  -H "x-api-key: svgmaker-io{your-api-key}" \
  -d '{
    "prompt": "A minimalist mountain landscape with geometric shapes",
    "model": "flux-1-dev",
    "background": "transparent",
    "svgText": true
  }'
```

#### Response (storage: false)

```json
{
  "success": true,
  "data": {
    "creditCost": 3,
    "quality": "high",
    "message": "Image generated successfully",
    "svgUrl": "https://svgmaker.io/api/files/eyJ1cmwiOiJodHRwOi8v...",
    "svgUrlExpiresIn": "12h",
    "base64Png": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
    "svgText": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 1024 1024\">...</svg>"
  },
  "metadata": {
    "requestId": "req_6-vXlRW6lfD_",
    "creditsUsed": 3,
    "creditsRemaining": 102.5
  }
}
```

#### Response (storage: true)

```json
{
  "success": true,
  "data": {
    "generationId": "eEwY0EcnHiy1c8nZKd3S",
    "creditCost": 3,
    "quality": "high",
    "svgUrl": "https://svgmaker.io/api/files/eyJ1cmwiOiJodHRwOi8v...",
    "svgUrlExpiresIn": "12h",
    "message": "Files stored to cloud successfully",
    "base64Png": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
    "svgText": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 1024 1024\">...</svg>"
  },
  "metadata": {
    "requestId": "req_4tOpoNLjmSsU",
    "creditsUsed": 3,
    "creditsRemaining": 100.5
  }
}
```

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `creditCost` | number | Credits charged for this operation |
| `quality` | string | Quality level used (`low`, `medium`, `high`) |
| `message` | string | Status message (`Image generated successfully` when `storage: false`, `Files stored to cloud successfully` when `storage: true`) |
| `svgUrl` | string | URL to access the generated SVG (proxy URL or persistent URL) |
| `svgUrlExpiresIn` | string | Expiration time for proxy URLs (e.g., "12h"). Only present for proxy URLs. |
| `generationId` | string | Unique identifier for the generation. Always present. |
| `base64Png` | string | Base64-encoded PNG preview. Only present when `base64Png: true`. |
| `svgText` | string | Raw SVG source code. Only present when `svgText: true`. |

---

### Edit Image/SVG

Edit existing images or SVGs with AI-powered modifications.

**Endpoint:** `POST /v1/edit`

**Request Format:** multipart/form-data

**Credits:** 2-5 credits (depending on quality)

#### Headers

```
Content-Type: multipart/form-data
x-api-key: svgmaker-io{your-api-key}
```

#### Request Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `image` | file | Yes | - | Image file to edit (PNG, JPEG, WebP, SVG, etc.) |
| `prompt` | string | Yes | - | Edit instructions as a text string |
| `quality` | string | No | `medium` | Quality level: `low`, `medium`, or `high` |
| `aspectRatio` | string | No | `auto` | Aspect ratio: `auto`, `portrait`, `landscape`, or `square` |
| `background` | string | No | `auto` | Background type: `auto`, `transparent`, or `opaque` |
| `storage` | string | No | `false` | Whether to save to cloud storage. Pass `"true"` or `"false"` as a string. |
| `stream` | string | No | `false` | Enable streaming response. Pass `"true"` or `"false"` as a string. |
| `base64Png` | string | No | `false` | Include base64-encoded PNG preview. Pass `"true"` or `"false"` as a string. |
| `svgText` | string | No | `false` | Include raw SVG source code. Pass `"true"` or `"false"` as a string. |
| `styleParams` | string | No | - | JSON string containing style parameters (see Style Parameters section) |
| `model` | string | No | - | Specific AI model ID to use. Cannot be combined with `quality`. Credits are charged based on the model. Pass as a string in form data. See Available Models section. |

\* Either `prompt` or `styleParams` must be provided.

#### Example Request

```bash
curl -X POST https://api.svgmaker.io/v1/edit \
  -H "x-api-key: svgmaker-io{your-api-key}" \
  -F "image=@input-image.png" \
  -F "prompt=Add a golden frame around this image" \
  -F "quality=medium" \
  -F "aspectRatio=square" \
  -F "background=transparent" \
  -F "storage=false" \
  -F "base64Png=true" \
  -F "svgText=true" \
  -F "styleParams={\"style\":\"flat\",\"color_mode\":\"monochrome\"}"
```

#### Example Request (with model)

```bash
curl -X POST https://api.svgmaker.io/v1/edit \
  -H "x-api-key: svgmaker-io{your-api-key}" \
  -F "image=@input-image.png" \
  -F "prompt=Add a golden frame around this image" \
  -F "model=gpt-image-1-mini" \
  -F "background=transparent" \
  -F "svgText=true"
```

#### Response (storage: false)

```json
{
  "success": true,
  "data": {
    "creditCost": 3,
    "quality": "medium",
    "message": "Image edited successfully",
    "svgUrl": "https://svgmaker.io/api/files/eyJ1cmwiOiJodHRwOi8v...",
    "svgUrlExpiresIn": "12h",
    "base64Png": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
    "svgText": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 1024 1024\">...</svg>"
  },
  "metadata": {
    "requestId": "req_6-vXlRW6lfD_",
    "creditsUsed": 3,
    "creditsRemaining": 97.5
  }
}
```

#### Response (storage: true)

```json
{
  "success": true,
  "data": {
    "generationId": "eEwY0EcnHiy1c8nZKd3S",
    "creditCost": 3,
    "quality": "medium",
    "svgUrl": "https://svgmaker.io/api/files/eyJ1cmwiOiJodHRwOi8v...",
    "svgUrlExpiresIn": "12h",
    "message": "Files stored to cloud successfully",
    "base64Png": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
    "svgText": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 1024 1024\">...</svg>"
  },
  "metadata": {
    "requestId": "req_4tOpoNLjmSsU",
    "creditsUsed": 3,
    "creditsRemaining": 94.5
  }
}
```

#### Response Fields

Same as Generate endpoint (see above).

---

### Enhance Prompt

Enhance a text prompt using AI to make it more detailed, specific, and effective for generating high-quality SVG images.

**Endpoint:** `POST /v1/enhance-prompt`

**Request Format:** JSON

**Credits:** 0.5 credits

#### Headers

```
Content-Type: application/json
x-api-key: svgmaker-io{your-api-key}
```

#### Request Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `prompt` | string | Yes | - | The text prompt to enhance |

#### Example Request

```bash
curl -X POST https://api.svgmaker.io/v1/enhance-prompt \
  -H "Content-Type: application/json" \
  -H "x-api-key: svgmaker-io{your-api-key}" \
  -d '{
    "prompt": "a cat"
  }'
```

#### Response

```json
{
  "success": true,
  "data": {
    "enhancedPrompt": "A stylized vector illustration of a cat, featuring clean lines and geometric shapes, rendered in a modern flat design style with vibrant colors and minimalist composition."
  },
  "metadata": {
    "requestId": "req_6-vXlRW6lfD_",
    "creditsUsed": 0.5,
    "creditsRemaining": 99.5
  }
}
```

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `enhancedPrompt` | string | The AI-enhanced version of the input prompt, optimized for SVG image generation |

#### Error Responses

**Missing Prompt:**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_REQUEST",
    "status": 400,
    "message": "A valid prompt is required."
  },
  "metadata": {
    "requestId": "req_6-vXlRW6lfD_"
  }
}
```

**Invalid Request Body:**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_REQUEST",
    "status": 400,
    "message": "Invalid request body."
  },
  "metadata": {
    "requestId": "req_6-vXlRW6lfD_"
  }
}
```

---

### AI Vectorize Image

Convert raster images (PNG, JPEG, WebP, etc.) to SVG format using AI-powered vectorization.

**Endpoint:** `POST /v1/convert/ai-vectorize`

**Request Format:** multipart/form-data

**Credits:** 1 credit

#### Headers

```
Content-Type: multipart/form-data
x-api-key: svgmaker-io{your-api-key}
```

#### Request Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `file` | file | Yes | - | Image file to convert (PNG, JPEG, WebP, TIFF, etc.). SVG files are not accepted as they are already in vector format. |
| `storage` | string | No | `false` | Whether to save to cloud storage. Pass `"true"` or `"false"` as a string. |
| `stream` | string | No | `false` | Enable streaming response. Pass `"true"` or `"false"` as a string. |
| `svgText` | string | No | `false` | Include raw SVG source code. Pass `"true"` or `"false"` as a string. |

**Note:** The `base64Png` parameter is not supported for this endpoint since it converts raster images to SVG.

#### Example Request

```bash
curl -X POST https://api.svgmaker.io/v1/convert/ai-vectorize \
  -H "x-api-key: svgmaker-io{your-api-key}" \
  -F "file=@image-to-convert.png" \
  -F "storage=false" \
  -F "svgText=true" \
  -F "stream=false"
```

#### Response (storage: false)

```json
{
  "success": true,
  "data": {
    "creditCost": 1,
    "message": "Image converted successfully",
    "svgUrl": "https://svgmaker.io/api/files/eyJ1cmwiOiJodHRwOi8v...",
    "svgUrlExpiresIn": "12h",
    "svgText": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 1024 1024\">...</svg>"
  },
  "metadata": {
    "requestId": "req_6-vXlRW6lfD_",
    "creditsUsed": 1,
    "creditsRemaining": 99.5
  }
}
```

#### Response (storage: true)

```json
{
  "success": true,
  "data": {
    "generationId": "eEwY0EcnHiy1c8nZKd3S",
    "creditCost": 1,
    "svgUrl": "https://svgmaker.io/api/files/eyJ1cmwiOiJodHRwOi8v...",
    "svgUrlExpiresIn": "12h",
    "message": "Files stored to cloud successfully",
    "svgText": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 1024 1024\">...</svg>"
  },
  "metadata": {
    "requestId": "req_4tOpoNLjmSsU",
    "creditsUsed": 1,
    "creditsRemaining": 98.5
  }
}
```

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `creditCost` | number | Credits charged for this operation (always 1) |
| `message` | string | Status message (`Image converted successfully` when `storage: false`, `Files stored to cloud successfully` when `storage: true`) |
| `svgUrl` | string | URL to access the converted SVG (proxy URL or persistent URL) |
| `svgUrlExpiresIn` | string | Expiration time for proxy URLs (e.g., "12h"). Only present for proxy URLs. |
| `generationId` | string | Unique identifier for the generation. Always present. |
| `svgText` | string | Raw SVG source code. Only present when `svgText: true`. |

#### Error Responses

**SVG File Provided:**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_REQUEST",
    "status": 400,
    "message": "SVG files are already in vector format and do not need conversion."
  },
  "metadata": {
    "requestId": "req_6-vXlRW6lfD_"
  }
}
```

**No File Provided:**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_REQUEST",
    "status": 400,
    "message": "No image file provided."
  },
  "metadata": {
    "requestId": "req_6-vXlRW6lfD_"
  }
}
```

**File Too Large:**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_REQUEST",
    "status": 400,
    "message": "File size exceeds 100 MB limit."
  },
  "metadata": {
    "requestId": "req_6-vXlRW6lfD_"
  }
}
```

---

### Trace to SVG

Trace raster images to SVG format using tracing algorithms. Currently supports VTracer, with Potrace and Coltrace coming soon.

**Endpoint:** `POST /v1/convert/trace`

**Request Format:** multipart/form-data

**Credits:** 0.5 credits

#### Headers

```
Content-Type: multipart/form-data
x-api-key: svgmaker-io{your-api-key}
```

#### Request Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `file` | file | Yes | - | Raster image file to trace (PNG, JPG, WEBP, TIFF) |
| `algorithm` | string | No | `vtracer` | Tracing algorithm: `vtracer` (currently supported), `potrace` (coming soon), or `coltrace` (coming soon). Can be passed as a query parameter or form data field. |
| `preset` | string | No | `poster` | Tracing preset: `bw`, `poster`, or `photo` |
| `mode` | string | No | `spline` | Tracing mode: `pixel`, `polygon`, or `spline` |
| `hierarchical` | string | No | `stacked` | Hierarchical mode: `stacked` or `cutout` |
| `detail` | number | No | 50 | Detail level (0-100) |
| `smoothness` | number | No | 50 | Smoothness level (0-100) |
| `corners` | number | No | 50 | Corner detection level (0-100) |
| `reduceNoise` | number | No | 4 | Noise reduction level |

**Note:** The `toFormat` parameter is automatically set to `SVG` for this endpoint.

#### Example Request

```bash
# Using vtracer (default)
curl -X POST https://api.svgmaker.io/v1/convert/trace \
  -H "x-api-key: svgmaker-io{your-api-key}" \
  -F "file=@image.png" \
  -F "preset=poster" \
  -F "mode=spline" \
  -F "detail=60" \
  -F "smoothness=50" \
  -F "corners=50"

# Explicitly specifying algorithm as query parameter
curl -X POST "https://api.svgmaker.io/v1/convert/trace?algorithm=vtracer" \
  -H "x-api-key: svgmaker-io{your-api-key}" \
  -F "file=@image.png" \
  -F "preset=poster"

# Or as form data field
curl -X POST https://api.svgmaker.io/v1/convert/trace \
  -H "x-api-key: svgmaker-io{your-api-key}" \
  -F "file=@image.png" \
  -F "algorithm=vtracer" \
  -F "preset=poster"
```

#### Response

```json
{
  "success": true,
  "data": {
    "results": [
      {
        "filename": "image.png",
        "success": true,
        "url": "https://svgmaker.io/api/files/eyJ1cmwiOiJodHRwOi8v...",
        "urlExpiresIn": "24h",
        "format": "svg"
      }
    ],
    "summary": {
      "total": 1,
      "successful": 1,
      "failed": 0
    }
  },
  "metadata": {
    "requestId": "req_6-vXlRW6lfD_",
    "creditsUsed": 0.5,
    "creditsRemaining": 99.5
  }
}
```

**Note:** URLs expire after 12 hours. Files are automatically deleted after 24 hours.

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `results` | array | Array of conversion results |
| `results[].filename` | string | Original filename |
| `results[].success` | boolean | Whether conversion succeeded |
| `results[].url` | string | Proxy URL to download the converted file (expires after 12h) |
| `results[].urlExpiresIn` | string | URL expiration time (e.g., "12h") |
| `results[].format` | string | Output file extension |
| `results[].error` | string | Error message (if failed) |
| `summary` | object | Summary statistics |
| `summary.total` | number | Total number of files processed |
| `summary.successful` | number | Number of successful conversions |
| `summary.failed` | number | Number of failed conversions |

#### Error Responses

**Invalid Algorithm:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "status": 400,
    "message": "Invalid algorithm 'invalid-algo'. Supported: vtracer. potrace and coltrace coming soon."
  },
  "metadata": {
    "requestId": "req_6-vXlRW6lfD_"
  }
}
```

**Algorithm Coming Soon (Potrace/Coltrace):**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "status": 400,
    "message": "Algorithm 'potrace' is coming soon. Currently only 'vtracer' is supported."
  },
  "metadata": {
    "requestId": "req_6-vXlRW6lfD_"
  }
}
```

---

### SVG to Vector

Convert SVG files to other vector formats (PDF, EPS, DXF, AI, PS).

**Endpoint:** `POST /v1/convert/svg-to-vector`

**Request Format:** multipart/form-data

**Credits:** 0.5 credits

#### Headers

```
Content-Type: multipart/form-data
x-api-key: svgmaker-io{your-api-key}
```

#### Request Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `file` | file | Yes | - | SVG file to convert |
| `toFormat` | string | Yes | - | Target format: `PDF`, `EPS`, `DXF`, `AI`, or `PS` |
| `textToPath` | string | No | `false` | Convert text to paths. Pass `"true"` or `"false"` as a string. |
| `dxfVersion` | string | No | `R14` | DXF version (only for DXF format): `R12` or `R14` |

#### Example Request

```bash
curl -X POST https://api.svgmaker.io/v1/convert/svg-to-vector \
  -H "x-api-key: svgmaker-io{your-api-key}" \
  -F "file=@image.svg" \
  -F "toFormat=PDF" \
  -F "textToPath=true"
```

#### Response

```json
{
  "success": true,
  "data": {
    "results": [
      {
        "filename": "image.svg",
        "success": true,
        "url": "https://svgmaker.io/api/files/eyJ1cmwiOiJodHRwOi8v...",
        "urlExpiresIn": "24h",
        "format": "pdf"
      }
    ],
    "summary": {
      "total": 1,
      "successful": 1,
      "failed": 0
    }
  },
  "metadata": {
    "requestId": "req_6-vXlRW6lfD_",
    "creditsUsed": 0.5,
    "creditsRemaining": 99.5
  }
}
```

**Note:** URLs expire after 12 hours. Files are automatically deleted after 24 hours.

#### Response Fields

Same structure as Trace to SVG endpoint (see above).

---

### Raster to Raster

Convert between raster image formats (PNG, JPG, WebP, TIFF, GIF, AVIF).

**Endpoint:** `POST /v1/convert/raster-to-raster`

**Request Format:** multipart/form-data

**Credits:** 0.25 credits

#### Headers

```
Content-Type: multipart/form-data
x-api-key: svgmaker-io{your-api-key}
```

#### Request Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `file` | file | Yes | - | Raster image file to convert (PNG, JPG, WEBP, TIFF, GIF, AVIF) |
| `toFormat` | string | Yes | - | Target format: `PNG`, `JPG`, `WEBP`, `TIFF`, `GIF`, or `AVIF` |
| `quality` | number | No | - | Output quality (1-100). Only applies to lossy formats like JPG and WebP. |
| `width` | number | No | - | Output width in pixels. Maintains aspect ratio if only width is specified. |
| `height` | number | No | - | Output height in pixels. Maintains aspect ratio if only height is specified. |

#### Example Request

```bash
curl -X POST https://api.svgmaker.io/v1/convert/raster-to-raster \
  -H "x-api-key: svgmaker-io{your-api-key}" \
  -F "file=@image.png" \
  -F "toFormat=JPG" \
  -F "quality=90" \
  -F "width=1920"
```

#### Response

```json
{
  "success": true,
  "data": {
    "results": [
      {
        "filename": "image.png",
        "success": true,
        "url": "https://svgmaker.io/api/files/eyJ1cmwiOiJodHRwOi8v...",
        "urlExpiresIn": "24h",
        "format": "jpg"
      }
    ],
    "summary": {
      "total": 1,
      "successful": 1,
      "failed": 0
    }
  },
  "metadata": {
    "requestId": "req_6-vXlRW6lfD_",
    "creditsUsed": 0.25,
    "creditsRemaining": 99.75
  }
}
```

**Note:** URLs expire after 12 hours. Files are automatically deleted after 24 hours.

#### Response Fields

Same structure as Trace to SVG endpoint (see above).

---

### Batch Convert

Convert multiple files (up to 10) in a single request. Supports all conversion types.

**Endpoint:** `POST /v1/convert/batch`

**Request Format:** multipart/form-data

**Credits:** 0.5 credits per vector output, 0.25 credits per raster output

#### Headers

```
Content-Type: multipart/form-data
x-api-key: svgmaker-io{your-api-key}
```

#### Request Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `file` | file | Yes | - | File(s) to convert. Can include multiple files (up to 10). Use `file` as the field name for each file. |
| `toFormat` | string | Yes | - | Target format (e.g., `SVG`, `PDF`, `PNG`, `JPG`, etc.) |
| `textToPath` | string | No | `false` | Convert text to paths (for SVG to vector). Pass `"true"` or `"false"` as a string. |
| `dxfVersion` | string | No | `R14` | DXF version (only for DXF format): `R12` or `R14` |
| `preset` | string | No | `poster` | Tracing preset (for raster to SVG): `bw`, `poster`, or `photo` |
| `mode` | string | No | `spline` | Tracing mode (for raster to SVG): `pixel`, `polygon`, or `spline` |
| `hierarchical` | string | No | `stacked` | Hierarchical mode (for raster to SVG): `stacked` or `cutout` |
| `detail` | number | No | 50 | Detail level (0-100, for raster to SVG) |
| `smoothness` | number | No | 50 | Smoothness level (0-100, for raster to SVG) |
| `corners` | number | No | 50 | Corner detection level (0-100, for raster to SVG) |
| `quality` | number | No | - | Output quality (1-100, for raster conversions) |
| `width` | number | No | - | Output width in pixels (for raster conversions) |
| `height` | number | No | - | Output height in pixels (for raster conversions) |

#### Example Request

```bash
curl -X POST https://api.svgmaker.io/v1/convert/batch \
  -H "x-api-key: svgmaker-io{your-api-key}" \
  -F "file=@image1.png" \
  -F "file=@image2.jpg" \
  -F "toFormat=SVG" \
  -F "preset=poster" \
  -F "mode=spline"
```

#### Response

```json
{
  "success": true,
  "data": {
    "results": [
      {
        "filename": "image1.png",
        "success": true,
        "url": "https://svgmaker.io/api/files/eyJ1cmwiOiJodHRwOi8v...",
        "urlExpiresIn": "24h",
        "format": "svg"
      },
      {
        "filename": "image2.jpg",
        "success": true,
        "url": "https://svgmaker.io/api/files/eyJ1cmwiOiJodHRwOi8v...",
        "urlExpiresIn": "24h",
        "format": "svg"
      }
    ],
    "summary": {
      "total": 2,
      "successful": 2,
      "failed": 0
    }
  },
  "metadata": {
    "requestId": "req_6-vXlRW6lfD_",
    "creditsUsed": 1.0,
    "creditsRemaining": 99.0
  }
}
```

**Note:** URLs expire after 12 hours. Files are automatically deleted after 24 hours.

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `results` | array | Array of conversion results |
| `results[].filename` | string | Original filename |
| `results[].success` | boolean | Whether conversion succeeded |
| `results[].url` | string | Proxy URL to download the converted file (expires after 12h) |
| `results[].urlExpiresIn` | string | URL expiration time (e.g., "12h") |
| `results[].format` | string | Output file extension |
| `results[].error` | string | Error message (if failed) |
| `summary` | object | Summary statistics |
| `summary.total` | number | Total number of files processed |
| `summary.successful` | number | Number of successful conversions |
| `summary.failed` | number | Number of failed conversions |

#### Error Responses

**Too Many Files:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "status": 400,
    "message": "This endpoint accepts maximum 10 file. Use /v1/convert/batch for multiple files."
  },
  "metadata": {
    "requestId": "req_6-vXlRW6lfD_"
  }
}
```

**Invalid Format:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "status": 400,
    "message": "Invalid output format \"PNG\". Allowed: PDF, EPS, DXF, AI, PS"
  },
  "metadata": {
    "requestId": "req_6-vXlRW6lfD_"
  }
}
```

**Missing toFormat:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "status": 400,
    "message": "Target format (toFormat) is required"
  },
  "metadata": {
    "requestId": "req_6-vXlRW6lfD_"
  }
}
```

---

### Optimize SVG

Optimize SVG files using SVGO to reduce file size by 10-30%.

**Endpoint:** `POST /v1/svg/optimize`

**Request Format:** multipart/form-data

**Credits:** 0.5 credits

#### Headers

```
Content-Type: multipart/form-data
x-api-key: svgmaker-io{your-api-key}
```

#### Request Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `file` | file | Yes | - | SVG file to optimize |
| `compress` | string | No | `false` | Compress to SVGZ format after optimization. Pass `"true"` or `"false"` as a string. When true, returns svgzUrl instead of svgUrl. |

#### Example Request

```bash
# Optimize only
curl -X POST https://api.svgmaker.io/v1/svg/optimize \
  -H "x-api-key: svgmaker-io{your-api-key}" \
  -F "file=@image.svg"

# Optimize and compress to SVGZ
curl -X POST https://api.svgmaker.io/v1/svg/optimize \
  -H "x-api-key: svgmaker-io{your-api-key}" \
  -F "file=@image.svg" \
  -F "compress=true"
```

#### Response (compress: false)

```json
{
  "success": true,
  "data": {
    "svgUrl": "https://svgmaker.io/api/files/eyJ1cmwiOiJodHRwOi8v...",
    "svgUrlExpiresIn": "12h"
  },
  "metadata": {
    "requestId": "req_6-vXlRW6lfD_",
    "creditsUsed": 0.5,
    "creditsRemaining": 99.5
  }
}
```

**Note:** URLs expire after 24 hours. Files are automatically deleted after 24 hours.

#### Response (compress: true)

```json
{
  "success": true,
  "data": {
    "svgzUrl": "https://svgmaker.io/api/files/eyJ1cmwiOi...",
    "svgzUrlExpiresIn": "24h",
    "filename": "optimized-image.svgz",
    "compressedSize": 12345
  },
  "metadata": {
    "requestId": "req_6-vXlRW6lfD_",
    "creditsUsed": 0.5,
    "creditsRemaining": 99.5
  }
}
```

#### Response Fields (compress: false)

| Field | Type | Description |
|-------|------|-------------|
| `svgUrl` | string | Proxy URL to download the optimized SVG (expires after 24h) |
| `svgUrlExpiresIn` | string | URL expiration time ("24h") |

#### Response Fields (compress: true)

| Field | Type | Description |
|-------|------|-------------|
| `svgzUrl` | string | Proxy URL to download the SVGZ file (expires after 24h) |
| `svgzUrlExpiresIn` | string | URL expiration time ("24h") |
| `filename` | string | Filename of the compressed file |
| `compressedSize` | number | Size of the compressed file in bytes |

**Note:** URLs expire after 24 hours. Files are automatically deleted after 24 hours.

#### Error Responses

**No File Provided:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "status": 400,
    "message": "SVG file is required"
  },
  "metadata": {
    "requestId": "req_6-vXlRW6lfD_"
  }
}
```

**Invalid File Type:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "status": 400,
    "message": "Only SVG files are accepted"
  },
  "metadata": {
    "requestId": "req_6-vXlRW6lfD_"
  }
}
```

---

## Generations Management

### List Generations

List your own generations with pagination and filters.

**Endpoint:** `GET /v1/generations`

**Request Format:** Query parameters

**Credits:** 0 credits

#### Headers

```
x-api-key: svgmaker-io{your-api-key}
```

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `page` | number | No | 1 | Page number (1-indexed) |
| `limit` | number | No | 20 | Number of items per page (1-100) |
| `type` | string | No | - | Filter by type. Can specify multiple: `type=generate&type=edit` |
| `hashtags` | string | No | - | Filter by hashtag. Can specify multiple: `hashtags=vector&hashtags=logo` |
| `categories` | string | No | - | Filter by category. Can specify multiple: `categories=flat&categories=icon` |
| `query` | string | No | - | Search query for prompt/description |

#### Example Requests

```bash
# Basic pagination
curl -X GET "https://api.svgmaker.io/v1/generations?page=1&limit=20" \
  -H "x-api-key: svgmaker-io{your-api-key}" | jq

# Filter by type
curl -X GET "https://api.svgmaker.io/v1/generations?type=generate&limit=10" \
  -H "x-api-key: svgmaker-io{your-api-key}"

# Multiple types (OR condition)
curl -X GET "https://api.svgmaker.io/v1/generations?type=generate&type=edit" \
  -H "x-api-key: svgmaker-io{your-api-key}"

# Search by query (searches prompt/description)
curl -X GET "https://api.svgmaker.io/v1/generations?query=mountain%20landscape" \
  -H "x-api-key: svgmaker-io{your-api-key}"

# Filter by hashtags
curl -X GET "https://api.svgmaker.io/v1/generations?hashtags=vector&hashtags=logo" \
  -H "x-api-key: svgmaker-io{your-api-key}"

# Filter by categories (AND condition - all must match)
curl -X GET "https://api.svgmaker.io/v1/generations?categories=flat&categories=icon" \
  -H "x-api-key: svgmaker-io{your-api-key}"

# Combined search: query + type + hashtags
curl -X GET "https://api.svgmaker.io/v1/generations?query=minimalist&type=generate&hashtags=vector&page=1&limit=20" \
  -H "x-api-key: svgmaker-io{your-api-key}"
```

#### Response

```json
{
  "success": true,
  "data": {
    "items": [
      "eEwY0EcnHiy1c8nZKd3S",
      "abc123xyz456",
      "def789ghi012"
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "totalItems": 156,
      "totalPages": 8,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  },
  "metadata": {
    "requestId": "req_6-vXlRW6lfD_",
    "creditsUsed": 0,
    "creditsRemaining": 100.5
  }
}
```

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `items` | string[] | Array of generation IDs. Fetch individual details using GET /v1/generations/{id} |
| `pagination.page` | number | Current page number (1-indexed) |
| `pagination.limit` | number | Items per page |
| `pagination.totalItems` | number | Total number of generations |
| `pagination.totalPages` | number | Total number of pages |
| `pagination.hasNextPage` | boolean | Whether there is a next page |
| `pagination.hasPrevPage` | boolean | Whether there is a previous page |

---

### Get Generation

Get details of a single generation by ID.

**Endpoint:** `GET /v1/generations/{id}`

**Request Format:** Path parameter

**Credits:** 0 credits

#### Headers

```
x-api-key: svgmaker-io{your-api-key}
```

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Generation ID |

#### Example Request

Replace `{generation_id}` with your actual generation ID.

```bash
curl -X GET https://api.svgmaker.io/v1/generations/{generation_id} \
  -H "x-api-key: svgmaker-io{your-api-key}"
```

#### Response

```json
{
  "success": true,
  "data": {
    "id": "eEwY0EcnHiy1c8nZKd3S",
    "prompt": "A minimalist mountain landscape",
    "type": "generate",
    "quality": "high",
    "isPublic": false,
    "metadata": {
      "hashTags": ["vector", "landscape"],
      "category": ["illustration"]
    }
  },
  "metadata": {
    "requestId": "req_6-vXlRW6lfD_",
    "creditsUsed": 0,
    "creditsRemaining": 100.5
  }
}
```

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Generation ID |
| `prompt` | string | The prompt used to generate the image |
| `type` | string | Generation type: `generate`, `edit`, `convert`, or `crafted` |
| `quality` | string | Quality level: `low`, `medium`, `high`, or `manual` |
| `isPublic` | boolean | Whether the generation is public |
| `metadata.hashTags` | string[] | Array of hashtags |
| `metadata.category` | string[] | Array of categories |

#### Error Responses

**Not Found:**
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "status": 404,
    "message": "Generation not found."
  },
  "metadata": {
    "requestId": "req_6-vXlRW6lfD_"
  }
}
```

**Not Authorized:**
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "status": 403,
    "message": "Not authorized to access this generation."
  },
  "metadata": {
    "requestId": "req_6-vXlRW6lfD_"
  }
}
```

---

### Delete Generation

Delete a generation and its associated files. **Paid users only.**

**Endpoint:** `DELETE /v1/generations/{id}`

**Request Format:** Path parameter

**Credits:** 0 credits

#### Headers

```
x-api-key: svgmaker-io{your-api-key}
```

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Generation ID |

#### Example Request

Replace `{generation_id}` with your actual generation ID.

```bash
curl -X DELETE https://api.svgmaker.io/v1/generations/{generation_id} \
  -H "x-api-key: svgmaker-io{your-api-key}"
```

#### Response

```json
{
  "success": true,
  "data": {
    "message": "Generation and associated files deleted successfully"
  },
  "metadata": {
    "requestId": "req_6-vXlRW6lfD_",
    "creditsUsed": 0,
    "creditsRemaining": 100.5
  }
}
```

#### Error Responses

**Not Paid User:**
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "status": 403,
    "message": "Only paid members can delete generations."
  },
  "metadata": {
    "requestId": "req_6-vXlRW6lfD_"
  }
}
```

---

### Share Generation

Make a generation public (share it to the gallery).

**Endpoint:** `POST /v1/generations/{id}/share`

**Request Format:** Path parameter

**Credits:** 0 credits

#### Headers

```
x-api-key: svgmaker-io{your-api-key}
```

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Generation ID |

#### Example Request

Replace `{generation_id}` with your actual generation ID.

```bash
curl -X POST https://api.svgmaker.io/v1/generations/{generation_id}/share \
  -H "x-api-key: svgmaker-io{your-api-key}"
```

#### Response

```json
{
  "success": true,
  "data": {
    "message": "Generation is now public",
    "isPublic": true,
    "shareUrl": "https://svgmaker.io/share/{generation_id}"
  },
  "metadata": {
    "requestId": "req_6-vXlRW6lfD_",
    "creditsUsed": 0,
    "creditsRemaining": 100.5
  }
}
```

#### Response (Already Public)

```json
{
  "success": true,
  "data": {
    "message": "Already public",
    "isPublic": true,
    "shareUrl": "https://svgmaker.io/share/{generation_id}"
  },
  "metadata": {
    "requestId": "req_6-vXlRW6lfD_",
    "creditsUsed": 0,
    "creditsRemaining": 100.5
  }
}
```

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `message` | string | Status message indicating the result |
| `isPublic` | boolean | Whether the generation is now public |
| `shareUrl` | string | The public share URL for the generation (e.g., `https://svgmaker.io/share/{generation_id}`) |

#### Error Responses

**Not Authorized:**
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "status": 403,
    "message": "You do not have permission to share this generation."
  },
  "metadata": {
    "requestId": "req_6-vXlRW6lfD_"
  }
}
```

---

### Download Generation

Download your own generation in various formats. **Paid users only.**

**Endpoint:** `GET /v1/generations/{id}/download`

**Request Format:** Path parameter + query parameters

**Credits:** 0 credits (free for own generations)

#### Headers

```
x-api-key: svgmaker-io{your-api-key}
```

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Generation ID |

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `format` | string | No | `webp` | Output format: `svg`, `webp`, `png`, `svg-optimized`, or `svgz` |
| `optimize` | string | No | `false` | Optimize before compressing (only for `svgz` format). Pass `"true"` or `"false"` as a string. |

#### Example Request

Replace `{generation_id}` with your actual generation ID.

```bash
# Download as SVG
curl -X GET "https://api.svgmaker.io/v1/generations/{generation_id}/download?format=svg" \
  -H "x-api-key: svgmaker-io{your-api-key}"

# Download as SVGZ with optimization
curl -X GET "https://api.svgmaker.io/v1/generations/{generation_id}/download?format=svgz&optimize=true" \
  -H "x-api-key: svgmaker-io{your-api-key}"
```

#### Response

```json
{
  "success": true,
  "data": {
    "id": "eEwY0EcnHiy1c8nZKd3S",
    "url": "https://svgmaker.io/api/files/eyJ1cmwiOiJodHRwOi8v...",
    "urlExpiresIn": "24h",
    "format": "svg",
    "filename": "svgmaker-eEwY0EcnHiy1c8nZKd3S.svg"
  },
  "metadata": {
    "requestId": "req_6-vXlRW6lfD_",
    "creditsUsed": 0,
    "creditsRemaining": 100.5
  }
}
```

**Note:** URLs expire after 12 hours. Files are automatically deleted after 24 hours.

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Generation ID |
| `url` | string | Proxy URL to download the file (expires after 12h) |
| `urlExpiresIn` | string | URL expiration time (e.g., "12h") |
| `format` | string | File format requested |
| `filename` | string | Suggested filename for the downloaded file |

#### Error Responses

**Not Paid User:**
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "status": 403,
    "message": "Download feature is only available for paid users."
  },
  "metadata": {
    "requestId": "req_6-vXlRW6lfD_"
  }
}
```

**Invalid Format:**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_REQUEST",
    "status": 400,
    "message": "Invalid format. Must be one of: svg, webp, png, svg-optimized, svgz"
  },
  "metadata": {
    "requestId": "req_6-vXlRW6lfD_"
  }
}
```

---

## Gallery

### Browse Gallery

Browse the public gallery with pagination and filters.

**Endpoint:** `GET /v1/gallery`

**Request Format:** Query parameters

**Credits:** 0 credits

#### Headers

```
x-api-key: svgmaker-io{your-api-key}
```

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `page` | number | No | 1 | Page number (1-indexed) |
| `limit` | number | No | 20 | Number of items per page (1-100) |
| `type` | string | No | - | Filter by type. Can specify multiple: `type=generate&type=edit` |
| `hashtags` | string | No | - | Filter by hashtag. Can specify multiple: `hashtags=vector&hashtags=logo` |
| `categories` | string | No | - | Filter by category. Can specify multiple: `categories=flat&categories=icon` |
| `query` | string | No | - | Search query for prompt/description |
| `pro` | string | No | - | Filter for pro images. Pass `"true"` as a string. |
| `gold` | string | No | - | Filter for gold images. Pass `"true"` as a string. |

#### Example Requests

```bash
# Basic pagination
curl -X GET "https://api.svgmaker.io/v1/gallery?page=1&limit=20" \
  -H "x-api-key: svgmaker-io{your-api-key}" | jq

# Filter by type
curl -X GET "https://api.svgmaker.io/v1/gallery?type=generate&limit=10" \
  -H "x-api-key: svgmaker-io{your-api-key}"

# Multiple types (OR condition)
curl -X GET "https://api.svgmaker.io/v1/gallery?type=generate&type=edit" \
  -H "x-api-key: svgmaker-io{your-api-key}"

# Search by query (searches prompt/description)
curl -X GET "https://api.svgmaker.io/v1/gallery?query=mountain%20landscape" \
  -H "x-api-key: svgmaker-io{your-api-key}"

# Filter by hashtags
curl -X GET "https://api.svgmaker.io/v1/gallery?hashtags=vector&hashtags=logo" \
  -H "x-api-key: svgmaker-io{your-api-key}"

# Filter by categories (AND condition - all must match)
curl -X GET "https://api.svgmaker.io/v1/gallery?categories=flat&categories=icon" \
  -H "x-api-key: svgmaker-io{your-api-key}"

# Filter for pro images only
curl -X GET "https://api.svgmaker.io/v1/gallery?pro=true&limit=20" \
  -H "x-api-key: svgmaker-io{your-api-key}"

# Filter for gold images only
curl -X GET "https://api.svgmaker.io/v1/gallery?gold=true&limit=20" \
  -H "x-api-key: svgmaker-io{your-api-key}"

# Combined search: query + type + pro filter
curl -X GET "https://api.svgmaker.io/v1/gallery?query=minimalist&type=generate&pro=true&page=1&limit=20" \
  -H "x-api-key: svgmaker-io{your-api-key}"

# Combined search: gold images with specific hashtags
curl -X GET "https://api.svgmaker.io/v1/gallery?gold=true&hashtags=vector&hashtags=premium&page=1" \
  -H "x-api-key: svgmaker-io{your-api-key}"

# Complex search: pro images, specific type, query, and categories
curl -X GET "https://api.svgmaker.io/v1/gallery?pro=true&type=generate&query=landscape&categories=illustration&page=1&limit=30" \
  -H "x-api-key: svgmaker-io{your-api-key}"
```

#### Response

Same structure as List Generations endpoint (see above).

---

### Get Gallery Item

Get details of a single public gallery item by ID.

**Endpoint:** `GET /v1/gallery/{id}`

**Request Format:** Path parameter

**Credits:** 0 credits

#### Headers

```
x-api-key: svgmaker-io{your-api-key}
```

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Gallery item ID |

#### Example Request

Replace `{generation_id}` with your actual gallery item ID.

```bash
curl -X GET https://api.svgmaker.io/v1/gallery/{generation_id} \
  -H "x-api-key: svgmaker-io{your-api-key}"
```

#### Response

Same structure as Get Generation endpoint (see above).

---

### Download Gallery Item

Download a public gallery item in various formats.

**Endpoint:** `GET /v1/gallery/{id}/download`

**Request Format:** Path parameter + query parameters

**Credits:** 1 credit for SVG formats, 0 credits for WebP/PNG

#### Headers

```
x-api-key: svgmaker-io{your-api-key}
```

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Gallery item ID |

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `format` | string | No | `webp` | Output format: `svg`, `webp`, `png`, `svg-optimized`, or `svgz` |
| `optimize` | string | No | `false` | Optimize before compressing (only for `svgz` format). Pass `"true"` or `"false"` as a string. |

#### Example Request

Replace `{generation_id}` with your actual gallery item ID.

```bash
# Download as SVG
curl -X GET "https://api.svgmaker.io/v1/gallery/{generation_id}/download?format=svg" \
  -H "x-api-key: svgmaker-io{your-api-key}"

# Download as SVGZ with optimization
curl -X GET "https://api.svgmaker.io/v1/gallery/{generation_id}/download?format=svgz&optimize=true" \
  -H "x-api-key: svgmaker-io{your-api-key}"
```

#### Response

Same structure as Download Generation endpoint (see above).

#### Credit Costs

| Format | Credits |
|--------|---------|
| `svg`, `svg-optimized`, `svgz` | 1 credit |
| `webp`, `png` | 0 credits (free) |

#### Error Responses

**Pro Image - Not Paid:**
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "status": 403,
    "message": "Pro images require a paid account. Please upgrade to download."
  },
  "metadata": {
    "requestId": "req_6-vXlRW6lfD_"
  }
}
```

**Insufficient Credits (for SVG formats):**
```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_CREDITS",
    "status": 402,
    "message": "Insufficient credits. This download requires 1 credit.",
    "details": {
      "creditsRequired": 1
    }
  },
  "metadata": {
    "requestId": "req_6-vXlRW6lfD_"
  }
}
```

---

## Account Management

### Get Account Information

Get your account information including email, display name, account type, and credit balance.

**Endpoint:** `GET /v1/account`

**Request Format:** Headers only

**Credits:** 0 credits

#### Headers

```
x-api-key: svgmaker-io{your-api-key}
```

#### Example Request

```bash
curl -X GET https://api.svgmaker.io/v1/account \
  -H "x-api-key: svgmaker-io{your-api-key}" | jq
```

#### Response

```json
{
  "success": true,
  "data": {
    "email": "user@example.com",
    "displayName": "John Doe",
    "accountType": "premium",
    "credits": 150.5
  },
  "metadata": {
    "requestId": "req_6-vXlRW6lfD_",
    "creditsUsed": 0,
    "creditsRemaining": 150.5
  }
}
```

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `email` | string | User's email address |
| `displayName` | string | User's display name |
| `accountType` | string | Account type: `"free"` or `"premium"` |
| `credits` | number | Current credit balance |

#### Error Responses

**User Not Found:**
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "status": 404,
    "message": "User not found."
  },
  "metadata": {
    "requestId": "req_6-vXlRW6lfD_"
  }
}
```

---

### Get Usage Statistics

Get API usage statistics for your account. Returns all-time totals by default, or daily breakdowns for a specified period.

**Endpoint:** `GET /v1/account/usage`

**Request Format:** Query parameters (optional)

**Credits:** 0 credits

#### Headers

```
x-api-key: svgmaker-io{your-api-key}
```

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `days` | number | No | Number of days to look back (must be positive integer). Cannot be used with `start`/`end`. |
| `start` | string | No | Start date in YYYY-MM-DD format. Must be used with `end`. Cannot be used with `days`. |
| `end` | string | No | End date in YYYY-MM-DD format. Must be used with `start`. Cannot be used with `days`. |

**Note:** If no parameters are provided, returns all-time totals. If `days` or `start`/`end` are provided, returns daily breakdown for that period.

#### Example Requests

```bash
# Get all-time usage statistics
curl -X GET https://api.svgmaker.io/v1/account/usage \
  -H "x-api-key: svgmaker-io{your-api-key}" | jq

# Get usage for last 7 days
curl -X GET "https://api.svgmaker.io/v1/account/usage?days=7" \
  -H "x-api-key: svgmaker-io{your-api-key}" | jq

# Get usage for a date range
curl -X GET "https://api.svgmaker.io/v1/account/usage?start=2024-01-01&end=2024-01-31" \
  -H "x-api-key: svgmaker-io{your-api-key}" | jq
```

#### Response (All-Time)

```json
{
  "success": true,
  "data": {
    "period": {
      "type": "all"
    },
    "summary": {
      "requests": 1250,
      "creditsUsed": 3420.5,
      "successCount": 1200,
      "errorCount": 50,
      "successRate": 0.96
    },
    "byCategory": {
      "generate": {
        "requests": 500,
        "credits": 1200
      },
      "edit": {
        "requests": 300,
        "credits": 750
      },
      "convert": {
        "total": {
          "requests": 400,
          "credits": 1200
        },
        "endpoints": {
          "convert/ai-vectorize": {
            "requests": 200,
            "credits": 600
          },
          "convert/trace": {
            "requests": 150,
            "credits": 450
          },
          "convert/svg-to-vector": {
            "requests": 50,
            "credits": 150
          }
        }
      },
      "gallery": {
        "total": {
          "requests": 50,
          "credits": 270.5
        },
        "endpoints": {
          "gallery/download": {
            "requests": 50,
            "credits": 270.5
          }
        }
      }
    }
  },
  "metadata": {
    "requestId": "req_6-vXlRW6lfD_",
    "creditsUsed": 0,
    "creditsRemaining": 150.5
  }
}
```

#### Response (With Date Range)

```json
{
  "success": true,
  "data": {
    "period": {
      "type": "days",
      "days": 7,
      "from": "2024-01-24",
      "to": "2024-01-31"
    },
    "summary": {
      "requests": 150,
      "creditsUsed": 420.5,
      "successCount": 145,
      "errorCount": 5,
      "successRate": 0.967
    },
    "byCategory": {
      "generate": {
        "requests": 60,
        "credits": 150
      },
      "edit": {
        "requests": 40,
        "credits": 100
      },
      "convert": {
        "total": {
          "requests": 45,
          "credits": 135
        },
        "endpoints": {
          "convert/ai-vectorize": {
            "requests": 25,
            "credits": 75
          },
          "convert/trace": {
            "requests": 20,
            "credits": 60
          }
        }
      },
      "gallery": {
        "total": {
          "requests": 5,
          "credits": 35.5
        },
        "endpoints": {
          "gallery/download": {
            "requests": 5,
            "credits": 35.5
          }
        }
      }
    },
    "daily": [
      {
        "date": "2024-01-24",
        "requests": 20,
        "credits": 55.5
      },
      {
        "date": "2024-01-25",
        "requests": 25,
        "credits": 70
      },
      {
        "date": "2024-01-26",
        "requests": 15,
        "credits": 40
      },
      {
        "date": "2024-01-27",
        "requests": 30,
        "credits": 85
      },
      {
        "date": "2024-01-28",
        "requests": 22,
        "credits": 60
      },
      {
        "date": "2024-01-29",
        "requests": 18,
        "credits": 50
      },
      {
        "date": "2024-01-30",
        "requests": 20,
        "credits": 55
      }
    ],
    "allTime": {
      "requests": 1250,
      "creditsUsed": 3420.5
    }
  },
  "metadata": {
    "requestId": "req_6-vXlRW6lfD_",
    "creditsUsed": 0,
    "creditsRemaining": 150.5
  }
}
```

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `period.type` | string | Period type: `"all"`, `"days"`, or `"range"` |
| `period.days` | number | Number of days (only present when `type` is `"days"`) |
| `period.from` | string | Start date in YYYY-MM-DD format (only present when `type` is `"days"` or `"range"`) |
| `period.to` | string | End date in YYYY-MM-DD format (only present when `type` is `"days"` or `"range"`) |
| `summary.requests` | number | Total number of API requests |
| `summary.creditsUsed` | number | Total credits used |
| `summary.successCount` | number | Number of successful requests |
| `summary.errorCount` | number | Number of failed requests |
| `summary.successRate` | number | Success rate (0-1) |
| `byCategory` | object | Usage statistics grouped by category. Single-endpoint categories (e.g., `generate`, `edit`) have `requests` and `credits`. Multi-endpoint categories (e.g., `convert`, `gallery`) have `total` and `endpoints` objects. |
| `daily` | array | Daily breakdown (only present when date range is specified). Each item contains `date`, `requests`, and `credits`. |
| `allTime` | object | All-time totals (only present when date range is specified). Contains `requests` and `creditsUsed`. |

#### Error Responses

**Invalid Parameters:**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_REQUEST",
    "status": 400,
    "message": "Use either days or start/end, not both."
  },
  "metadata": {
    "requestId": "req_6-vXlRW6lfD_"
  }
}
```

**Invalid Date Format:**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_REQUEST",
    "status": 400,
    "message": "Invalid date. Dates must be valid and in YYYY-MM-DD format."
  },
  "metadata": {
    "requestId": "req_6-vXlRW6lfD_"
  }
}
```

**Start Date After End Date:**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_REQUEST",
    "status": 400,
    "message": "Start date must be before or equal to end date."
  },
  "metadata": {
    "requestId": "req_6-vXlRW6lfD_"
  }
}
```

---

## Error Handling

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `INVALID_API_KEY` | 401 | Invalid or missing API key |
| `INSUFFICIENT_CREDITS` | 402 | Not enough credits for the operation |
| `INVALID_REQUEST` | 400 | Invalid request parameters |
| `VALIDATION_ERROR` | 400 | Request validation failed |
| `METHOD_NOT_ALLOWED` | 405 | HTTP method not allowed for this endpoint |
| `ENDPOINT_NOT_FOUND` | 404 | Endpoint does not exist |
| `CONTENT_POLICY` | 422 | Content policy violation |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests, rate limit exceeded |
| `SERVER_ERROR` | 500 | Internal server error |
| `ENDPOINT_DISABLED` | 503 | Endpoint is currently disabled |

### Example Error Response

```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_CREDITS",
    "status": 402,
    "message": "Insufficient credits. This operation requires 3 credits.",
    "details": {
      "creditsRequired": 3
    }
  },
  "metadata": {
    "requestId": "req_6-vXlRW6lfD_"
  }
}
```

### Error Examples

#### Missing API Key

```json
{
  "success": false,
  "error": {
    "code": "INVALID_API_KEY",
    "status": 401,
    "message": "API key required. Pass x-api-key header."
  },
  "metadata": {
    "requestId": "req_6-vXlRW6lfD_"
  }
}
```

#### Invalid Request

```json
{
  "success": false,
  "error": {
    "code": "INVALID_REQUEST",
    "status": 400,
    "message": "Invalid request"
  },
  "metadata": {
    "requestId": "req_6-vXlRW6lfD_"
  }
}
```

#### Insufficient Credits

```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_CREDITS",
    "status": 402,
    "message": "Insufficient credits. This operation requires 3 credits.",
    "details": {
      "creditsRequired": 3
    }
  },
  "metadata": {
    "requestId": "req_6-vXlRW6lfD_"
  }
}
```

#### Validation Error

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "status": 400,
    "message": "Quality must be one of: low, medium, high, manual."
  },
  "metadata": {
    "requestId": "req_6-vXlRW6lfD_"
  }
}
```

#### Model Validation Errors

**Model and Quality Both Specified:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "status": 400,
    "message": "Cannot specify both 'model' and 'quality'. Use 'model' for specific model selection or 'quality' for auto mode."
  },
  "metadata": {
    "requestId": "req_6-vXlRW6lfD_"
  }
}
```

**Unknown Model:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "status": 400,
    "message": "Unknown model: \"nonexistent-model\"."
  },
  "metadata": {
    "requestId": "req_6-vXlRW6lfD_"
  }
}
```

**Pro Model Without Paid Account:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "status": 403,
    "message": "Pro models require upgrade: imagen-4-ultra"
  },
  "metadata": {
    "requestId": "req_6-vXlRW6lfD_"
  }
}
```

---

## Rate Limiting

All API endpoints are rate limited to prevent abuse and ensure fair usage. Rate limits are applied per API key.

### Rate Limit Headers

All responses include rate limit information in the headers:

| Header | Description |
|--------|-------------|
| `x-ratelimit-limit-requests` | Maximum number of requests allowed in the current window |
| `x-ratelimit-remaining-requests` | Number of requests remaining in the current window |
| `x-ratelimit-reset-requests` | Unix timestamp (in seconds) when the rate limit window resets |

### Rate Limits by Endpoint

#### Computation Endpoints (Credits > 0)

| Endpoint | Limit | Window |
|----------|-------|--------|
| `/v1/generate` | 3 requests | 60 seconds |
| `/v1/edit` | 3 requests | 60 seconds |
| `/v1/convert/ai-vectorize` | 5 requests | 60 seconds |
| `/v1/convert/trace` | 5 requests | 60 seconds |
| `/v1/convert/svg-to-vector` | 5 requests | 60 seconds |
| `/v1/convert/raster-to-raster` | 5 requests | 60 seconds |
| `/v1/convert/batch` | 5 requests | 60 seconds |
| `/v1/enhance-prompt` | 10 requests | 60 seconds |
| `/v1/svg/optimize` | 10 requests | 60 seconds |
| `/v1/gallery/{id}/download` | 5 requests | 60 seconds |

#### Free Endpoints (Credits = 0)

| Endpoint | Limit | Window |
|----------|-------|--------|
| `/v1/generations` | 1000 requests | 60 seconds |
| `/v1/generations/{id}` | 1000 requests | 60 seconds |
| `/v1/generations/{id}/delete` | 100 requests | 60 seconds |
| `/v1/generations/{id}/share` | 100 requests | 60 seconds |
| `/v1/generations/{id}/download` | 100 requests | 60 seconds |
| `/v1/gallery` | 1000 requests | 60 seconds |
| `/v1/gallery/{id}` | 1000 requests | 60 seconds |
| `/v1/account` | 1000 requests | 60 seconds |
| `/v1/account/usage` | 1000 requests | 60 seconds |

### Rate Limit Exceeded Response

When you exceed the rate limit, you'll receive a `429 Too Many Requests` response:

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "status": 429,
    "message": "Rate limit exceeded for image generation."
  },
  "metadata": {
    "requestId": "req_1706123456789"
  }
}
```

The response will also include rate limit headers:

```
x-ratelimit-limit-requests: 3
x-ratelimit-remaining-requests: 0
x-ratelimit-reset-requests: 1706123520
```

### Best Practices

1. **Monitor headers**: Check the `x-ratelimit-remaining-requests` header to know how many requests you have left
2. **Implement backoff**: When you receive a 429 response, wait until the `x-ratelimit-reset-requests` timestamp before retrying
3. **Batch operations**: Use `/v1/convert/batch` to process multiple files in a single request instead of making many individual requests
4. **Cache responses**: Cache generation details and gallery items to reduce redundant API calls

---

## Changelog

### v1.0.0
- Initial release of v1 API
- Generate and Edit endpoints
- Storage control parameter
- Streaming support
- Base64 PNG and SVG text output options
- Rate limiting for all v1 API endpoints
