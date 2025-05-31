# SVGMaker API Documentation

This documentation covers the three main API endpoints for SVG generation, editing, and conversion using API keys.

## Authentication

All API endpoints require authentication via an API key passed in the `x-api-key` header.

```http
x-api-key: svgmaker-io{your-api-key}
```

## Base URL

```
https://svgmaker.io/api
```

## Credit System

All operations consume credits from your account:

- **Convert**: 1 credit
- **Generate (Low)**: 1 credit  
- **Generate (Medium)**: 2 credits
- **Generate (High)**: 4 credits
- **Edit**: 3 credits

## Common Response Format

All endpoints return responses in the following format:

### Success Response
```json
{
  "svgUrl": "string",
  "creditCost": "number",
  "originalImageUrl": "string", // Only for edit/convert
  "base64Png": "string", // Only for generate/edit
  "prompt": "string", // Only when provided
  "quality": "string", // Only when applicable
  "revisedPrompt": "string" // Only for generate/edit
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
  "aspectRatio": "auto|portrait|landscape|square|wide|tall", // Optional: Default "auto"
  "background": "auto|transparent|opaque", // Optional: Default "auto"
  "stream": "boolean", // Optional: Enable streaming response
  
  // Style Parameters (Optional)
  "style": "string", // Art style (e.g., "minimalist", "cartoon", "realistic")
  "color_mode": "string", // Color scheme (e.g., "monochrome", "full-color", "2-colors")
  "image_complexity": "string", // Complexity level (e.g., "simple", "detailed")
  "category": "string", // Category (e.g., "icon", "illustration", "pattern")
  "composition": "string", // Layout (e.g., "center-object", "full-scene")
  "advanced": {
    "stroke_weight": "thin|medium|thick",
    "corner_style": "none|rounded|sharp",
    "shadow_effect": "none|soft|hard"
  }
}
```

### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `prompt` | string | Yes | - | Text description of the SVG to generate |
| `quality` | string | No | "medium" | Generation quality: "low", "medium", "high" |
| `aspectRatio` | string | No | "auto" | Aspect ratio: "auto", "portrait", "landscape", "square", "wide", "tall" |
| `background` | string | No | "auto" | Background type: "auto", "transparent", "opaque" |
| `stream` | boolean | No | false | Enable streaming response for real-time updates |
| `style` | string | No | - | Art style preference |
| `color_mode` | string | No | - | Color scheme preference |
| `image_complexity` | string | No | - | Complexity level |
| `category` | string | No | - | Content category |
| `composition` | string | No | - | Layout composition |
| `advanced` | object | No | - | Advanced styling parameters |

### Example Request

```bash
curl -X POST https://svgmaker.io/api/generate \
  -H "Content-Type: application/json" \
  -H "x-api-key: svgmaker-io{your-api-key}" \
  -d '{
    "prompt": "A minimalist mountain landscape with geometric shapes",
    "quality": "high",
    "aspectRatio": "landscape",
    "background": "transparent",
    "style": "minimalist",
    "color_mode": "monochrome",
    "composition": "center-object"
  }'
```

### Example Response

```json
{
  "svgUrl": "https://storage.googleapis.com/your-bucket/generated-svg.svg",
  "creditCost": 4,
  "base64Png": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
  "prompt": "A minimalist mountain landscape with geometric shapes",
  "quality": "high",
  "revisedPrompt": "A minimalist mountain landscape featuring clean geometric mountain shapes..."
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
| `prompt` | string/JSON | Yes | Edit instructions or JSON with style parameters |
| `quality` | string | No | Quality level: "low", "medium", "high" (default: "medium") |
| `aspectRatio` | string | No | Aspect ratio: "auto", "portrait", "landscape", "square", "wide", "tall" (default: "auto") |
| `background` | string | No | Background: "auto", "transparent", "opaque" (default: "auto") |
| `mask` | File | No | Optional mask file for targeted editing |
| `stream` | boolean | No | Enable streaming response (default: false) |

### Prompt Parameter Options

#### Simple String Prompt
```
"Add a red border around the image"
```

#### JSON Prompt with Style Parameters
```json
{
  "prompt": "Change the colors to be more vibrant",
  "style": "cartoon",
  "color_mode": "full-color",
  "advanced": {
    "stroke_weight": "thick"
  }
}
```

### Example Request

```bash
curl -X POST https://svgmaker.io/api/edit \
  -H "x-api-key: svgmaker-io{your-api-key}" \
  -F "image=@input-image.png" \
  -F "prompt=Add a golden frame around this image" \
  -F "quality=high" \
  -F "aspectRatio=square" \
  -F "background=transparent"
