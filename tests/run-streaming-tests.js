// =============================================================================
// SVGMaker SDK — Streaming Integration Tests (Node.js)
// =============================================================================

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const config = require('./test-config');

// ─── Configuration ───────────────────────────────────────────────────────────
const { API_KEY, BASE_URL, DELAY, TIMEOUT, ASSETS_DIR } = config;

// ─── Colors ──────────────────────────────────────────────────────────────────
const GREEN = '\x1b[0;32m';
const RED = '\x1b[0;31m';
const CYAN = '\x1b[0;36m';
const YELLOW = '\x1b[0;33m';
const DIM = '\x1b[2m';
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

function downloadFile(url, filepath) {
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

async function saveAsset(label, completeEvent, filepath) {
  if (completeEvent.svgText) {
    fs.writeFileSync(filepath, completeEvent.svgText);
    console.log(`    ${DIM}Saved svgText -> ${filepath}${NC}`);
  } else if (completeEvent.svgUrl) {
    try {
      await downloadFile(completeEvent.svgUrl, filepath);
      console.log(`    ${DIM}Downloaded -> ${filepath}${NC}`);
    } catch (e) {
      console.log(`    ${DIM}Download failed (non-fatal): ${e.message}${NC}`);
    }
  }
}

function sectionHeader(title) {
  console.log('');
  console.log('\u2550'.repeat(50));
  console.log(`  ${title}`);
  console.log('\u2550'.repeat(50));
}

function logEvent(event) {
  const status = event.status || 'unknown';
  let color = DIM;
  if (status === 'complete') color = GREEN;
  else if (status === 'error') color = RED;
  else if (status === 'generated') color = CYAN;
  else if (status === 'processing' || status === 'storing') color = YELLOW;

  const message = event.message || '';
  const extra = [];
  if (event.svgUrl) extra.push(`svgUrl: ${event.svgUrl.substring(0, 60)}...`);
  if (event.creditCost !== undefined) extra.push(`credits: ${event.creditCost}`);
  if (event.generationId) extra.push(`id: ${event.generationId}`);
  if (event.svgText) extra.push(`svgText: ${event.svgText.length} chars`);
  if (event.quality) extra.push(`quality: ${event.quality}`);

  console.log(`    ${color}[${status}]${NC} ${message}${extra.length ? ` ${DIM}(${extra.join(', ')})${NC}` : ''}`);
}

/**
 * Consume a Readable object-mode stream and return all events.
 */
function consumeStream(readable) {
  return new Promise((resolve, reject) => {
    const events = [];
    readable.on('data', (event) => {
      logEvent(event);
      events.push(event);
    });
    readable.on('error', (err) => reject(err));
    readable.on('end', () => resolve(events));
  });
}

async function runTest(num, label, fn) {
  TOTAL++;
  const tag = `[Test ${String(num).padStart(2, '0')}]`;
  console.log(`${BOLD}${tag}${NC} ${label}...`);
  try {
    await fn();
    console.log(`  ${GREEN}PASS${NC}`);
    PASSED++;
  } catch (e) {
    console.log(`  ${RED}FAIL${NC}`);
    console.log(`    Error: ${e.message}`);
    FAILED++;
  }
  await sleep(DELAY);
}

function createClient() {
  const { SVGMakerClient } = require('../dist/cjs/index.js');
  return new SVGMakerClient(API_KEY, { baseUrl: BASE_URL, timeout: TIMEOUT });
}

// =============================================================================
//  MAIN
// =============================================================================

async function main() {
  // ─── Prepare assets directory ────────────────────────────────────────────
  console.log(`${BOLD}Preparing assets output directory...${NC}`);
  fs.mkdirSync(ASSETS_DIR, { recursive: true });
  console.log(`${GREEN}  Assets directory ready: ${ASSETS_DIR}${NC}`);

  // =========================================================================
  //  STREAMING GENERATE TESTS
  // =========================================================================
  sectionHeader('STREAMING GENERATE TESTS');

  await runTest(1, 'Stream Generate: basic prompt + storage', async () => {
    const client = createClient();
    const stream = client.generate.configure({
      prompt: 'A minimalist mountain landscape',
      quality: 'low',
      storage: true,
    }).stream();

    const events = await consumeStream(stream);
    if (events.length === 0) throw new Error('No events received');

    const last = events[events.length - 1];
    if (last.status !== 'complete') throw new Error(`Expected final status "complete", got "${last.status}"`);
    if (!last.svgUrl) throw new Error('Missing svgUrl in complete event');
    if (!last.generationId) throw new Error('Missing generationId — storage may not have worked');
    await saveAsset('stream-01', last, path.join(ASSETS_DIR, 'stream-01-generate-basic.svg'));
  });

  await runTest(2, 'Stream Generate: with svgText', async () => {
    const client = createClient();
    const stream = client.generate.configure({
      prompt: 'A simple red circle',
      quality: 'low',
      svgText: true,
    }).stream();

    const events = await consumeStream(stream);
    if (events.length === 0) throw new Error('No events received');

    const last = events[events.length - 1];
    if (last.status !== 'complete') throw new Error(`Expected final status "complete", got "${last.status}"`);
    if (!last.svgText) throw new Error('Missing svgText in complete event');
    if (!last.svgText.includes('<svg')) throw new Error('svgText does not contain <svg');
    await saveAsset('stream-02', last, path.join(ASSETS_DIR, 'stream-02-generate-svgtext.svg'));
  });

  await runTest(3, 'Stream Generate: with model', async () => {
    const client = createClient();
    const stream = client.generate.configure({
      prompt: 'A blue butterfly',
      model: 'gpt-image-1-mini',
    }).stream();

    const events = await consumeStream(stream);
    if (events.length === 0) throw new Error('No events received');

    const last = events[events.length - 1];
    if (last.status !== 'complete') throw new Error(`Expected final status "complete", got "${last.status}"`);
    if (!last.svgUrl) throw new Error('Missing svgUrl in complete event');
    await saveAsset('stream-03', last, path.join(ASSETS_DIR, 'stream-03-generate-model.svg'));
  });

  // =========================================================================
  //  STREAMING EDIT TESTS
  // =========================================================================
  sectionHeader('STREAMING EDIT TESTS');

  await runTest(4, 'Stream Edit: basic edit + storage', async () => {
    const client = createClient();
    const stream = client.edit.configure({
      image: 'tests/test-images/test-image.png',
      prompt: 'Make the background blue',
      quality: 'low',
      storage: true,
    }).stream();

    const events = await consumeStream(stream);
    if (events.length === 0) throw new Error('No events received');

    const last = events[events.length - 1];
    if (last.status !== 'complete') throw new Error(`Expected final status "complete", got "${last.status}"`);
    if (!last.svgUrl) throw new Error('Missing svgUrl in complete event');
    if (!last.generationId) throw new Error('Missing generationId — storage may not have worked');
    await saveAsset('stream-04', last, path.join(ASSETS_DIR, 'stream-04-edit-basic.svg'));
  });

  await runTest(5, 'Stream Edit: with svgText', async () => {
    const client = createClient();
    const stream = client.edit.configure({
      image: 'tests/test-images/test-image.png',
      prompt: 'Add a golden frame',
      quality: 'low',
      svgText: true,
    }).stream();

    const events = await consumeStream(stream);
    if (events.length === 0) throw new Error('No events received');

    const last = events[events.length - 1];
    if (last.status !== 'complete') throw new Error(`Expected final status "complete", got "${last.status}"`);
    if (!last.svgText) throw new Error('Missing svgText in complete event');
    await saveAsset('stream-05', last, path.join(ASSETS_DIR, 'stream-05-edit-svgtext.svg'));
  });

  await runTest(6, 'Stream Edit: with model', async () => {
    const client = createClient();
    const stream = client.edit.configure({
      image: 'tests/test-images/test-image.png',
      prompt: 'Add stars in the sky',
      model: 'gpt-image-1-mini',
    }).stream();

    const events = await consumeStream(stream);
    if (events.length === 0) throw new Error('No events received');

    const last = events[events.length - 1];
    if (last.status !== 'complete') throw new Error(`Expected final status "complete", got "${last.status}"`);
    if (!last.svgUrl) throw new Error('Missing svgUrl in complete event');
    await saveAsset('stream-06', last, path.join(ASSETS_DIR, 'stream-06-edit-model.svg'));
  });

  // =========================================================================
  //  STREAMING CONVERT (AI VECTORIZE) TESTS
  // =========================================================================
  sectionHeader('STREAMING CONVERT (AI VECTORIZE) TESTS');

  await runTest(7, 'Stream AI Vectorize: basic', async () => {
    const client = createClient();
    const stream = client.convert.aiVectorize.configure({
      file: 'tests/test-images/test-image.png',
    }).stream();

    const events = await consumeStream(stream);
    if (events.length === 0) throw new Error('No events received');

    const last = events[events.length - 1];
    if (last.status !== 'complete') throw new Error(`Expected final status "complete", got "${last.status}"`);
    if (!last.svgUrl) throw new Error('Missing svgUrl in complete event');
    await saveAsset('stream-07', last, path.join(ASSETS_DIR, 'stream-07-vectorize-basic.svg'));
  });

  await runTest(8, 'Stream AI Vectorize: with svgText', async () => {
    const client = createClient();
    const stream = client.convert.aiVectorize.configure({
      file: 'tests/test-images/test-image.png',
      svgText: true,
    }).stream();

    const events = await consumeStream(stream);
    if (events.length === 0) throw new Error('No events received');

    const last = events[events.length - 1];
    if (last.status !== 'complete') throw new Error(`Expected final status "complete", got "${last.status}"`);
    if (!last.svgText) throw new Error('Missing svgText in complete event');
    if (!last.svgText.includes('<svg')) throw new Error('svgText does not contain <svg');
    await saveAsset('stream-08', last, path.join(ASSETS_DIR, 'stream-08-vectorize-svgtext.svg'));
  });

  // =========================================================================
  //  RESULTS
  // =========================================================================
  console.log('');
  console.log('\u2550'.repeat(50));
  console.log('  TEST RESULTS SUMMARY');
  console.log('\u2550'.repeat(50));
  console.log('');
  console.log(`  Total:   ${TOTAL}`);
  console.log(`  Passed:  ${GREEN}${PASSED}${NC}`);
  console.log(`  Failed:  ${FAILED > 0 ? RED : GREEN}${FAILED}${NC}`);
  console.log('');
  console.log('\u2550'.repeat(50));

  if (FAILED > 0) {
    console.log(`${RED}Some tests failed!${NC}`);
    process.exit(1);
  } else {
    console.log(`${GREEN}All tests passed!${NC}`);
  }
}

main().catch((err) => {
  console.error(`${RED}Unhandled error:${NC}`, err);
  process.exit(1);
});
