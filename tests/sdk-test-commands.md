# SDK Test Commands

Base URL: `http://localhost:3000/api`
API Key: `svgmaker-ioa7eda109690877e6`

> Run `npm run build` first before testing.
> Edit and Convert tests need a test image at `tests/test-images/test-image.png`

---

## Generate

### 1. With model (no quality)
```bash
node -e "
const { SVGMakerClient } = require('./dist/cjs/index.js');
const client = new SVGMakerClient('svgmaker-ioa7eda109690877e6', { baseUrl: 'http://localhost:3000/api', timeout: 300000 });
client.generate.configure({ prompt: 'A minimalist mountain landscape', model: 'gpt-image-1-mini' }).execute().then(r => { console.log('SVG URL:', r.svgUrl); console.log('Credits:', r.creditCost); console.log('Message:', r.message); console.log('Metadata:', r.metadata); console.log('Generation ID:', r.generationId); }).catch(e => console.error('ERROR:', e.message));
"
```

### 2. With quality (no model)
```bash
node -e "
const { SVGMakerClient } = require('./dist/cjs/index.js');
const client = new SVGMakerClient('svgmaker-ioa7eda109690877e6', { baseUrl: 'http://localhost:3000/api', timeout: 300000 });
client.generate.configure({ prompt: 'A red sports car', quality: 'high' }).execute().then(r => { console.log('SVG URL:', r.svgUrl); console.log('Credits:', r.creditCost); console.log('Message:', r.message); console.log('Metadata:', r.metadata); console.log('Generation ID:', r.generationId); }).catch(e => console.error('ERROR:', e.message));
"
```

### 3. With BOTH model and quality (should fail validation)
```bash
node -e "
const { SVGMakerClient } = require('./dist/cjs/index.js');
const client = new SVGMakerClient('svgmaker-ioa7eda109690877e6', { baseUrl: 'http://localhost:3000/api', timeout: 300000 });
client.generate.configure({ prompt: 'A cat on a fence', quality: 'high', model: 'gpt-image-1-mini' }).execute().then(r => { console.log('UNEXPECTED SUCCESS - should have failed'); }).catch(e => console.log('EXPECTED ERROR:', e.message));
"
```

### 4. With storage: false
```bash
node -e "
const { SVGMakerClient } = require('./dist/cjs/index.js');
const client = new SVGMakerClient('svgmaker-ioa7eda109690877e6', { baseUrl: 'http://localhost:3000/api', timeout: 300000 });
client.generate.configure({ prompt: 'A simple house icon', quality: 'low', storage: false }).execute().then(r => { console.log('SVG URL:', r.svgUrl); console.log('Credits:', r.creditCost); console.log('Generation ID:', r.generationId); console.log('URL expires in:', r.svgUrlExpiresIn); console.log('Metadata:', r.metadata); }).catch(e => console.error('ERROR:', e.message));
"
```

### 5. With storage: true
```bash
node -e "
const { SVGMakerClient } = require('./dist/cjs/index.js');
const client = new SVGMakerClient('svgmaker-ioa7eda109690877e6', { baseUrl: 'http://localhost:3000/api', timeout: 300000 });
client.generate.configure({ prompt: 'A golden trophy', quality: 'medium', storage: true }).execute().then(r => { console.log('SVG URL:', r.svgUrl); console.log('Credits:', r.creditCost); console.log('Generation ID:', r.generationId); console.log('URL expires in:', r.svgUrlExpiresIn); console.log('Message:', r.message); console.log('Metadata:', r.metadata); }).catch(e => console.error('ERROR:', e.message));
"
```

### 6. With stream
```bash
node -e "
const { SVGMakerClient } = require('./dist/cjs/index.js');
const client = new SVGMakerClient('svgmaker-ioa7eda109690877e6', { baseUrl: 'http://localhost:3000/api', timeout: 300000 });
const stream = client.generate.configure({ prompt: 'A rocket launching into space', quality: 'low' }).stream();
stream.on('data', (e) => { console.log('Event:', e.status, e.message || ''); if (e.status === 'complete') { console.log('SVG URL:', e.svgUrl); console.log('Credits:', e.creditCost); console.log('Generation ID:', e.generationId); } });
stream.on('end', () => console.log('Stream ended'));
stream.on('error', (e) => console.error('ERROR:', e.message));
"
```

