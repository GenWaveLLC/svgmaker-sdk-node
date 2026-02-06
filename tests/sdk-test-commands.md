# SDK Test Commands

Base URL: `http://localhost:3000/api`
API Key: `svgmaker-io7791b35175f510df`

> Run `npm run build` first before testing.
> Edit and Convert tests need a test image at `tests/test-images/test-image.png`

---

## Generate

### 1. With model (no quality)
```bash
node -e "
const { SVGMakerClient } = require('./dist/cjs/index.js');
const client = new SVGMakerClient('svgmaker-io7791b35175f510df', { baseUrl: 'http://localhost:3000/api', timeout: 300000 });
client.generate.configure({ prompt: 'A minimalist mountain landscape', model: 'gpt-image-1-mini' }).execute().then(r => { console.log('SVG URL:', r.svgUrl); console.log('Credits:', r.creditCost); console.log('Message:', r.message); console.log('Metadata:', r.metadata); console.log('Generation ID:', r.generationId); }).catch(e => console.error('ERROR:', e.message));
"
```

### 2. With quality (no model)
```bash
node -e "
const { SVGMakerClient } = require('./dist/cjs/index.js');
const client = new SVGMakerClient('svgmaker-io7791b35175f510df', { baseUrl: 'http://localhost:3000/api', timeout: 300000 });
client.generate.configure({ prompt: 'A red sports car', quality: 'high' }).execute().then(r => { console.log('SVG URL:', r.svgUrl); console.log('Credits:', r.creditCost); console.log('Message:', r.message); console.log('Metadata:', r.metadata); console.log('Generation ID:', r.generationId); }).catch(e => console.error('ERROR:', e.message));
"
```

### 3. With BOTH model and quality (should fail validation)
```bash
node -e "
const { SVGMakerClient } = require('./dist/cjs/index.js');
const client = new SVGMakerClient('svgmaker-io7791b35175f510df', { baseUrl: 'http://localhost:3000/api', timeout: 300000 });
client.generate.configure({ prompt: 'A cat on a fence', quality: 'high', model: 'gpt-image-1-mini' }).execute().then(r => { console.log('UNEXPECTED SUCCESS - should have failed'); }).catch(e => console.log('EXPECTED ERROR:', e.message));
"
```

### 4. With storage: false
```bash
node -e "
const { SVGMakerClient } = require('./dist/cjs/index.js');
const client = new SVGMakerClient('svgmaker-io7791b35175f510df', { baseUrl: 'http://localhost:3000/api', timeout: 300000 });
client.generate.configure({ prompt: 'A simple house icon', quality: 'low', storage: false }).execute().then(r => { console.log('SVG URL:', r.svgUrl); console.log('Credits:', r.creditCost); console.log('Generation ID:', r.generationId); console.log('URL expires in:', r.svgUrlExpiresIn); console.log('Metadata:', r.metadata); }).catch(e => console.error('ERROR:', e.message));
"
```

### 5. With storage: true
```bash
node -e "
const { SVGMakerClient } = require('./dist/cjs/index.js');
const client = new SVGMakerClient('svgmaker-io7791b35175f510df', { baseUrl: 'http://localhost:3000/api', timeout: 300000 });
client.generate.configure({ prompt: 'A golden trophy', quality: 'medium', storage: true }).execute().then(r => { console.log('SVG URL:', r.svgUrl); console.log('Credits:', r.creditCost); console.log('Generation ID:', r.generationId); console.log('URL expires in:', r.svgUrlExpiresIn); console.log('Message:', r.message); console.log('Metadata:', r.metadata); }).catch(e => console.error('ERROR:', e.message));
"
```

### 6. With stream
```bash
node -e "
const { SVGMakerClient } = require('./dist/cjs/index.js');
const client = new SVGMakerClient('svgmaker-io7791b35175f510df', { baseUrl: 'http://localhost:3000/api', timeout: 300000 });
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
const client = new SVGMakerClient('svgmaker-io7791b35175f510df', { baseUrl: 'http://localhost:3000/api', timeout: 300000 });
client.generate.configure({ prompt: 'A forest with tall trees and a river', quality: 'low', aspectRatio: 'landscape', background: 'transparent', styleParams: { style: 'flat', color_mode: 'few_colors', image_complexity: 'scene', composition: 'full_scene' } }).execute().then(r => { console.log('SVG URL:', r.svgUrl); console.log('Credits:', r.creditCost); console.log('Message:', r.message); console.log('Metadata:', r.metadata); }).catch(e => console.error('ERROR:', e.message));
"
```

