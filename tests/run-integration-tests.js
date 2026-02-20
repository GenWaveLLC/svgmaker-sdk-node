// =============================================================================
// SVGMaker SDK — Integration Test Suite (Node.js)
// =============================================================================

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const config = require('./test-config');

// ─── Configuration ───────────────────────────────────────────────────────────
const { API_KEY, BASE_URL, DELAY, TIMEOUT, ASSETS_DIR } = config;
const { GALLERY_ID, PRO_GALLERY_ID } = config;

// ─── Dynamic IDs (populated by generate/edit tests with storage: true) ──────
let GENERATION_ID = null;
let DELETE_GENERATION_ID = null;

// ─── Colors ──────────────────────────────────────────────────────────────────
const GREEN = '\x1b[0;32m';
const RED = '\x1b[0;31m';
const CYAN = '\x1b[0;36m';
const BOLD = '\x1b[1m';
const NC = '\x1b[0m';

// ─── Counters ────────────────────────────────────────────────────────────────
let PASSED = 0;
let FAILED = 0;
let TOTAL = 0;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function downloadFile(url, filepath) {
  return new Promise((resolve, reject) => {
    const get = url.startsWith('https') ? https.get : http.get;
    get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        downloadFile(res.headers.location, filepath).then(resolve).catch(reject);
        return;
      }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        fs.writeFileSync(filepath, Buffer.concat(chunks));
        resolve();
      });
      res.on('error', reject);
    }).on('error', reject);
  });
}

let _capturedLogs = null;

function logInfo(label, value) {
  const line = typeof value === 'object' && value !== null
    ? `    ${label}: ${JSON.stringify(value)}`
    : `    ${label}: ${value}`;
  if (_capturedLogs) {
    _capturedLogs.push(line);
  } else {
    console.log(line);
  }
}

function captureStart() {
  const logs = [];
  _capturedLogs = logs;
  return logs;
}

function captureStop() {
  _capturedLogs = null;
}

function replayLogs(logs) {
  for (const line of logs) {
    console.log(line);
  }
}

async function tryDownload(url, filepath) {
  if (!url) return;
  try {
    await downloadFile(url, filepath);
    logInfo('Downloaded', filepath);
  } catch (e) {
    logInfo('Download failed (non-fatal)', e.message);
  }
}

function sectionHeader(title) {
  console.log('');
  console.log(`${BOLD}\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550${NC}`);
  console.log(`${BOLD}  ${title}${NC}`);
  console.log(`${BOLD}\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550${NC}`);
}

async function runTest(num, name, fn) {
  TOTAL++;
  const padNum = String(num).padStart(2, '0');
  console.log(`${CYAN}[Test ${padNum}]${NC} ${name}...`);
  const logs = captureStart();
  try {
    await fn();
    captureStop();
    console.log(`  ${GREEN}PASS${NC}`);
    PASSED++;
  } catch (e) {
    captureStop();
    console.log(`  ${RED}FAIL${NC}`);
    console.log(`    Error: ${e.message}`);
    FAILED++;
  }
  replayLogs(logs);
  await sleep(DELAY);
}

async function runExpectedFail(num, name, fn) {
  TOTAL++;
  const padNum = String(num).padStart(2, '0');
  console.log(`${CYAN}[Test ${padNum}]${NC} ${name}...`);
  try {
    await fn();
    console.log(`  ${RED}FAIL${NC} (expected error but succeeded)`);
    FAILED++;
  } catch (e) {
    console.log(`  ${GREEN}PASS (expected error)${NC}`);
    logInfo('Error', e.message);
    PASSED++;
  }
  await sleep(DELAY);
}

async function runStreamTest(num, name, fn) {
  TOTAL++;
  const padNum = String(num).padStart(2, '0');
  console.log(`${CYAN}[Test ${padNum}]${NC} ${name} ${CYAN}(stream)${NC}...`);
  const logs = captureStart();
  try {
    await fn();
    captureStop();
    console.log(`  ${GREEN}PASS${NC}`);
    PASSED++;
  } catch (e) {
    captureStop();
    console.log(`  ${RED}FAIL${NC}`);
    console.log(`    Error: ${e.message}`);
    FAILED++;
  }
  replayLogs(logs);
  await sleep(DELAY);
}

// ─── Create client ───────────────────────────────────────────────────────────

function createClient() {
  const { SVGMakerClient } = require('../dist/cjs/index.js');
  return new SVGMakerClient(API_KEY, { baseUrl: BASE_URL, timeout: TIMEOUT });
}