### 7. With styleParams + aspectRatio + background
```bash
node -e "
const { SVGMakerClient } = require('./dist/cjs/index.js');
const client = new SVGMakerClient('svgmaker-ioa7eda109690877e6', { baseUrl: 'http://localhost:3000/api', timeout: 300000 });
client.generate.configure({ prompt: 'A forest with tall trees and a river', quality: 'low', aspectRatio: 'landscape', background: 'transparent', styleParams: { style: 'flat', color_mode: 'few_colors', image_complexity: 'scene', composition: 'full_scene' } }).execute().then(r => { console.log('SVG URL:', r.svgUrl); console.log('Credits:', r.creditCost); console.log('Message:', r.message); console.log('Metadata:', r.metadata); }).catch(e => console.error('ERROR:', e.message));
"
```

---

## Edit

### 8. With model (no quality)
```bash
node -e "
const { SVGMakerClient } = require('./dist/cjs/index.js');
const client = new SVGMakerClient('svgmaker-ioa7eda109690877e6', { baseUrl: 'http://localhost:3000/api', timeout: 300000 });
client.edit.configure({ image: 'tests/test-images/test-image.png', prompt: 'Add a golden frame around this image', model: 'gpt-image-1-mini' }).execute().then(r => { console.log('SVG URL:', r.svgUrl); console.log('Credits:', r.creditCost); console.log('Message:', r.message); console.log('Metadata:', r.metadata); console.log('Generation ID:', r.generationId); }).catch(e => console.error('ERROR:', e.message));
"
```

### 9. With quality (no model)
```bash
node -e "
const { SVGMakerClient } = require('./dist/cjs/index.js');
const client = new SVGMakerClient('svgmaker-ioa7eda109690877e6', { baseUrl: 'http://localhost:3000/api', timeout: 300000 });
client.edit.configure({ image: 'tests/test-images/test-image.png', prompt: 'Make the background blue', quality: 'low' }).execute().then(r => { console.log('SVG URL:', r.svgUrl); console.log('Credits:', r.creditCost); console.log('Message:', r.message); console.log('Metadata:', r.metadata); }).catch(e => console.error('ERROR:', e.message));
"
```

### 10. With BOTH model and quality (should fail validation)
```bash
node -e "
const { SVGMakerClient } = require('./dist/cjs/index.js');
const client = new SVGMakerClient('svgmaker-ioa7eda109690877e6', { baseUrl: 'http://localhost:3000/api', timeout: 300000 });
client.edit.configure({ image: 'tests/test-images/test-image.png', prompt: 'Add stars', quality: 'high', model: 'gpt-image-1-mini' }).execute().then(r => { console.log('UNEXPECTED SUCCESS - should have failed'); }).catch(e => console.log('EXPECTED ERROR:', e.message));
"
```

### 11. With storage: false
```bash
node -e "
const { SVGMakerClient } = require('./dist/cjs/index.js');
const client = new SVGMakerClient('svgmaker-ioa7eda109690877e6', { baseUrl: 'http://localhost:3000/api', timeout: 300000 });
client.edit.configure({ image: 'tests/test-images/test-image.png', prompt: 'Convert to silhouette style', quality: 'low', storage: false }).execute().then(r => { console.log('SVG URL:', r.svgUrl); console.log('Credits:', r.creditCost); console.log('Generation ID:', r.generationId); console.log('URL expires in:', r.svgUrlExpiresIn); console.log('Metadata:', r.metadata); }).catch(e => console.error('ERROR:', e.message));
"
```

### 12. With storage: true
```bash
node -e "
const { SVGMakerClient } = require('./dist/cjs/index.js');
const client = new SVGMakerClient('svgmaker-ioa7eda109690877e6', { baseUrl: 'http://localhost:3000/api', timeout: 300000 });
client.edit.configure({ image: 'tests/test-images/test-image.png', prompt: 'Add a sunset gradient', quality: 'low', storage: true }).execute().then(r => { console.log('SVG URL:', r.svgUrl); console.log('Credits:', r.creditCost); console.log('Generation ID:', r.generationId); console.log('URL expires in:', r.svgUrlExpiresIn); console.log('Message:', r.message); console.log('Metadata:', r.metadata); }).catch(e => console.error('ERROR:', e.message));
"
```

