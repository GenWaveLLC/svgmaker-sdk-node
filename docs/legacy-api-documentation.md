# SVGMaker API Documentation (Legacy)

> **This document covers the legacy (pre-v1) API.** For the current v1 API, see [v1-api-documentation.md](v1-api-documentation.md).

This documentation covers the three main API endpoints for SVG generation, editing, and conversion using API keys.

## Authentication

All API endpoints require authentication via an API key passed in the `x-api-key` header.

```http
x-api-key: svgmaker-io{your-api-key}
```

## Base URL

```
https://api.svgmaker.io
```

## Credit System

All operations consume credits from your account:

- **Convert**: 1 credit
- **Generate (Low)**: 1 credit
- **Generate (Medium)**: 2 credits
- **Generate (High)**: 3 credits
- **Edit (Low)**: 2 credits
- **Edit (Medium)**: 3 credits
- **Edit (High)**: 5 credits

## Common Response Format

All endpoints return responses in the following format:

### Success Response
```json
{
  "svgUrl": "string",
  "generationId": "string",
  "creditCost": "number",
  "base64Png": "string", // Only when base64Png=true for generate/edit
  "svgText": "string", // Only when svgText=true
  "prompt": "string", // Only when provided
  "quality": "string", // Only when applicable
  "message": "string" // Success message, typically "Files stored to cloud successfully"
}
```

### Error Response
```json
{
  "error": "string",
  "details": "string"
}
```

### Streaming Response (when `stream=true`)
```json
{"status": "processing", "message": "Received prompt..."}
{"status": "processing", "message": "Generating image..."}
{"status": "complete", "svgUrl": "https://...", "simulationMode": false}
```

---

## 1. Generate SVG (`/api/generate`)

Generate SVG from text prompts using AI.

### Method: `POST`

### Headers
```http
Content-Type: application/json
x-api-key: svgmaker-io{your-api-key}
```

### Request Body

```json
{
  "prompt": "string", // Required: Description of the SVG to generate
  "quality": "low|medium|high", // Optional: Default "medium"
  "aspectRatio": "auto|portrait|landscape|square", // Optional: Default "auto"
  "background": "auto|transparent|opaque", // Optional: Default "auto"
  "stream": "boolean", // Optional: Enable streaming response
  "base64Png": "boolean", // Optional: Include base64 PNG in response (default: false)
  "svgText": "boolean", // Optional: Include SVG source code in response (default: false)

  // Style Parameters as separate JSON object (Optional)
  "styleParams": {
    "style": "string", // Art style (e.g., "Flat", "Line Art", "Cartoon / Playful", "Ghibli")
    "color_mode": "string", // Color scheme (e.g., "Full Color", "Monochrome", "Few Colors")
    "image_complexity": "string", // Complexity level (e.g., "Icon", "Illustration", "Scene")
    "text": "string", // Text options (e.g., "No Text", "Only Title", "Embedded Text")
    "composition": "string" // Layout (e.g., "Centered object", "Full scene", "Repeating pattern / tile")
  }
}
```

### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `prompt` | string | Yes | - | Text description of the SVG to generate |
| `quality` | string | No | "medium" | Generation quality: "low", "medium", "high" |
| `aspectRatio` | string | No | "auto" | Aspect ratio: "auto", "portrait", "landscape", "square" |
| `background` | string | No | "auto" | Background type: "auto", "transparent", "opaque" |
| `stream` | boolean | No | false | Enable streaming response for real-time updates |
| `base64Png` | boolean | No | false | Include base64-encoded PNG preview in response |
| `svgText` | boolean | No | false | Include SVG source code as text in response |
| `styleParams` | object | No | {} | Style parameters object containing style, color_mode, image_complexity, text, and composition |

### Premium Features (Free vs Paid Users)

Both free and paid users have access to all quality levels (`'low'`, `'medium'`, `'high'`), aspect ratios (`'auto'`, `'portrait'`, `'landscape'`, `'square'`), and backgrounds (`'auto'`, `'transparent'`, `'opaque'`).

**The main difference:**
- **Free Users**: Use standard AI generation mode
- **Paid Users**: Use premium AI generation mode with enhanced quality and better results

### Example Request