---

## Edit

### 8. With model (no quality)
```bash
node -e "
const { SVGMakerClient } = require('./dist/cjs/index.js');
const client = new SVGMakerClient('svgmaker-io7791b35175f510df', { baseUrl: 'http://localhost:3000/api', timeout: 300000 });
client.edit.configure({ image: 'tests/test-images/test-image.png', prompt: 'Add a golden frame around this image', model: 'gpt-image-1-mini' }).execute().then(r => { console.log('SVG URL:', r.svgUrl); console.log('Credits:', r.creditCost); console.log('Message:', r.message); console.log('Metadata:', r.metadata); console.log('Generation ID:', r.generationId); }).catch(e => console.error('ERROR:', e.message));
"
```

### 9. With quality (no model)
```bash
node -e "
const { SVGMakerClient } = require('./dist/cjs/index.js');
const client = new SVGMakerClient('svgmaker-io7791b35175f510df', { baseUrl: 'http://localhost:3000/api', timeout: 300000 });
client.edit.configure({ image: 'tests/test-images/test-image.png', prompt: 'Make the background blue', quality: 'low' }).execute().then(r => { console.log('SVG URL:', r.svgUrl); console.log('Credits:', r.creditCost); console.log('Message:', r.message); console.log('Metadata:', r.metadata); }).catch(e => console.error('ERROR:', e.message));
"
```

### 10. With BOTH model and quality (should fail validation)
```bash
node -e "
const { SVGMakerClient } = require('./dist/cjs/index.js');
const client = new SVGMakerClient('svgmaker-io7791b35175f510df', { baseUrl: 'http://localhost:3000/api', timeout: 300000 });
client.edit.configure({ image: 'tests/test-images/test-image.png', prompt: 'Add stars', quality: 'high', model: 'gpt-image-1-mini' }).execute().then(r => { console.log('UNEXPECTED SUCCESS - should have failed'); }).catch(e => console.log('EXPECTED ERROR:', e.message));
"
```

### 11. With storage: false
```bash
node -e "
const { SVGMakerClient } = require('./dist/cjs/index.js');
const client = new SVGMakerClient('svgmaker-io7791b35175f510df', { baseUrl: 'http://localhost:3000/api', timeout: 300000 });
client.edit.configure({ image: 'tests/test-images/test-image.png', prompt: 'Convert to silhouette style', quality: 'low', storage: false }).execute().then(r => { console.log('SVG URL:', r.svgUrl); console.log('Credits:', r.creditCost); console.log('Generation ID:', r.generationId); console.log('URL expires in:', r.svgUrlExpiresIn); console.log('Metadata:', r.metadata); }).catch(e => console.error('ERROR:', e.message));
"
```

### 12. With storage: true
```bash
node -e "
const { SVGMakerClient } = require('./dist/cjs/index.js');
const client = new SVGMakerClient('svgmaker-io7791b35175f510df', { baseUrl: 'http://localhost:3000/api', timeout: 300000 });
client.edit.configure({ image: 'tests/test-images/test-image.png', prompt: 'Add a sunset gradient', quality: 'low', storage: true }).execute().then(r => { console.log('SVG URL:', r.svgUrl); console.log('Credits:', r.creditCost); console.log('Generation ID:', r.generationId); console.log('URL expires in:', r.svgUrlExpiresIn); console.log('Message:', r.message); console.log('Metadata:', r.metadata); }).catch(e => console.error('ERROR:', e.message));
"
```

### 13. With stream
```bash
node -e "
const { SVGMakerClient } = require('./dist/cjs/index.js');
const client = new SVGMakerClient('svgmaker-io7791b35175f510df', { baseUrl: 'http://localhost:3000/api', timeout: 300000 });
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
const client = new SVGMakerClient('svgmaker-io7791b35175f510df', { baseUrl: 'http://localhost:3000/api', timeout: 300000 });
client.edit.configure({ image: 'tests/test-images/test-image.png', prompt: 'Restyle this image', quality: 'low', aspectRatio: 'square', background: 'opaque', styleParams: { style: 'isometric', color_mode: 'monochrome', composition: 'centered_object' } }).execute().then(r => { console.log('SVG URL:', r.svgUrl); console.log('Credits:', r.creditCost); console.log('Message:', r.message); console.log('Metadata:', r.metadata); }).catch(e => console.error('ERROR:', e.message));
"
```