```

### Example Request with Style Parameters

```bash
curl -X POST https://svgmaker.io/api/edit \
  -H "x-api-key: svgmaker-io{your-api-key}" \
  -F "image=@input-image.svg" \
  -F 'prompt={"prompt":"Make this more cartoonish","style":"cartoon","color_mode":"3-colors"}' \
  -F "quality=medium"
```

### Example Response

```json
{
  "svgUrl": "https://storage.googleapis.com/your-bucket/edited-svg.svg",
  "originalImageUrl": "https://storage.googleapis.com/your-bucket/original-image.png",
  "creditCost": 3,
  "base64Png": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
  "prompt": "Add a golden frame around this image",
  "quality": "high"
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

### Supported Formats

- **Input**: PNG, JPEG, WebP, HEIC, GIF, BMP, TIFF
- **Output**: SVG (Scalable Vector Graphics)
- **Max File Size**: 25MB

### Example Request

```bash
curl -X POST https://svgmaker.io/api/convert \
  -H "x-api-key: svgmaker-io{your-api-key}" \
  -F "file=@image-to-convert.png" \
  -F "stream=false"
```

### Example Response

```json
{
  "svgUrl": "https://storage.googleapis.com/bucket-name/converted-svg.svg",
  "originalImageUrl": "https://storage.googleapis.com/bucket-name/original-image.png",
  "creditCost": 1,
  "quality": "medium"
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
- `minimalist` - Clean, simple designs
- `cartoon` - Cartoon-style illustrations
- `realistic` - Photorealistic style
- `abstract` - Abstract art style
- `flat` - Flat design style
- `isometric` - Isometric perspective

### Color Modes
- `monochrome` - Single color
- `2-colors` - Two-color palette
- `3-colors` - Three-color palette
- `full-color` - Full color spectrum

### Image Complexity
- `simple` - Basic shapes and elements
- `detailed` - Complex, detailed imagery

### Categories
- `icon` - Icon-style graphics
- `illustration` - Detailed illustrations
- `pattern` - Repeating patterns
- `logo` - Logo designs
- `scene` - Complete scenes

### Composition
- `center-object` - Centered single object
- `full-scene` - Complete scene composition

### Advanced Parameters

#### Stroke Weight
- `thin` - Thin line weights
- `medium` - Medium line weights  
- `thick` - Thick line weights

#### Corner Style
- `none` - No special corner treatment
- `rounded` - Rounded corners
- `sharp` - Sharp, angular corners

#### Shadow Effect
- `none` - No shadows
- `soft` - Soft shadow effects
- `hard` - Hard shadow effects

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
    this.baseUrl = 'https://svgmaker.io/api';
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
    
    Object.entries(options).forEach(([key, value]) => {
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

  async convert(imagePath) {
    const formData = new FormData();
    formData.append('file', fs.createReadStream(imagePath));

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
  style: 'minimalist'
});

// Edit image
const editResult = await api.edit(
  './input.png',
  'Add a red border',
  { quality: 'medium', aspectRatio: 'square' }
);

// Convert image
const convertResult = await api.convert('./image.jpg');
```

### Python

```python
import requests
import json

class SVGMakerAPI:
    def __init__(self, api_key):
        self.api_key = api_key
        self.base_url = 'https://svgmaker.io/api'
        
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
    
    def convert(self, image_path):
        with open(image_path, 'rb') as f:
            files = {'file': f}
            response = requests.post(
                f'{self.base_url}/convert',
                headers=self._headers(),
                files=files
            )
        return response.json()

# Usage
api = SVGMakerAPI('svgmaker-io{your-api-key}')

# Generate SVG
result = api.generate({
    'prompt': 'A geometric mountain landscape',
    'quality': 'high',
    'style': 'minimalist'
})

# Edit image
edit_result = api.edit(
    './input.png',
    'Add a red border',
    quality='medium',
    aspectRatio='square'
)

# Convert image
convert_result = api.convert('./image.jpg')
```

---

## Support

For API support and questions:
- Documentation: [docs link]
- Support Email: support@svgmaker.io
- Discord Community: [discord link]

---

*Last updated: [Current Date]*