// =============================================================================
//  MAIN
// =============================================================================

async function main() {
  // ─── Pre-flight ID check ─────────────────────────────────────────────────
  if (GALLERY_ID === 'REPLACE_ME' || PRO_GALLERY_ID === 'REPLACE_ME') {
    console.log(`${RED}ERROR: Please fill in GALLERY_ID and PRO_GALLERY_ID in tests/test-config.js before running.${NC}`);
    process.exit(1);
  }

  // ─── Prepare assets directory ────────────────────────────────────────────
  console.log(`${BOLD}Preparing assets output directory...${NC}`);
  if (fs.existsSync(ASSETS_DIR)) {
    fs.rmSync(ASSETS_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(ASSETS_DIR, { recursive: true });
  console.log(`${GREEN}  Assets directory ready: ${ASSETS_DIR}${NC}`);

  // =========================================================================
  //  GENERATE TESTS
  // =========================================================================
  sectionHeader('GENERATE TESTS  (limit: 3/60s)');

  await runTest(1, 'Generate: with quality (low) + storage', async () => {
    const client = createClient();
    const r = await client.generate.configure({ prompt: 'A minimalist mountain landscape', quality: 'low', storage: true }).execute();
    logInfo('SVG URL', r.svgUrl);
    logInfo('Credit Cost', r.creditCost);
    logInfo('Message', r.message);
    logInfo('Quality', r.quality);
    logInfo('Generation ID', r.generationId);
    logInfo('Metadata', r.metadata);
    if (!r.generationId) throw new Error('Missing generationId — storage may not have worked');
    GENERATION_ID = r.generationId;
    await tryDownload(r.svgUrl, path.join(ASSETS_DIR, 'test-01-generate-low.svg'));
  });

  await runTest(2, 'Generate: with model (gpt-image-1-mini)', async () => {
    const client = createClient();
    const r = await client.generate.configure({ prompt: 'A red sports car', model: 'gpt-image-1-mini' }).execute();
    logInfo('SVG URL', r.svgUrl);
    logInfo('Credit Cost', r.creditCost);
    logInfo('Message', r.message);
    logInfo('Quality', r.quality);
    logInfo('Generation ID', r.generationId);
    logInfo('Metadata', r.metadata);
    await tryDownload(r.svgUrl, path.join(ASSETS_DIR, 'test-02-generate-model.svg'));
  });

  await runExpectedFail(3, 'Generate: model+quality together', async () => {
    const client = createClient();
    await client.generate.configure({ prompt: 'A cat on a fence', quality: 'medium', model: 'gpt-image-1-mini' }).execute();
  });

  // =========================================================================
  //  EDIT TESTS
  // =========================================================================
  sectionHeader('EDIT TESTS  (limit: 3/60s)');

  await runTest(4, 'Edit: with quality (low) + storage', async () => {
    const client = createClient();
    const r = await client.edit.configure({ image: 'tests/test-images/test-image.png', prompt: 'Make the background blue', quality: 'low', storage: true }).execute();
    logInfo('SVG URL', r.svgUrl);
    logInfo('Credit Cost', r.creditCost);
    logInfo('Message', r.message);
    logInfo('Quality', r.quality);
    logInfo('Generation ID', r.generationId);
    logInfo('Metadata', r.metadata);
    if (!r.generationId) throw new Error('Missing generationId — storage may not have worked');
    DELETE_GENERATION_ID = r.generationId;
    await tryDownload(r.svgUrl, path.join(ASSETS_DIR, 'test-04-edit-low.svg'));
  });

  await runTest(5, 'Edit: with model (gpt-image-1-mini)', async () => {
    const client = createClient();
    const r = await client.edit.configure({ image: 'tests/test-images/test-image.png', prompt: 'Add a golden frame around this image', model: 'gpt-image-1-mini' }).execute();
    logInfo('SVG URL', r.svgUrl);
    logInfo('Credit Cost', r.creditCost);
    logInfo('Message', r.message);
    logInfo('Quality', r.quality);
    logInfo('Generation ID', r.generationId);
    logInfo('Metadata', r.metadata);
    await tryDownload(r.svgUrl, path.join(ASSETS_DIR, 'test-05-edit-model.svg'));
  });

  await runExpectedFail(6, 'Edit: model+quality together', async () => {
    const client = createClient();
    await client.edit.configure({ image: 'tests/test-images/test-image.png', prompt: 'Add stars', quality: 'medium', model: 'gpt-image-1-mini' }).execute();
  });

  // =========================================================================
  //  CONVERT — AI VECTORIZE TESTS
  // =========================================================================
  sectionHeader('CONVERT \u2014 AI VECTORIZE TESTS  (limit: 5/60s)');

  await runTest(7, 'AI Vectorize: basic (no storage)', async () => {
    const client = createClient();
    const r = await client.convert.aiVectorize.configure({ file: 'tests/test-images/test-image.png' }).execute();
    logInfo('SVG URL', r.svgUrl);
    logInfo('Credit Cost', r.creditCost);
    logInfo('Message', r.message);
    logInfo('Generation ID', r.generationId);
    logInfo('SVG URL Expires In', r.svgUrlExpiresIn);
    logInfo('Metadata', r.metadata);
    await tryDownload(r.svgUrl, path.join(ASSETS_DIR, 'test-07-ai-vectorize-basic.svg'));
  });

  await runTest(8, 'AI Vectorize: with storage true', async () => {
    const client = createClient();
    const r = await client.convert.aiVectorize.configure({ file: 'tests/test-images/test-image.png', storage: true }).execute();
    logInfo('SVG URL', r.svgUrl);
    logInfo('Credit Cost', r.creditCost);
    logInfo('Message', r.message);
    logInfo('Generation ID', r.generationId);
    logInfo('SVG URL Expires In', r.svgUrlExpiresIn);
    logInfo('Metadata', r.metadata);
    await tryDownload(r.svgUrl, path.join(ASSETS_DIR, 'test-08-ai-vectorize-storage.svg'));
  });

  // =========================================================================
  //  CONVERT — TRACE TESTS
  // =========================================================================
  sectionHeader('CONVERT \u2014 TRACE TESTS  (limit: 5/60s)');

  await runTest(9, 'Trace: default settings', async () => {
    const client = createClient();
    const r = await client.convert.trace.configure({ file: './tests/test-images/test-image.png' }).execute();
    logInfo('Results', r.results);
    logInfo('Summary', r.summary);
    logInfo('Metadata', r.metadata);
    if (r.results && r.results.length > 0 && r.results[0].url) {
      await tryDownload(r.results[0].url, path.join(ASSETS_DIR, 'test-09-trace-default.svg'));
    }
  });

  await runTest(10, 'Trace: custom params (preset: photo, mode: spline, detail: 60, smoothness: 70)', async () => {
    const client = createClient();
    const r = await client.convert.trace.configure({ file: './tests/test-images/test-image.png', preset: 'photo', mode: 'spline', detail: 60, smoothness: 70 }).execute();
    logInfo('Results', r.results);
    logInfo('Summary', r.summary);
    logInfo('Metadata', r.metadata);
    if (r.results && r.results.length > 0 && r.results[0].url) {
      await tryDownload(r.results[0].url, path.join(ASSETS_DIR, 'test-10-trace-custom.svg'));
    }
  });

  // =========================================================================
  //  CONVERT — SVG TO VECTOR TESTS
  // =========================================================================
  sectionHeader('CONVERT \u2014 SVG TO VECTOR TESTS  (limit: 5/60s)');

  await runTest(11, 'SVG to Vector: convert to PDF', async () => {
    const client = createClient();
    const r = await client.convert.svgToVector.configure({ file: './tests/test-images/test-image.svg', toFormat: 'PDF' }).execute();
    logInfo('Results', r.results);
    logInfo('Summary', r.summary);
    logInfo('Metadata', r.metadata);
    if (r.results && r.results.length > 0 && r.results[0].url) {
      await tryDownload(r.results[0].url, path.join(ASSETS_DIR, 'test-11-svg-to-pdf.pdf'));
    }
  });

  await runTest(12, 'SVG to Vector: convert to DXF with textToPath', async () => {
    const client = createClient();
    const r = await client.convert.svgToVector.configure({ file: './tests/test-images/test-image.svg', toFormat: 'DXF', textToPath: true }).execute();
    logInfo('Results', r.results);
    logInfo('Summary', r.summary);
    logInfo('Metadata', r.metadata);
    if (r.results && r.results.length > 0 && r.results[0].url) {
      await tryDownload(r.results[0].url, path.join(ASSETS_DIR, 'test-12-svg-to-dxf.dxf'));
    }
  });

  // =========================================================================
  //  CONVERT — RASTER TO RASTER TESTS
  // =========================================================================
  sectionHeader('CONVERT \u2014 RASTER TO RASTER TESTS  (limit: 5/60s)');

  await runTest(13, 'Raster to Raster: PNG to JPG with quality 85', async () => {
    const client = createClient();
    const r = await client.convert.rasterToRaster.configure({ file: './tests/test-images/test-image.png', toFormat: 'JPG', quality: 85 }).execute();
    logInfo('Results', r.results);
    logInfo('Summary', r.summary);
    logInfo('Metadata', r.metadata);
    if (r.results && r.results.length > 0 && r.results[0].url) {
      await tryDownload(r.results[0].url, path.join(ASSETS_DIR, 'test-13-raster-to-jpg.jpg'));
    }
  });

  await runTest(14, 'Raster to Raster: PNG to WEBP with width 512', async () => {
    const client = createClient();
    const r = await client.convert.rasterToRaster.configure({ file: './tests/test-images/test-image.png', toFormat: 'WEBP', width: 512 }).execute();
    logInfo('Results', r.results);
    logInfo('Summary', r.summary);
    logInfo('Metadata', r.metadata);
    if (r.results && r.results.length > 0 && r.results[0].url) {
      await tryDownload(r.results[0].url, path.join(ASSETS_DIR, 'test-14-raster-to-webp.webp'));
    }
  });

  // =========================================================================
  //  BATCH CONVERT TESTS
  // =========================================================================
  sectionHeader('BATCH CONVERT TESTS  (limit: 5/60s)');

  await runTest(15, 'Batch Convert: multiple files to SVG', async () => {
    const client = createClient();
    const r = await client.convert.batch.configure({ files: ['./tests/test-images/test-image.png', './tests/test-images/test-image.png'], toFormat: 'SVG' }).execute();
    logInfo('Results', r.results);
    logInfo('Summary', r.summary);
    logInfo('Metadata', r.metadata);
    if (r.results && r.results.length > 0 && r.results[0].url) {
      await tryDownload(r.results[0].url, path.join(ASSETS_DIR, 'test-15-batch-convert.svg'));
    }
  });

  // =========================================================================
  //  ENHANCE PROMPT TESTS
  // =========================================================================
  sectionHeader('ENHANCE PROMPT TESTS  (limit: 10/60s)');

  await runTest(16, "Enhance Prompt: basic ('a cat sitting on a fence')", async () => {
    const client = createClient();
    const r = await client.enhancePrompt.configure({ prompt: 'a cat sitting on a fence' }).execute();
    logInfo('Enhanced Prompt', r.enhancedPrompt);
    logInfo('Metadata', r.metadata);
  });

  await runTest(17, "Enhance Prompt: another ('a minimalist logo')", async () => {
    const client = createClient();
    const r = await client.enhancePrompt.configure({ prompt: 'a minimalist logo' }).execute();
    logInfo('Enhanced Prompt', r.enhancedPrompt);
    logInfo('Metadata', r.metadata);
  });

  // =========================================================================
  //  OPTIMIZE SVG TESTS
  // =========================================================================
  sectionHeader('OPTIMIZE SVG TESTS  (limit: 10/60s)');

  await runTest(18, 'Optimize SVG: default (no compression)', async () => {
    const client = createClient();
    const r = await client.optimizeSvg.configure({ file: './tests/test-images/test-image.svg' }).execute();
    logInfo('SVG URL', r.svgUrl);
    logInfo('SVG URL Expires In', r.svgUrlExpiresIn);
    logInfo('Metadata', r.metadata);
    await tryDownload(r.svgUrl, path.join(ASSETS_DIR, 'test-18-optimize-svg.svg'));
  });

  await runTest(19, 'Optimize SVG: with SVGZ compression', async () => {
    const client = createClient();
    const r = await client.optimizeSvg.configure({ file: './tests/test-images/test-image.svg', compress: true }).execute();
    logInfo('SVGZ URL', r.svgzUrl);
    logInfo('SVGZ URL Expires In', r.svgzUrlExpiresIn);
    logInfo('Filename', r.filename);
    logInfo('Compressed Size', r.compressedSize);
    logInfo('Metadata', r.metadata);
    if (r.svgzUrl) {
      await tryDownload(r.svgzUrl, path.join(ASSETS_DIR, 'test-19-optimize-svgz.svgz'));
    }
  });

  // =========================================================================
  //  GENERATIONS TESTS
  // =========================================================================
  sectionHeader('GENERATIONS TESTS  (limit: 1000/60s)');

  if (!GENERATION_ID || !DELETE_GENERATION_ID) {
    console.log(`${RED}  SKIPPING generation ID tests — generate/edit storage tests above must pass first.${NC}`);
  }

  await runTest(20, 'Generations: list (default)', async () => {
    const client = createClient();
    const r = await client.generations.list();
    const first3 = (r.items || []).slice(0, 3).map(i => ({ id: i.id, prompt: (i.prompt || '').substring(0, 50), type: i.type }));
    logInfo('Items (first 3)', first3);
    logInfo('Pagination', r.pagination);
    logInfo('Metadata', r.metadata);
  });

  await runTest(21, 'Generations: list (with filters)', async () => {
    const client = createClient();
    const r = await client.generations.list({ page: 1, limit: 5, type: ['generate', 'edit'] });
    const first3 = (r.items || []).slice(0, 3).map(i => ({ id: i.id, prompt: (i.prompt || '').substring(0, 50), type: i.type }));
    logInfo('Items (first 3)', first3);
    logInfo('Pagination', r.pagination);
    logInfo('Metadata', r.metadata);
  });

  await runTest(22, 'Generations: list (with query)', async () => {
    const client = createClient();
    const r = await client.generations.list({ query: 'mountain', limit: 10 });
    const first3 = (r.items || []).slice(0, 3).map(i => ({ id: i.id, prompt: (i.prompt || '').substring(0, 50), type: i.type }));
    logInfo('Items (first 3)', first3);
    logInfo('Pagination', r.pagination);
    logInfo('Metadata', r.metadata);
  });

  await runTest(23, 'Generations: get by ID', async () => {
    if (!GENERATION_ID) throw new Error('Skipped — no GENERATION_ID from test 01');
    const client = createClient();
    const r = await client.generations.get(GENERATION_ID);
    logInfo('ID', r.id);
    logInfo('Prompt', r.prompt);
    logInfo('Type', r.type);
    logInfo('Quality', r.quality);
    logInfo('Is Public', r.isPublic);
    logInfo('Hash Tags', r.hashTags);
    logInfo('Categories', r.categories);
    logInfo('Metadata', r.metadata);
  });

  await runTest(24, 'Generations: share', async () => {
    if (!GENERATION_ID) throw new Error('Skipped — no GENERATION_ID from test 01');
    const client = createClient();
    const r = await client.generations.share(GENERATION_ID);
    logInfo('Message', r.message);
    logInfo('Is Public', r.isPublic);
    logInfo('Share URL', r.shareUrl);
    logInfo('Metadata', r.metadata);
  });

  await runTest(25, 'Generations: download (SVG)', async () => {
    if (!GENERATION_ID) throw new Error('Skipped — no GENERATION_ID from test 01');
    const client = createClient();
    const r = await client.generations.download(GENERATION_ID, { format: 'svg' });
    logInfo('ID', r.id);
    logInfo('URL', r.url);
    logInfo('URL Expires In', r.urlExpiresIn);
    logInfo('Format', r.format);
    logInfo('Filename', r.filename);
    logInfo('Metadata', r.metadata);
    await tryDownload(r.url, path.join(ASSETS_DIR, 'test-25-gen-download-svg.svg'));
  });

  await runTest(26, 'Generations: download (default format)', async () => {
    if (!GENERATION_ID) throw new Error('Skipped — no GENERATION_ID from test 01');
    const client = createClient();
    const r = await client.generations.download(GENERATION_ID);
    logInfo('ID', r.id);
    logInfo('URL', r.url);
    logInfo('URL Expires In', r.urlExpiresIn);
    logInfo('Format', r.format);
    logInfo('Filename', r.filename);
    logInfo('Metadata', r.metadata);
    await tryDownload(r.url, path.join(ASSETS_DIR, `test-26-gen-download-default.${r.format || 'svg'}`));
  });

  await runTest(27, 'Generations: download (SVGZ)', async () => {
    if (!GENERATION_ID) throw new Error('Skipped — no GENERATION_ID from test 01');
    const client = createClient();
    const r = await client.generations.download(GENERATION_ID, { format: 'svgz' });
    logInfo('ID', r.id);
    logInfo('URL', r.url);
    logInfo('URL Expires In', r.urlExpiresIn);
    logInfo('Format', r.format);
    logInfo('Filename', r.filename);
    logInfo('Metadata', r.metadata);
    await tryDownload(r.url, path.join(ASSETS_DIR, 'test-27-gen-download-svgz.svgz'));
  });

  await runExpectedFail(28, 'Generations: get (invalid ID)', async () => {
    const client = createClient();
    await client.generations.get('nonexistent-id-12345');
  });

  await runExpectedFail(29, 'Generations: list (invalid limit)', async () => {
    const client = createClient();
    await client.generations.list({ limit: 200 });
  });

  await runTest(30, 'Generations: delete (destructive \u2014 uses edit generation)', async () => {
    if (!DELETE_GENERATION_ID) throw new Error('Skipped \u2014 no DELETE_GENERATION_ID from test 04');
    const client = createClient();
    const r = await client.generations.delete(DELETE_GENERATION_ID);
    logInfo('Message', r.message);
    logInfo('Metadata', r.metadata);
  });

  // =========================================================================
  //  GALLERY TESTS
  // =========================================================================
  sectionHeader('GALLERY TESTS  (list/get: 1000/60s, download: 5/60s)');

  await runTest(31, 'Gallery: browse (default)', async () => {
    const client = createClient();
    const r = await client.gallery.list();
    const first3 = (r.items || []).slice(0, 3).map(i => ({ id: i.id, prompt: (i.prompt || '').substring(0, 50), type: i.type }));
    logInfo('Items (first 3)', first3);
    logInfo('Pagination', r.pagination);
    logInfo('Metadata', r.metadata);
  });

  await runTest(32, 'Gallery: browse (with filters)', async () => {
    const client = createClient();
    const r = await client.gallery.list({ type: ['generate'], limit: 5 });
    const first3 = (r.items || []).slice(0, 3).map(i => ({ id: i.id, prompt: (i.prompt || '').substring(0, 50), type: i.type }));
    logInfo('Items (first 3)', first3);
    logInfo('Pagination', r.pagination);
    logInfo('Metadata', r.metadata);
  });

  await runTest(33, 'Gallery: browse (pro filter)', async () => {
    const client = createClient();
    const r = await client.gallery.list({ pro: 'true', limit: 10 });
    const first3 = (r.items || []).slice(0, 3).map(i => ({ id: i.id, prompt: (i.prompt || '').substring(0, 50), type: i.type }));
    logInfo('Items (first 3)', first3);
    logInfo('Pagination', r.pagination);
    logInfo('Metadata', r.metadata);
  });

  await runTest(34, 'Gallery: browse (with query)', async () => {
    const client = createClient();
    const r = await client.gallery.list({ query: 'mountain', limit: 10 });
    const first3 = (r.items || []).slice(0, 3).map(i => ({ id: i.id, prompt: (i.prompt || '').substring(0, 50), type: i.type }));
    logInfo('Items (first 3)', first3);
    logInfo('Pagination', r.pagination);
    logInfo('Metadata', r.metadata);
  });

  await runTest(35, 'Gallery: get by ID', async () => {
    const client = createClient();
    const r = await client.gallery.get(GALLERY_ID);
    logInfo('ID', r.id);
    logInfo('Prompt', r.prompt);
    logInfo('Type', r.type);
    logInfo('Quality', r.quality);
    logInfo('Is Public', r.isPublic);
    logInfo('Metadata', r.metadata);
  });

  await runTest(36, 'Gallery: get pro item', async () => {
    const client = createClient();
    const r = await client.gallery.get(PRO_GALLERY_ID);
    logInfo('ID', r.id);
    logInfo('Prompt', r.prompt);
    logInfo('Type', r.type);
    logInfo('Quality', r.quality);
    logInfo('Is Public', r.isPublic);
    logInfo('Metadata', r.metadata);
  });

  await runTest(37, 'Gallery: download (WebP \u2014 free)', async () => {
    const client = createClient();
    const r = await client.gallery.download(GALLERY_ID, { format: 'webp' });
    logInfo('ID', r.id);
    logInfo('URL', r.url);
    logInfo('Format', r.format);
    logInfo('Filename', r.filename);
    logInfo('Metadata', r.metadata);
    await tryDownload(r.url, path.join(ASSETS_DIR, 'test-37-gallery-download-webp.webp'));
  });

  await runTest(38, 'Gallery: download (SVG \u2014 1 credit)', async () => {
    const client = createClient();
    const r = await client.gallery.download(GALLERY_ID, { format: 'svg' });
    logInfo('ID', r.id);
    logInfo('URL', r.url);
    logInfo('URL Expires In', r.urlExpiresIn);
    logInfo('Format', r.format);
    logInfo('Filename', r.filename);
    logInfo('Metadata', r.metadata);
    await tryDownload(r.url, path.join(ASSETS_DIR, 'test-38-gallery-download-svg.svg'));
  });

  await runTest(39, 'Gallery: download pro item (WebP \u2014 free for premium)', async () => {
    const client = createClient();
    const r = await client.gallery.download(PRO_GALLERY_ID, { format: 'webp' });
    logInfo('ID', r.id);
    logInfo('URL', r.url);
    logInfo('Format', r.format);
    logInfo('Filename', r.filename);
    logInfo('Metadata', r.metadata);
    await tryDownload(r.url, path.join(ASSETS_DIR, 'test-39-gallery-download-pro-webp.webp'));
  });

  await runExpectedFail(40, 'Gallery: get (invalid ID)', async () => {
    const client = createClient();
    await client.gallery.get('nonexistent-id-12345');
  });

  // =========================================================================
  //  ACCOUNT TESTS
  // =========================================================================
  sectionHeader('ACCOUNT TESTS  (limit: 1000/60s)');

  await runTest(41, 'Account: get info', async () => {
    const client = createClient();
    const r = await client.account.getInfo();
    logInfo('Email', r.email);
    logInfo('Display Name', r.displayName);
    logInfo('Account Type', r.accountType);
    logInfo('Credits', r.credits);
    logInfo('Metadata', r.metadata);
  });

  await runTest(42, 'Account: all-time usage', async () => {
    const client = createClient();
    const r = await client.account.getUsage();
    logInfo('Period', r.period);
    logInfo('Summary', r.summary);
    const catKeys = Object.keys(r.byCategory || {}).slice(0, 5);
    const catPreview = {};
    catKeys.forEach(k => catPreview[k] = r.byCategory[k]);
    logInfo('By Category (first few)', catPreview);
    logInfo('Metadata', r.metadata);
  });

  await runTest(43, 'Account: usage last 7 days', async () => {
    const client = createClient();
    const r = await client.account.getUsage({ days: 7 });
    logInfo('Period', r.period);
    logInfo('Summary', r.summary);
    const catKeys = Object.keys(r.byCategory || {}).slice(0, 5);
    const catPreview = {};
    catKeys.forEach(k => catPreview[k] = r.byCategory[k]);
    logInfo('By Category (first few)', catPreview);
    logInfo('Metadata', r.metadata);
  });

  await runTest(44, 'Account: usage date range (2025-01-01 to 2025-06-30)', async () => {
    const client = createClient();
    const r = await client.account.getUsage({ start: '2025-01-01', end: '2025-06-30' });
    logInfo('Period', r.period);
    logInfo('Summary', r.summary);
    const catKeys = Object.keys(r.byCategory || {}).slice(0, 5);
    const catPreview = {};
    catKeys.forEach(k => catPreview[k] = r.byCategory[k]);
    logInfo('By Category (first few)', catPreview);
    logInfo('Metadata', r.metadata);
  });

  await runExpectedFail(45, 'Account: usage with both days and start/end', async () => {
    const client = createClient();
    await client.account.getUsage({ days: 7, start: '2025-01-01', end: '2025-01-31' });
  });

  // =========================================================================
  //  SUMMARY
  // =========================================================================
  console.log('');
  console.log(`${BOLD}\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550${NC}`);
  console.log(`${BOLD}  TEST RESULTS SUMMARY${NC}`);
  console.log(`${BOLD}\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550${NC}`);
  console.log('');
  console.log(`  Total:   ${BOLD}${TOTAL}${NC}`);
  console.log(`  Passed:  ${GREEN}${PASSED}${NC}`);
  console.log(`  Failed:  ${RED}${FAILED}${NC}`);
  console.log('');
  console.log(`${BOLD}\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550${NC}`);

  if (FAILED > 0) {
    console.log(`${RED}Some tests failed.${NC}`);
    process.exit(1);
  } else {
    console.log(`${GREEN}All tests passed!${NC}`);
    process.exit(0);
  }
}

main().catch(e => {
  console.error(`${RED}Fatal error: ${e.message}${NC}`);
  console.error(e.stack);
  process.exit(1);
});