```bash
curl -X POST https://api.svgmaker.io/generate \
  -H "Content-Type: application/json" \
  -H "x-api-key: svgmaker-io{your-api-key}" \
  -d '{
    "prompt": "A minimalist mountain landscape with geometric shapes",
    "quality": "high",
    "aspectRatio": "landscape",
    "background": "transparent",
    "base64Png": true,
    "svgText": true,
    "styleParams": {
      "style": "flat",
      "color_mode": "monochrome",
      "composition": "centered_object"
    }
  }'
```

### Example Response

```json
{
  "svgUrl": "https://storage.googleapis.com/your-bucket/generated-svg.svg",
  "generationId": "gen_abc123xyz",
  "creditCost": 3,
  "base64Png": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
  "svgText": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 1024 1024\">...</svg>",
  "prompt": "A minimalist mountain landscape with geometric shapes",
  "quality": "high",
  "message": "Files stored to cloud successfully"
}
```

---

## 2. Edit SVG/Image (`/api/edit`)

Edit existing images or SVGs using AI-powered modifications.

### Method: `POST`

### Headers
```http
Content-Type: multipart/form-data
x-api-key: svgmaker-io{your-api-key}
```

### Request Body (Form Data)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `image` | File | Yes | Image file to edit (PNG, JPEG, WebP, SVG) |
| `prompt` | string | Yes | Edit instructions as a simple text string |
| `styleParams` | string | No | JSON string containing style parameters |
| `quality` | string | No | Quality level: "low", "medium", "high" (default: "medium") |
| `aspectRatio` | string | No | Aspect ratio: "auto", "portrait", "landscape", "square" (default: "auto") |
| `background` | string | No | Background: "auto", "transparent", "opaque" (default: "auto") |
| `stream` | boolean | No | Enable streaming response (default: false) |
| `base64Png` | boolean | No | Include base64-encoded PNG preview in response (default: false) |
| `svgText` | boolean | No | Include SVG source code as text in response (default: false) |

### Premium Features (Free vs Paid Users)

Both free and paid users have access to all quality levels (`'low'`, `'medium'`, `'high'`), aspect ratios (`'auto'`, `'portrait'`, `'landscape'`, `'square'`), and backgrounds (`'auto'`, `'transparent'`, `'opaque'`).

**The main difference:**
- **Free Users**: Use standard AI editing mode
- **Paid Users**: Use premium AI editing mode with enhanced quality and better results

### Example Request

```bash
curl -X POST https://api.svgmaker.io/edit \
  -H "x-api-key: svgmaker-io{your-api-key}" \
  -F "image=@input-image.png" \
  -F "prompt=Add a golden frame around this image" \
  -F "quality=high" \
  -F "aspectRatio=square" \
  -F "background=transparent" \
  -F "base64Png=true" \
  -F "svgText=true"
```

### Example Request with Style Parameters

```bash
curl -X POST https://api.svgmaker.io/edit \
  -H "x-api-key: svgmaker-io{your-api-key}" \
  -F "image=@input-image.svg" \
  -F "prompt=Make this more cartoonish" \
  -F 'styleParams={"style":"cartoon","color_mode":"few_colors"}' \
  -F "quality=medium"
```

### Example Response

```json
{
  "svgUrl": "https://storage.googleapis.com/your-bucket/edited-svg.svg",
  "generationId": "gen_def456uvw",
  "creditCost": 3,
  "base64Png": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
  "svgText": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 1024 1024\">...</svg>",
  "prompt": "Add a golden frame around this image",
  "quality": "high",
  "message": "Files stored to cloud successfully"
}
```

---

## 3. Convert Image to SVG (`/api/convert`)

Convert raster images (PNG, JPEG, etc.) to SVG format.

### Method: `POST`

### Headers
```http
Content-Type: multipart/form-data
x-api-key: svgmaker-io{your-api-key}
```

### Request Body (Form Data)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `file` | File | Yes | Image file to convert (PNG, JPEG, WebP, etc.) |
| `stream` | boolean | No | Enable streaming response (default: false) |
| `svgText` | boolean | No | Include SVG source code as text in response (default: false) |

### Supported Formats

- **Input**: PNG, JPEG, WebP, HEIC, GIF, BMP, TIFF
- **Output**: SVG (Scalable Vector Graphics)
- **Max File Size**: 25MB