---

## Convert (AI Vectorize)

### 15. Without stream
```bash
node -e "
const { SVGMakerClient } = require('./dist/cjs/index.js');
const client = new SVGMakerClient('svgmaker-io7791b35175f510df', { baseUrl: 'http://localhost:3000/api', timeout: 300000 });
client.convert.aiVectorize.configure({ file: 'tests/test-images/test-image.png' }).execute().then(r => { console.log('SVG URL:', r.svgUrl); console.log('Credits:', r.creditCost); console.log('Message:', r.message); console.log('Generation ID:', r.generationId); console.log('Metadata:', r.metadata); }).catch(e => console.error('ERROR:', e.message));
"
```

### 16. With stream
```bash
node -e "
const { SVGMakerClient } = require('./dist/cjs/index.js');
const client = new SVGMakerClient('svgmaker-io7791b35175f510df', { baseUrl: 'http://localhost:3000/api', timeout: 300000 });
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
const client = new SVGMakerClient('svgmaker-io7791b35175f510df', { baseUrl: 'http://localhost:3000/api', timeout: 300000 });
client.convert.aiVectorize.configure({ file: 'tests/test-images/test-image.png', storage: true }).execute().then(r => { console.log('SVG URL:', r.svgUrl); console.log('Credits:', r.creditCost); console.log('Message:', r.message); console.log('Generation ID:', r.generationId); console.log('URL expires in:', r.svgUrlExpiresIn); console.log('Metadata:', r.metadata); }).catch(e => console.error('ERROR:', e.message));
"
```

---

## Generations Management

### 18. List generations (default)
```bash
node -e "
const { SVGMakerClient } = require('./dist/cjs/index.js');
const client = new SVGMakerClient('svgmaker-io7791b35175f510df', { baseUrl: 'http://localhost:3000/api', timeout: 300000 });
client.generations.list().then(r => { console.log('Items:', r.items); console.log('Pagination:', r.pagination); console.log('Metadata:', r.metadata); }).catch(e => console.error('ERROR:', e.message));
"
```

### 19. List generations (with filters)
```bash
node -e "
const { SVGMakerClient } = require('./dist/cjs/index.js');
const client = new SVGMakerClient('svgmaker-io7791b35175f510df', { baseUrl: 'http://localhost:3000/api', timeout: 300000 });
client.generations.list({ page: 1, limit: 5, type: ['generate', 'edit'] }).then(r => { console.log('Items:', r.items); console.log('Pagination:', r.pagination); console.log('Metadata:', r.metadata); }).catch(e => console.error('ERROR:', e.message));
"
```

### 20. List generations (with query search)
```bash
node -e "
const { SVGMakerClient } = require('./dist/cjs/index.js');
const client = new SVGMakerClient('svgmaker-io7791b35175f510df', { baseUrl: 'http://localhost:3000/api', timeout: 300000 });
client.generations.list({ query: 'mountain', limit: 10 }).then(r => { console.log('Items:', r.items); console.log('Pagination:', r.pagination); console.log('Metadata:', r.metadata); }).catch(e => console.error('ERROR:', e.message));
"
```

### 21. Get generation by ID
```bash
node -e "
const { SVGMakerClient } = require('./dist/cjs/index.js');
const client = new SVGMakerClient('svgmaker-io7791b35175f510df', { baseUrl: 'http://localhost:3000/api', timeout: 300000 });
client.generations.get('bIJsOodcweYs5PriL7Bl').then(r => { console.log('ID:', r.id); console.log('Prompt:', r.prompt); console.log('Type:', r.type); console.log('Quality:', r.quality); console.log('Is Public:', r.isPublic); console.log('Metadata:', r.metadata); }).catch(e => console.error('ERROR:', e.message));
"
```