### 13. With stream
```bash
node -e "
const { SVGMakerClient } = require('./dist/cjs/index.js');
const client = new SVGMakerClient('svgmaker-ioa7eda109690877e6', { baseUrl: 'http://localhost:3000/api', timeout: 300000 });
const stream = client.edit.configure({ image: 'tests/test-images/test-image.png', prompt: 'Make it look like a cartoon', quality: 'low' }).stream();
stream.on('data', (e) => { console.log('Event:', e.status, e.message || ''); if (e.status === 'complete') { console.log('SVG URL:', e.svgUrl); console.log('Credits:', e.creditCost); console.log('Generation ID:', e.generationId); } });
stream.on('end', () => console.log('Stream ended'));
stream.on('error', (e) => console.error('ERROR:', e.message));
"
```

### 14. With styleParams + aspectRatio + background
```bash
node -e "
const { SVGMakerClient } = require('./dist/cjs/index.js');
const client = new SVGMakerClient('svgmaker-ioa7eda109690877e6', { baseUrl: 'http://localhost:3000/api', timeout: 300000 });
client.edit.configure({ image: 'tests/test-images/test-image.png', prompt: 'Restyle this image', quality: 'low', aspectRatio: 'square', background: 'opaque', styleParams: { style: 'isometric', color_mode: 'monochrome', composition: 'centered_object' } }).execute().then(r => { console.log('SVG URL:', r.svgUrl); console.log('Credits:', r.creditCost); console.log('Message:', r.message); console.log('Metadata:', r.metadata); }).catch(e => console.error('ERROR:', e.message));
"
```

---

## Convert (AI Vectorize)

### 15. Without stream
```bash
node -e "
const { SVGMakerClient } = require('./dist/cjs/index.js');
const client = new SVGMakerClient('svgmaker-ioa7eda109690877e6', { baseUrl: 'http://localhost:3000/api', timeout: 300000 });
client.convert.aiVectorize.configure({ file: 'tests/test-images/test-image.png' }).execute().then(r => { console.log('SVG URL:', r.svgUrl); console.log('Credits:', r.creditCost); console.log('Message:', r.message); console.log('Generation ID:', r.generationId); console.log('Metadata:', r.metadata); }).catch(e => console.error('ERROR:', e.message));
"
```

### 16. With stream
```bash
node -e "
const { SVGMakerClient } = require('./dist/cjs/index.js');
const client = new SVGMakerClient('svgmaker-ioa7eda109690877e6', { baseUrl: 'http://localhost:3000/api', timeout: 300000 });
const stream = client.convert.aiVectorize.configure({ file: 'tests/test-images/test-image.png' }).stream();
stream.on('data', (e) => { console.log('Event:', e.status, e.message || ''); if (e.status === 'complete') { console.log('SVG URL:', e.svgUrl); console.log('Credits:', e.creditCost); console.log('Generation ID:', e.generationId); } });
stream.on('end', () => console.log('Stream ended'));
stream.on('error', (e) => console.error('ERROR:', e.message));
"
```

### 17. With storage: true
```bash
node -e "
const { SVGMakerClient } = require('./dist/cjs/index.js');
const client = new SVGMakerClient('svgmaker-ioa7eda109690877e6', { baseUrl: 'http://localhost:3000/api', timeout: 300000 });
client.convert.aiVectorize.configure({ file: 'tests/test-images/test-image.png', storage: true }).execute().then(r => { console.log('SVG URL:', r.svgUrl); console.log('Credits:', r.creditCost); console.log('Message:', r.message); console.log('Generation ID:', r.generationId); console.log('URL expires in:', r.svgUrlExpiresIn); console.log('Metadata:', r.metadata); }).catch(e => console.error('ERROR:', e.message));
"
```

---

## Generations Management

### 18. List generations (default)
```bash
node -e "
const { SVGMakerClient } = require('./dist/cjs/index.js');
const client = new SVGMakerClient('svgmaker-ioa7eda109690877e6', { baseUrl: 'http://localhost:3000/api', timeout: 300000 });
client.generations.list().then(r => { console.log('Items:', r.items); console.log('Pagination:', r.pagination); console.log('Metadata:', r.metadata); }).catch(e => console.error('ERROR:', e.message));
"
```

### 19. List generations (with filters)
```bash
node -e "
const { SVGMakerClient } = require('./dist/cjs/index.js');
const client = new SVGMakerClient('svgmaker-ioa7eda109690877e6', { baseUrl: 'http://localhost:3000/api', timeout: 300000 });
client.generations.list({ page: 1, limit: 5, type: ['generate', 'edit'] }).then(r => { console.log('Items:', r.items); console.log('Pagination:', r.pagination); console.log('Metadata:', r.metadata); }).catch(e => console.error('ERROR:', e.message));
"
```