### Example Request

```bash
curl -X POST https://api.svgmaker.io/convert \
  -H "x-api-key: svgmaker-io{your-api-key}" \
  -F "file=@image-to-convert.png" \
  -F "stream=false" \
  -F "svgText=true"
```

### Example Response

```json
{
  "svgUrl": "https://storage.googleapis.com/bucket-name/converted-svg.svg",
  "generationId": "gen_ghi789rst",
  "creditCost": 1,
  "quality": "medium",
  "svgText": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 1024 1024\">...</svg>",
  "message": "Files stored to cloud successfully"
}
```

---

## Error Codes

| Status Code | Description |
|-------------|-------------|
| `200` | Success |
| `400` | Bad Request - Invalid parameters |
| `401` | Unauthorized - Invalid or missing API key |
| `402` | Payment Required - Insufficient credits |
| `413` | Payload Too Large - File size exceeds limit |
| `500` | Internal Server Error |

## Common Error Examples

### Insufficient Credits
```json
{
  "error": "Insufficient credits",
  "creditsRequired": 4
}
```

### Content Safety Rejection
```json
{
  "error": "Content that is not allowed by our safety system",
  "errorType": "content_safety"
}
```

### File Too Large
```json
{
  "error": "File size exceeds 25 MB limit"
}
```

### Invalid File Format (Convert)
```json
{
  "error": "SVG files are already in vector format and do not need conversion"
}
```

---

## Rate Limits

- API calls are subject to rate limiting based on your account tier
- Free accounts: 10 requests per minute
- Paid accounts: 100 requests per minute

---

## Streaming Responses

When `stream=true` is set, responses are sent as Server-Sent Events (SSE):

```
Content-Type: text/event-stream
```
## Response Format Options

### Base64 PNG Output (`base64Png`)

When `base64Png=true` is included in requests to [`/api/generate`](docs/api-documentation.md:63) or [`/api/edit`](docs/api-documentation.md:147), the response will include a `base64Png` field containing a base64-encoded PNG preview of the generated SVG.

**Use Cases:**
- Immediate preview without additional HTTP requests
- Client-side image display before downloading the SVG
- Thumbnail generation for galleries
- Email embedding or offline usage

**Example:**
```json
{
  "svgUrl": "https://storage.googleapis.com/bucket/file.svg",
  "generationId": "gen_abc123xyz",
  "base64Png": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
}
```

### SVG Source Code Output (`svgText`)

When `svgText=true` is included in requests to any endpoint, the response will include a `svgText` field containing the raw SVG source code.

**Use Cases:**
- Direct SVG manipulation and editing
- Inline SVG embedding in HTML
- SVG analysis and processing
- Client-side SVG modifications
- Reduced HTTP requests for immediate SVG access

**Example:**
```json
{
  "svgUrl": "https://storage.googleapis.com/bucket/file.svg",
  "generationId": "gen_abc123xyz",
  "svgText": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 1024 1024\"><path d=\"M100,100 L200,200\" fill=\"blue\"/></svg>"
}
```

**Note:** The [`/api/convert`](docs/api-documentation.md:227) endpoint does not support `base64Png` since it converts PNG/raster images to SVG format.

### Stream Event Types

```json
{"status": "processing", "message": "Received request..."}
{"status": "processing", "message": "Generating image..."}
{"status": "processing", "message": "Processing SVG paths..."}
{"status": "complete", "svgUrl": "https://...", "simulationMode": false}
```

### Error in Stream
```json
{"status": "error", "error": "Error message", "errorType": "general_error"}
```

---

## Style Parameters Reference

### Style Options
- `flat` - Flat design style
- `line_art` - Outline/line art style
- `engraving` - Engraving style
- `linocut` - Linocut print style
- `silhouette` - Silhouette style
- `isometric` - Isometric perspective
- `cartoon` - Cartoon-style illustrations
- `ghibli` - Studio Ghibli inspired style

### Color Modes
- `full_color` - Full color spectrum
- `monochrome` - Single color
- `few_colors` - Limited color palette (2-3 colors)

### Image Complexity
- `icon` - Simple icon-style graphics
- `illustration` - Detailed illustrations
- `scene` - Complete scenes with multiple elements