### 22. Share generation
```bash
node -e "
const { SVGMakerClient } = require('./dist/cjs/index.js');
const client = new SVGMakerClient('svgmaker-io7791b35175f510df', { baseUrl: 'http://localhost:3000/api', timeout: 300000 });
client.generations.share('bIJsOodcweYs5PriL7Bl').then(r => { console.log('Message:', r.message); console.log('Is Public:', r.isPublic); console.log('Share URL:', r.shareUrl); console.log('Metadata:', r.metadata); }).catch(e => console.error('ERROR:', e.message));
"
```

### 23. Download generation (as SVG)
> Paid users only.
```bash
node -e "
const { SVGMakerClient } = require('./dist/cjs/index.js');
const client = new SVGMakerClient('svgmaker-io7791b35175f510df', { baseUrl: 'http://localhost:3000/api', timeout: 300000 });
client.generations.download('bIJsOodcweYs5PriL7Bl', { format: 'svg' }).then(r => { console.log('ID:', r.id); console.log('URL:', r.url); console.log('URL Expires In:', r.urlExpiresIn); console.log('Format:', r.format); console.log('Filename:', r.filename); console.log('Metadata:', r.metadata); }).catch(e => console.error('ERROR:', e.message));
"
```

### 24. Download generation (default format)
> Paid users only.
```bash
node -e "
const { SVGMakerClient } = require('./dist/cjs/index.js');
const client = new SVGMakerClient('svgmaker-io7791b35175f510df', { baseUrl: 'http://localhost:3000/api', timeout: 300000 });
client.generations.download('bIJsOodcweYs5PriL7Bl').then(r => { console.log('ID:', r.id); console.log('URL:', r.url); console.log('Format:', r.format); console.log('Filename:', r.filename); console.log('Metadata:', r.metadata); }).catch(e => console.error('ERROR:', e.message));
"
```

### 25. Download generation (as SVGZ)
> Paid users only.
```bash
node -e "
const { SVGMakerClient } = require('./dist/cjs/index.js');
const client = new SVGMakerClient('svgmaker-io7791b35175f510df', { baseUrl: 'http://localhost:3000/api', timeout: 300000 });
client.generations.download('bIJsOodcweYs5PriL7Bl', { format: 'svgz' }).then(r => { console.log('ID:', r.id); console.log('URL:', r.url); console.log('URL Expires In:', r.urlExpiresIn); console.log('Format:', r.format); console.log('Filename:', r.filename); console.log('Metadata:', r.metadata); }).catch(e => console.error('ERROR:', e.message));
"
```

### 26. Delete generation
> Paid users only. This is destructive!
```bash
node -e "
const { SVGMakerClient } = require('./dist/cjs/index.js');
const client = new SVGMakerClient('svgmaker-io7791b35175f510df', { baseUrl: 'http://localhost:3000/api', timeout: 300000 });
client.generations.delete('bIJsOodcweYs5PriL7Bl').then(r => { console.log('Message:', r.message); console.log('Metadata:', r.metadata); }).catch(e => console.error('ERROR:', e.message));
"
```

### 27. Get generation (invalid ID — should fail)
```bash
node -e "
const { SVGMakerClient } = require('./dist/cjs/index.js');
const client = new SVGMakerClient('svgmaker-io7791b35175f510df', { baseUrl: 'http://localhost:3000/api', timeout: 300000 });
client.generations.get('nonexistent-id-12345').then(r => { console.log('UNEXPECTED SUCCESS'); }).catch(e => console.log('EXPECTED ERROR:', e.message));
"
```

### 28. List generations (invalid limit — should fail validation)
```bash
node -e "
const { SVGMakerClient } = require('./dist/cjs/index.js');
const client = new SVGMakerClient('svgmaker-io7791b35175f510df', { baseUrl: 'http://localhost:3000/api', timeout: 300000 });
client.generations.list({ limit: 200 }).then(r => { console.log('UNEXPECTED SUCCESS'); }).catch(e => console.log('EXPECTED ERROR:', e.message));
"
```

---

## Gallery

### 29. Browse gallery (default)
```bash
node -e "
const { SVGMakerClient } = require('./dist/cjs/index.js');
const client = new SVGMakerClient('svgmaker-io7791b35175f510df', { baseUrl: 'http://localhost:3000/api', timeout: 300000 });
client.gallery.list().then(r => { console.log('Items:', r.items); console.log('Pagination:', r.pagination); console.log('Metadata:', r.metadata); }).catch(e => console.error('ERROR:', e.message));
"
```