### 20. List generations (with query search)
```bash
node -e "
const { SVGMakerClient } = require('./dist/cjs/index.js');
const client = new SVGMakerClient('svgmaker-ioa7eda109690877e6', { baseUrl: 'http://localhost:3000/api', timeout: 300000 });
client.generations.list({ query: 'mountain', limit: 10 }).then(r => { console.log('Items:', r.items); console.log('Pagination:', r.pagination); console.log('Metadata:', r.metadata); }).catch(e => console.error('ERROR:', e.message));
"
```

### 21. Get generation by ID
```bash
node -e "
const { SVGMakerClient } = require('./dist/cjs/index.js');
const client = new SVGMakerClient('svgmaker-ioa7eda109690877e6', { baseUrl: 'http://localhost:3000/api', timeout: 300000 });
client.generations.get('jhn1KSCWlR07Xkd4Sc0d').then(r => { console.log('ID:', r.id); console.log('Prompt:', r.prompt); console.log('Type:', r.type); console.log('Quality:', r.quality); console.log('Is Public:', r.isPublic); console.log('Metadata:', r.metadata); }).catch(e => console.error('ERROR:', e.message));
"
```

### 22. Share generation
```bash
node -e "
const { SVGMakerClient } = require('./dist/cjs/index.js');
const client = new SVGMakerClient('svgmaker-ioa7eda109690877e6', { baseUrl: 'http://localhost:3000/api', timeout: 300000 });
client.generations.share('jhn1KSCWlR07Xkd4Sc0d').then(r => { console.log('Message:', r.message); console.log('Is Public:', r.isPublic); console.log('Share URL:', r.shareUrl); console.log('Metadata:', r.metadata); }).catch(e => console.error('ERROR:', e.message));
"
```

### 23. Download generation (as SVG)
> Paid users only.
```bash
node -e "
const { SVGMakerClient } = require('./dist/cjs/index.js');
const client = new SVGMakerClient('svgmaker-ioa7eda109690877e6', { baseUrl: 'http://localhost:3000/api', timeout: 300000 });
client.generations.download('jhn1KSCWlR07Xkd4Sc0d', { format: 'svg' }).then(r => { console.log('ID:', r.id); console.log('URL:', r.url); console.log('URL Expires In:', r.urlExpiresIn); console.log('Format:', r.format); console.log('Filename:', r.filename); console.log('Metadata:', r.metadata); }).catch(e => console.error('ERROR:', e.message));
"
```

### 24. Download generation (default format)
> Paid users only.
```bash
node -e "
const { SVGMakerClient } = require('./dist/cjs/index.js');
const client = new SVGMakerClient('svgmaker-ioa7eda109690877e6', { baseUrl: 'http://localhost:3000/api', timeout: 300000 });
client.generations.download('jhn1KSCWlR07Xkd4Sc0d').then(r => { console.log('ID:', r.id); console.log('URL:', r.url); console.log('Format:', r.format); console.log('Filename:', r.filename); console.log('Metadata:', r.metadata); }).catch(e => console.error('ERROR:', e.message));
"
```

### 25. Delete generation
> Paid users only. This is destructive!
```bash
node -e "
const { SVGMakerClient } = require('./dist/cjs/index.js');
const client = new SVGMakerClient('svgmaker-ioa7eda109690877e6', { baseUrl: 'http://localhost:3000/api', timeout: 300000 });
client.generations.delete('jhn1KSCWlR07Xkd4Sc0d').then(r => { console.log('Message:', r.message); console.log('Metadata:', r.metadata); }).catch(e => console.error('ERROR:', e.message));
"
```

### 26. Get generation (invalid ID — should fail)
```bash
node -e "
const { SVGMakerClient } = require('./dist/cjs/index.js');
const client = new SVGMakerClient('svgmaker-ioa7eda109690877e6', { baseUrl: 'http://localhost:3000/api', timeout: 300000 });
client.generations.get('nonexistent-id-12345').then(r => { console.log('UNEXPECTED SUCCESS'); }).catch(e => console.log('EXPECTED ERROR:', e.message));
"
```

### 27. List generations (invalid limit — should fail validation)
```bash
node -e "
const { SVGMakerClient } = require('./dist/cjs/index.js');
const client = new SVGMakerClient('svgmaker-ioa7eda109690877e6', { baseUrl: 'http://localhost:3000/api', timeout: 300000 });
client.generations.list({ limit: 200 }).then(r => { console.log('UNEXPECTED SUCCESS'); }).catch(e => console.log('EXPECTED ERROR:', e.message));
"
```