### Text Options
- `no_text` - No text in the image
- `only_title` - Only title text included
- `embedded_text` - Text embedded within the design

### Composition
- `centered_object` - Single object centered in the frame
- `repeating_pattern` - Tileable repeating pattern
- `full_scene` - Complete scene composition
- `objects_in_grid` - Multiple objects arranged in a grid layout

---

## SDK Examples

### JavaScript/Node.js

```javascript
const fetch = require('node-fetch');
const FormData = require('form-data');
const fs = require('fs');

class SVGMakerAPI {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://api.svgmaker.io';
  }

  async generate(params) {
    const response = await fetch(`${this.baseUrl}/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey
      },
      body: JSON.stringify(params)
    });
    return response.json();
  }

  async edit(imagePath, prompt, options = {}) {
    const formData = new FormData();
    formData.append('image', fs.createReadStream(imagePath));
    formData.append('prompt', prompt);
    
    // Handle styleParams separately
    const { styleParams, ...otherOptions } = options;
    if (styleParams) {
      formData.append('styleParams', JSON.stringify(styleParams));
    }
    
    Object.entries(otherOptions).forEach(([key, value]) => {
      formData.append(key, value);
    });

    const response = await fetch(`${this.baseUrl}/edit`, {
      method: 'POST',
      headers: {
        'x-api-key': this.apiKey
      },
      body: formData
    });
    return response.json();
  }

  async convert(imagePath, options = {}) {
    const formData = new FormData();
    formData.append('file', fs.createReadStream(imagePath));
    
    Object.entries(options).forEach(([key, value]) => {
      formData.append(key, value);
    });

    const response = await fetch(`${this.baseUrl}/convert`, {
      method: 'POST',
      headers: {
        'x-api-key': this.apiKey
      },
      body: formData
    });
    return response.json();
  }
}

// Usage
const api = new SVGMakerAPI('svgmaker-io{your-api-key}');

// Generate SVG
const result = await api.generate({
  prompt: 'A geometric mountain landscape',
  quality: 'high',
  styleParams: {
    style: 'flat',
    color_mode: 'monochrome'
  },
  base64Png: true,
  svgText: true
});

// Edit image
const editResult = await api.edit(
  './input.png',
  'Add a red border',
  { quality: 'medium', aspectRatio: 'square', base64Png: true, svgText: true }
);

// Convert image
const convertResult = await api.convert('./image.jpg', { svgText: true });
```

### Python

```python
import requests
import json

class SVGMakerAPI:
    def __init__(self, api_key):
        self.api_key = api_key
        self.base_url = 'https://api.svgmaker.io'
        
    def _headers(self):
        return {'x-api-key': self.api_key}
    
    def generate(self, params):
        response = requests.post(
            f'{self.base_url}/generate',
            headers={**self._headers(), 'Content-Type': 'application/json'},
            json=params
        )
        return response.json()
    
    def edit(self, image_path, prompt, **options):
        with open(image_path, 'rb') as f:
            files = {'image': f}
            data = {'prompt': prompt, **options}
            response = requests.post(
                f'{self.base_url}/edit',
                headers=self._headers(),
                files=files,
                data=data
            )
        return response.json()
    
    def convert(self, image_path, **options):
        with open(image_path, 'rb') as f:
            files = {'file': f}
            data = options
            response = requests.post(
                f'{self.base_url}/convert',
                headers=self._headers(),
                files=files,
                data=data
            )
        return response.json()

# Usage
api = SVGMakerAPI('svgmaker-io{your-api-key}')

# Generate SVG
result = api.generate({
    'prompt': 'A geometric mountain landscape',
    'quality': 'high',
    'styleParams': {
        'style': 'flat',
        'color_mode': 'monochrome'
    },
    'base64Png': True,
    'svgText': True
})

# Edit image
edit_result = api.edit(
    './input.png',
    'Add a red border',
    quality='medium',
    aspectRatio='square',
    base64Png=True,
    svgText=True
)

# Convert image
convert_result = api.convert('./image.jpg', svgText=True)
```

---

## Support

For API support and questions:
- Documentation: [docs link]
- Support Email: support@svgmaker.io
- Discord Community: [discord link]

---

*Last updated: May 31, 2025*