### 30. Browse gallery (with filters)
```bash
node -e "
const { SVGMakerClient } = require('./dist/cjs/index.js');
const client = new SVGMakerClient('svgmaker-io7791b35175f510df', { baseUrl: 'http://localhost:3000/api', timeout: 300000 });
client.gallery.list({ page: 1, limit: 5, type: ['generate', 'edit'] }).then(r => { console.log('Items:', r.items); console.log('Pagination:', r.pagination); console.log('Metadata:', r.metadata); }).catch(e => console.error('ERROR:', e.message));
"
```

### 31. Browse gallery (pro filter)
```bash
node -e "
const { SVGMakerClient } = require('./dist/cjs/index.js');
const client = new SVGMakerClient('svgmaker-io7791b35175f510df', { baseUrl: 'http://localhost:3000/api', timeout: 300000 });
client.gallery.list({ pro: 'true', limit: 10 }).then(r => { console.log('Items:', r.items); console.log('Pagination:', r.pagination); console.log('Metadata:', r.metadata); }).catch(e => console.error('ERROR:', e.message));
"
```

### 32. Browse gallery (gold filter)
```bash
node -e "
const { SVGMakerClient } = require('./dist/cjs/index.js');
const client = new SVGMakerClient('svgmaker-io7791b35175f510df', { baseUrl: 'http://localhost:3000/api', timeout: 300000 });
client.gallery.list({ gold: 'true', limit: 10 }).then(r => { console.log('Items:', r.items); console.log('Pagination:', r.pagination); console.log('Metadata:', r.metadata); }).catch(e => console.error('ERROR:', e.message));
"
```

### 33. Browse gallery (with query search)
```bash
node -e "
const { SVGMakerClient } = require('./dist/cjs/index.js');
const client = new SVGMakerClient('svgmaker-io7791b35175f510df', { baseUrl: 'http://localhost:3000/api', timeout: 300000 });
client.gallery.list({ query: 'mountain', limit: 10 }).then(r => { console.log('Items:', r.items); console.log('Pagination:', r.pagination); console.log('Metadata:', r.metadata); }).catch(e => console.error('ERROR:', e.message));
"
```

### 34. Get gallery item by ID
```bash
node -e "
const { SVGMakerClient } = require('./dist/cjs/index.js');
const client = new SVGMakerClient('svgmaker-io7791b35175f510df', { baseUrl: 'http://localhost:3000/api', timeout: 300000 });
client.gallery.get('B5EMo3ORhHtpBEnraspx').then(r => { console.log('ID:', r.id); console.log('Prompt:', r.prompt); console.log('Type:', r.type); console.log('Quality:', r.quality); console.log('Is Public:', r.isPublic); console.log('Metadata:', r.metadata); }).catch(e => console.error('ERROR:', e.message));
"
```

### 35. Download gallery item (as SVG — costs 1 credit)
```bash
node -e "
const { SVGMakerClient } = require('./dist/cjs/index.js');
const client = new SVGMakerClient('svgmaker-io7791b35175f510df', { baseUrl: 'http://localhost:3000/api', timeout: 300000 });
client.gallery.download('B5EMo3ORhHtpBEnraspx', { format: 'svg' }).then(r => { console.log('ID:', r.id); console.log('URL:', r.url); console.log('URL Expires In:', r.urlExpiresIn); console.log('Format:', r.format); console.log('Filename:', r.filename); console.log('Metadata:', r.metadata); }).catch(e => console.error('ERROR:', e.message));
"
```

### 36. Download gallery item (as WebP — free)
```bash
node -e "
const { SVGMakerClient } = require('./dist/cjs/index.js');
const client = new SVGMakerClient('svgmaker-io7791b35175f510df', { baseUrl: 'http://localhost:3000/api', timeout: 300000 });
client.gallery.download('B5EMo3ORhHtpBEnraspx', { format: 'webp' }).then(r => { console.log('ID:', r.id); console.log('URL:', r.url); console.log('Format:', r.format); console.log('Filename:', r.filename); console.log('Metadata:', r.metadata); }).catch(e => console.error('ERROR:', e.message));
"
```

### 37. Download gallery item (default format)
```bash
node -e "
const { SVGMakerClient } = require('./dist/cjs/index.js');
const client = new SVGMakerClient('svgmaker-io7791b35175f510df', { baseUrl: 'http://localhost:3000/api', timeout: 300000 });
client.gallery.download('B5EMo3ORhHtpBEnraspx').then(r => { console.log('ID:', r.id); console.log('URL:', r.url); console.log('Format:', r.format); console.log('Filename:', r.filename); console.log('Metadata:', r.metadata); }).catch(e => console.error('ERROR:', e.message));
"
```

### 38. Get gallery item (invalid ID — should fail)
```bash
node -e "
const { SVGMakerClient } = require('./dist/cjs/index.js');
const client = new SVGMakerClient('svgmaker-io7791b35175f510df', { baseUrl: 'http://localhost:3000/api', timeout: 300000 });
client.gallery.get('nonexistent-id-12345').then(r => { console.log('UNEXPECTED SUCCESS'); }).catch(e => console.log('EXPECTED ERROR:', e.message));
"
```

### 39. Browse gallery (invalid limit — should fail validation)
```bash
node -e "
const { SVGMakerClient } = require('./dist/cjs/index.js');
const client = new SVGMakerClient('svgmaker-io7791b35175f510df', { baseUrl: 'http://localhost:3000/api', timeout: 300000 });
client.gallery.list({ limit: 200 }).then(r => { console.log('UNEXPECTED SUCCESS'); }).catch(e => console.log('EXPECTED ERROR:', e.message));
"
```

---

## Account

### 40. Get account information
```bash
node -e "
const { SVGMakerClient } = require('./dist/cjs/index.js');
const client = new SVGMakerClient('svgmaker-io7791b35175f510df', { baseUrl: 'http://localhost:3000/api', timeout: 300000 });
client.account.getInfo().then(r => { console.log('Email:', r.email); console.log('Display Name:', r.displayName); console.log('Account Type:', r.accountType); console.log('Credits:', r.credits); console.log('Metadata:', r.metadata); }).catch(e => console.error('ERROR:', e.message));
"
```

### 41. Get all-time usage statistics
```bash
node -e "
const { SVGMakerClient } = require('./dist/cjs/index.js');
const client = new SVGMakerClient('svgmaker-io7791b35175f510df', { baseUrl: 'http://localhost:3000/api', timeout: 300000 });
client.account.getUsage().then(r => { console.log('Period:', r.period); console.log('Summary:', r.summary); console.log('By Category:', JSON.stringify(r.byCategory, null, 2)); console.log('Metadata:', r.metadata); }).catch(e => console.error('ERROR:', e.message));
"
```

### 42. Get usage for last 7 days
```bash
node -e "
const { SVGMakerClient } = require('./dist/cjs/index.js');
const client = new SVGMakerClient('svgmaker-io7791b35175f510df', { baseUrl: 'http://localhost:3000/api', timeout: 300000 });
client.account.getUsage({ days: 7 }).then(r => { console.log('Period:', r.period); console.log('Summary:', r.summary); console.log('Daily:', r.daily); console.log('All Time:', r.allTime); console.log('Metadata:', r.metadata); }).catch(e => console.error('ERROR:', e.message));
"
```

### 43. Get usage for date range
```bash
node -e "
const { SVGMakerClient } = require('./dist/cjs/index.js');
const client = new SVGMakerClient('svgmaker-io7791b35175f510df', { baseUrl: 'http://localhost:3000/api', timeout: 300000 });
client.account.getUsage({ start: '2025-01-01', end: '2025-01-31' }).then(r => { console.log('Period:', r.period); console.log('Summary:', r.summary); console.log('Daily:', r.daily); console.log('All Time:', r.allTime); console.log('Metadata:', r.metadata); }).catch(e => console.error('ERROR:', e.message));
"
```

### 44. Get usage with both days and start/end (should fail validation)
```bash
node -e "
const { SVGMakerClient } = require('./dist/cjs/index.js');
const client = new SVGMakerClient('svgmaker-io7791b35175f510df', { baseUrl: 'http://localhost:3000/api', timeout: 300000 });
client.account.getUsage({ days: 7, start: '2025-01-01', end: '2025-01-31' }).then(r => { console.log('UNEXPECTED SUCCESS'); }).catch(e => console.log('EXPECTED ERROR:', e.message));
"
```
