#!/usr/bin/env bash
# =============================================================================
# SVGMaker SDK — Rate-Limited Integration Test Suite (Production)
# =============================================================================

set -euo pipefail

# ─── Configuration ───────────────────────────────────────────────────────────
API_KEY="svgmaker-ioxxx"
BASE_URL="https://api.svgmaker.io"
DELAY=3        # seconds between tests
TIMEOUT=300000 # ms for SDK timeout

# ─── IDs (fill in before running) ──────────────────────────────────────
GENERATION_ID=""          # A generation you own (for get/share/download)
DELETE_GENERATION_ID=""   # Throwaway generation (will be permanently deleted)
GALLERY_ID=""             # A public gallery item
PRO_GALLERY_ID=""        # A pro public gallery item

# ─── Pre-flight ID check ───────────────────────────────────────────────────
if [[ "$GENERATION_ID" == "REPLACE_ME" ]] || [[ "$DELETE_GENERATION_ID" == "REPLACE_ME" ]] || [[ "$GALLERY_ID" == "REPLACE_ME" ]] || [[ "$PRO_GALLERY_ID" == "REPLACE_ME" ]]; then
  echo -e "${RED:-\033[0;31m}ERROR: Please fill in the ID placeholders at the top of this script before running.${NC:-\033[0m}"
  exit 1
fi

# ─── Colors ──────────────────────────────────────────────────────────────────
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

# ─── Counters ────────────────────────────────────────────────────────────────
PASSED=0
FAILED=0
SKIPPED=0
TOTAL=0

# ─── Test Fixtures ───────────────────────────────────────────────────────────
echo -e "${BOLD}Setting up test fixtures...${NC}"

mkdir -p tests/test-images

if [ ! -f tests/test-images/test-image.png ]; then
  echo "  Creating tests/test-images/test-image.png ..."
  node -e "
const fs = require('fs');
const data = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==', 'base64');
fs.writeFileSync('tests/test-images/test-image.png', data);
"
fi

if [ ! -f tests/test-images/test.svg ]; then
  echo "  Creating tests/test-images/test.svg ..."
  cat > tests/test-images/test.svg << 'SVGEOF'
<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
  <circle cx="50" cy="50" r="40" fill="red" stroke="black" stroke-width="2"/>
</svg>
SVGEOF
fi

echo -e "${GREEN}  Fixtures ready.${NC}"

# ─── Pre-flight build ───────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}Running npm run build...${NC}"
if ! npm run build; then
  echo -e "${RED}Build failed — aborting tests.${NC}"
  exit 1
fi
echo -e "${GREEN}Build succeeded.${NC}"

# ─── Timeout command detection ───────────────────────────────────────────────
TIMEOUT_CMD=""
if command -v gtimeout &>/dev/null; then
  TIMEOUT_CMD="gtimeout 120"
elif command -v timeout &>/dev/null; then
  TIMEOUT_CMD="timeout 120"
fi

# ─── Helper Functions ────────────────────────────────────────────────────────

run_test() {
  local num="$1"
  local name="$2"
  local code="$3"

  TOTAL=$((TOTAL + 1))
  echo -e "${CYAN}[Test ${num}]${NC} ${name}..."

  local output
  output=$(node -e "$code" 2>&1) || true
  local exit_code=$?

  if [ $exit_code -eq 0 ] && ! echo "$output" | grep -q "ERROR:"; then
    echo -e "  ${GREEN}PASS${NC}"
    PASSED=$((PASSED + 1))
  else
    echo -e "  ${RED}FAIL${NC}"
    echo "$output" | sed 's/^/    /'
    FAILED=$((FAILED + 1))
  fi

  sleep "$DELAY"
}

run_expected_fail() {
  local num="$1"
  local name="$2"
  local code="$3"

  TOTAL=$((TOTAL + 1))
  echo -e "${CYAN}[Test ${num}]${NC} ${name} ${YELLOW}(expected fail)${NC}..."

  local output
  output=$(node -e "$code" 2>&1) || true

  if echo "$output" | grep -q "EXPECTED ERROR"; then
    echo -e "  ${YELLOW}EXPECTED FAIL (PASS)${NC}"
    PASSED=$((PASSED + 1))
  else
    echo -e "  ${RED}FAIL${NC}"
    echo "$output" | sed 's/^/    /'
    FAILED=$((FAILED + 1))
  fi

  sleep "$DELAY"
}

run_stream_test() {
  local num="$1"
  local name="$2"
  local code="$3"

  TOTAL=$((TOTAL + 1))
  echo -e "${CYAN}[Test ${num}]${NC} ${name} ${CYAN}(stream)${NC}..."

  local output
  if [ -n "$TIMEOUT_CMD" ]; then
    output=$($TIMEOUT_CMD node -e "$code" 2>&1) || true
  else
    # Fallback: rely on the in-code setTimeout to kill the process
    output=$(node -e "$code" 2>&1) || true
  fi

  if echo "$output" | grep -q "Stream ended" || echo "$output" | grep -q "complete"; then
    echo -e "  ${GREEN}PASS${NC}"
    PASSED=$((PASSED + 1))
  else
    echo -e "  ${RED}FAIL${NC}"
    echo "$output" | sed 's/^/    /'
    FAILED=$((FAILED + 1))
  fi

  sleep "$DELAY"
}

# =============================================================================
#  TESTS BEGIN
# =============================================================================

# ─────────────────────────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}══════════════════════════════════════${NC}"
echo -e "${BOLD}  GENERATE TESTS  (limit: 3/60s)${NC}"
echo -e "${BOLD}══════════════════════════════════════${NC}"
# ─────────────────────────────────────────────────────────────────────────────

run_test 1 "Generate: with quality (low)" "
const { SVGMakerClient } = require('./dist/cjs/index.js');
const client = new SVGMakerClient('${API_KEY}', { baseUrl: '${BASE_URL}', timeout: ${TIMEOUT} });
client.generate.configure({ prompt: 'A minimalist mountain landscape', quality: 'low' }).execute().then(r => { console.log('SVG URL:', r.svgUrl); console.log('Credits:', r.creditCost); console.log('Message:', r.message); console.log('Metadata:', r.metadata); console.log('Generation ID:', r.generationId); }).catch(e => console.error('ERROR:', e.message));
"

run_test 2 "Generate: with model (gpt-image-1-mini)" "
const { SVGMakerClient } = require('./dist/cjs/index.js');
const client = new SVGMakerClient('${API_KEY}', { baseUrl: '${BASE_URL}', timeout: ${TIMEOUT} });
client.generate.configure({ prompt: 'A red sports car', model: 'gpt-image-1-mini' }).execute().then(r => { console.log('SVG URL:', r.svgUrl); console.log('Credits:', r.creditCost); console.log('Message:', r.message); console.log('Metadata:', r.metadata); console.log('Generation ID:', r.generationId); }).catch(e => console.error('ERROR:', e.message));
"

run_expected_fail 3 "Generate: model+quality together" "
const { SVGMakerClient } = require('./dist/cjs/index.js');
const client = new SVGMakerClient('${API_KEY}', { baseUrl: '${BASE_URL}', timeout: ${TIMEOUT} });
client.generate.configure({ prompt: 'A cat on a fence', quality: 'medium', model: 'gpt-image-1-mini' }).execute().then(r => { console.log('UNEXPECTED SUCCESS - should have failed'); }).catch(e => console.log('EXPECTED ERROR:', e.message));
"

# ─────────────────────────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}══════════════════════════════════════${NC}"
echo -e "${BOLD}  EDIT TESTS  (limit: 3/60s)${NC}"
echo -e "${BOLD}══════════════════════════════════════${NC}"
# ─────────────────────────────────────────────────────────────────────────────

run_test 4 "Edit: with quality (low)" "
const { SVGMakerClient } = require('./dist/cjs/index.js');
const client = new SVGMakerClient('${API_KEY}', { baseUrl: '${BASE_URL}', timeout: ${TIMEOUT} });
client.edit.configure({ image: 'tests/test-images/test-image.png', prompt: 'Make the background blue', quality: 'low' }).execute().then(r => { console.log('SVG URL:', r.svgUrl); console.log('Credits:', r.creditCost); console.log('Message:', r.message); console.log('Metadata:', r.metadata); console.log('Generation ID:', r.generationId); }).catch(e => console.error('ERROR:', e.message));
"

run_test 5 "Edit: with model (gpt-image-1-mini)" "
const { SVGMakerClient } = require('./dist/cjs/index.js');
const client = new SVGMakerClient('${API_KEY}', { baseUrl: '${BASE_URL}', timeout: ${TIMEOUT} });
client.edit.configure({ image: 'tests/test-images/test-image.png', prompt: 'Add a golden frame around this image', model: 'gpt-image-1-mini' }).execute().then(r => { console.log('SVG URL:', r.svgUrl); console.log('Credits:', r.creditCost); console.log('Message:', r.message); console.log('Metadata:', r.metadata); console.log('Generation ID:', r.generationId); }).catch(e => console.error('ERROR:', e.message));
"

run_expected_fail 6 "Edit: model+quality together" "
const { SVGMakerClient } = require('./dist/cjs/index.js');
const client = new SVGMakerClient('${API_KEY}', { baseUrl: '${BASE_URL}', timeout: ${TIMEOUT} });
client.edit.configure({ image: 'tests/test-images/test-image.png', prompt: 'Add stars', quality: 'medium', model: 'gpt-image-1-mini' }).execute().then(r => { console.log('UNEXPECTED SUCCESS - should have failed'); }).catch(e => console.log('EXPECTED ERROR:', e.message));
"

# ─────────────────────────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}══════════════════════════════════════${NC}"
echo -e "${BOLD}  CONVERT — AI VECTORIZE TESTS  (limit: 5/60s)${NC}"
echo -e "${BOLD}══════════════════════════════════════${NC}"
# ─────────────────────────────────────────────────────────────────────────────

run_test 7 "AI Vectorize: basic (no storage)" "
const { SVGMakerClient } = require('./dist/cjs/index.js');
const client = new SVGMakerClient('${API_KEY}', { baseUrl: '${BASE_URL}', timeout: ${TIMEOUT} });
client.convert.aiVectorize.configure({ file: 'tests/test-images/test-image.png' }).execute().then(r => { console.log('SVG URL:', r.svgUrl); console.log('Credits:', r.creditCost); console.log('Message:', r.message); console.log('Generation ID:', r.generationId); console.log('Metadata:', r.metadata); }).catch(e => console.error('ERROR:', e.message));
"

run_test 8 "AI Vectorize: with storage true" "
const { SVGMakerClient } = require('./dist/cjs/index.js');
const client = new SVGMakerClient('${API_KEY}', { baseUrl: '${BASE_URL}', timeout: ${TIMEOUT} });
client.convert.aiVectorize.configure({ file: 'tests/test-images/test-image.png', storage: true }).execute().then(r => { console.log('SVG URL:', r.svgUrl); console.log('Credits:', r.creditCost); console.log('Message:', r.message); console.log('Generation ID:', r.generationId); console.log('URL expires in:', r.svgUrlExpiresIn); console.log('Metadata:', r.metadata); }).catch(e => console.error('ERROR:', e.message));
"

# ─────────────────────────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}══════════════════════════════════════${NC}"
echo -e "${BOLD}  CONVERT — TRACE TESTS  (limit: 5/60s)${NC}"
echo -e "${BOLD}══════════════════════════════════════${NC}"
# ─────────────────────────────────────────────────────────────────────────────

run_test 9 "Trace: default settings" "
const { SVGMakerClient } = require('./dist/cjs/index.js');
const client = new SVGMakerClient('${API_KEY}', { baseUrl: '${BASE_URL}', timeout: ${TIMEOUT} });
client.convert.trace.configure({ file: './tests/test-images/test-image.png' }).execute().then(r => { console.log('Results:', JSON.stringify(r.results, null, 2)); console.log('Summary:', r.summary); console.log('Metadata:', r.metadata); }).catch(e => console.error('ERROR:', e.message));
"

run_test 10 "Trace: custom params (preset: photo, mode: spline, detail: 60, smoothness: 70)" "
const { SVGMakerClient } = require('./dist/cjs/index.js');
const client = new SVGMakerClient('${API_KEY}', { baseUrl: '${BASE_URL}', timeout: ${TIMEOUT} });
client.convert.trace.configure({ file: './tests/test-images/test-image.png', preset: 'photo', mode: 'spline', detail: 60, smoothness: 70 }).execute().then(r => { console.log('Results:', JSON.stringify(r.results, null, 2)); console.log('Summary:', r.summary); console.log('Metadata:', r.metadata); }).catch(e => console.error('ERROR:', e.message));
"

# ─────────────────────────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}══════════════════════════════════════${NC}"
echo -e "${BOLD}  CONVERT — SVG TO VECTOR TESTS  (limit: 5/60s)${NC}"
echo -e "${BOLD}══════════════════════════════════════${NC}"
# ─────────────────────────────────────────────────────────────────────────────

run_test 11 "SVG to Vector: convert to PDF" "
const { SVGMakerClient } = require('./dist/cjs/index.js');
const client = new SVGMakerClient('${API_KEY}', { baseUrl: '${BASE_URL}', timeout: ${TIMEOUT} });
client.convert.svgToVector.configure({ file: './tests/test-images/test.svg', toFormat: 'PDF' }).execute().then(r => { console.log('Results:', JSON.stringify(r.results, null, 2)); console.log('Summary:', r.summary); console.log('Metadata:', r.metadata); }).catch(e => console.error('ERROR:', e.message));
"

run_test 12 "SVG to Vector: convert to DXF with textToPath" "
const { SVGMakerClient } = require('./dist/cjs/index.js');
const client = new SVGMakerClient('${API_KEY}', { baseUrl: '${BASE_URL}', timeout: ${TIMEOUT} });
client.convert.svgToVector.configure({ file: './tests/test-images/test.svg', toFormat: 'DXF', textToPath: true }).execute().then(r => { console.log('Results:', JSON.stringify(r.results, null, 2)); console.log('Summary:', r.summary); console.log('Metadata:', r.metadata); }).catch(e => console.error('ERROR:', e.message));
"

# ─────────────────────────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}══════════════════════════════════════${NC}"
echo -e "${BOLD}  CONVERT — RASTER TO RASTER TESTS  (limit: 5/60s)${NC}"
echo -e "${BOLD}══════════════════════════════════════${NC}"
# ─────────────────────────────────────────────────────────────────────────────

run_test 13 "Raster to Raster: PNG to JPG with quality 85" "
const { SVGMakerClient } = require('./dist/cjs/index.js');
const client = new SVGMakerClient('${API_KEY}', { baseUrl: '${BASE_URL}', timeout: ${TIMEOUT} });
client.convert.rasterToRaster.configure({ file: './tests/test-images/test-image.png', toFormat: 'JPG', quality: 85 }).execute().then(r => { console.log('Results:', JSON.stringify(r.results, null, 2)); console.log('Summary:', r.summary); console.log('Metadata:', r.metadata); }).catch(e => console.error('ERROR:', e.message));
"

run_test 14 "Raster to Raster: PNG to WEBP with width 512" "
const { SVGMakerClient } = require('./dist/cjs/index.js');
const client = new SVGMakerClient('${API_KEY}', { baseUrl: '${BASE_URL}', timeout: ${TIMEOUT} });
client.convert.rasterToRaster.configure({ file: './tests/test-images/test-image.png', toFormat: 'WEBP', width: 512 }).execute().then(r => { console.log('Results:', JSON.stringify(r.results, null, 2)); console.log('Summary:', r.summary); console.log('Metadata:', r.metadata); }).catch(e => console.error('ERROR:', e.message));
"

# ─────────────────────────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}══════════════════════════════════════${NC}"
echo -e "${BOLD}  BATCH CONVERT TESTS  (limit: 5/60s)${NC}"
echo -e "${BOLD}══════════════════════════════════════${NC}"
# ─────────────────────────────────────────────────────────────────────────────

run_test 15 "Batch Convert: multiple files to SVG" "
const { SVGMakerClient } = require('./dist/cjs/index.js');
const client = new SVGMakerClient('${API_KEY}', { baseUrl: '${BASE_URL}', timeout: ${TIMEOUT} });
client.convert.batch.configure({ files: ['./tests/test-images/test-image.png', './tests/test-images/test-image.png'], toFormat: 'SVG' }).execute().then(r => { console.log('Results:', JSON.stringify(r.results, null, 2)); console.log('Summary:', r.summary); console.log('Metadata:', r.metadata); }).catch(e => console.error('ERROR:', e.message));
"

# ─────────────────────────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}══════════════════════════════════════${NC}"
echo -e "${BOLD}  ENHANCE PROMPT TESTS  (limit: 10/60s)${NC}"
echo -e "${BOLD}══════════════════════════════════════${NC}"
# ─────────────────────────────────────────────────────────────────────────────

run_test 16 "Enhance Prompt: basic ('a cat sitting on a fence')" "
const { SVGMakerClient } = require('./dist/cjs/index.js');
const client = new SVGMakerClient('${API_KEY}', { baseUrl: '${BASE_URL}', timeout: ${TIMEOUT} });
client.enhancePrompt.configure({ prompt: 'a cat sitting on a fence' }).execute().then(r => { console.log('Enhanced Prompt:', r.enhancedPrompt); console.log('Metadata:', r.metadata); }).catch(e => console.error('ERROR:', e.message));
"

run_test 17 "Enhance Prompt: another ('a minimalist logo')" "
const { SVGMakerClient } = require('./dist/cjs/index.js');
const client = new SVGMakerClient('${API_KEY}', { baseUrl: '${BASE_URL}', timeout: ${TIMEOUT} });
client.enhancePrompt.configure({ prompt: 'a minimalist logo' }).execute().then(r => { console.log('Enhanced Prompt:', r.enhancedPrompt); console.log('Metadata:', r.metadata); }).catch(e => console.error('ERROR:', e.message));
"

# ─────────────────────────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}══════════════════════════════════════${NC}"
echo -e "${BOLD}  OPTIMIZE SVG TESTS  (limit: 10/60s)${NC}"
echo -e "${BOLD}══════════════════════════════════════${NC}"
# ─────────────────────────────────────────────────────────────────────────────

run_test 18 "Optimize SVG: default (no compression)" "
const { SVGMakerClient } = require('./dist/cjs/index.js');
const client = new SVGMakerClient('${API_KEY}', { baseUrl: '${BASE_URL}', timeout: ${TIMEOUT} });
client.optimizeSvg.configure({ file: './tests/test-images/test.svg' }).execute().then(r => { console.log('Optimized SVG URL:', r.svgUrl); console.log('Expires in:', r.svgUrlExpiresIn); }).catch(e => console.error('ERROR:', e.message));
"

run_test 19 "Optimize SVG: with SVGZ compression" "
const { SVGMakerClient } = require('./dist/cjs/index.js');
const client = new SVGMakerClient('${API_KEY}', { baseUrl: '${BASE_URL}', timeout: ${TIMEOUT} });
client.optimizeSvg.configure({ file: './tests/test-images/test.svg', compress: true }).execute().then(r => { console.log('SVGZ URL:', r.svgzUrl); console.log('Filename:', r.filename); console.log('Compressed size:', r.compressedSize); }).catch(e => console.error('ERROR:', e.message));
"

# ─────────────────────────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}══════════════════════════════════════${NC}"
echo -e "${BOLD}  GENERATIONS TESTS  (limit: 1000/60s)${NC}"
echo -e "${BOLD}══════════════════════════════════════${NC}"
# ─────────────────────────────────────────────────────────────────────────────

run_test 20 "Generations: list (default)" "
const { SVGMakerClient } = require('./dist/cjs/index.js');
const client = new SVGMakerClient('${API_KEY}', { baseUrl: '${BASE_URL}', timeout: ${TIMEOUT} });
client.generations.list().then(r => { console.log('Items:', r.items); console.log('Pagination:', r.pagination); console.log('Metadata:', r.metadata); }).catch(e => console.error('ERROR:', e.message));
"

run_test 21 "Generations: list (with filters)" "
const { SVGMakerClient } = require('./dist/cjs/index.js');
const client = new SVGMakerClient('${API_KEY}', { baseUrl: '${BASE_URL}', timeout: ${TIMEOUT} });
client.generations.list({ page: 1, limit: 5, type: ['generate', 'edit'] }).then(r => { console.log('Items:', r.items); console.log('Pagination:', r.pagination); console.log('Metadata:', r.metadata); }).catch(e => console.error('ERROR:', e.message));
"

run_test 22 "Generations: list (with query)" "
const { SVGMakerClient } = require('./dist/cjs/index.js');
const client = new SVGMakerClient('${API_KEY}', { baseUrl: '${BASE_URL}', timeout: ${TIMEOUT} });
client.generations.list({ query: 'mountain', limit: 10 }).then(r => { console.log('Items:', r.items); console.log('Pagination:', r.pagination); console.log('Metadata:', r.metadata); }).catch(e => console.error('ERROR:', e.message));
"

run_test 23 "Generations: get by ID" "
const { SVGMakerClient } = require('./dist/cjs/index.js');
const client = new SVGMakerClient('${API_KEY}', { baseUrl: '${BASE_URL}', timeout: ${TIMEOUT} });
client.generations.get('${GENERATION_ID}').then(r => { console.log('ID:', r.id); console.log('Prompt:', r.prompt); console.log('Type:', r.type); console.log('Quality:', r.quality); console.log('Is Public:', r.isPublic); console.log('Metadata:', r.metadata); }).catch(e => console.error('ERROR:', e.message));
"

run_test 24 "Generations: share" "
const { SVGMakerClient } = require('./dist/cjs/index.js');
const client = new SVGMakerClient('${API_KEY}', { baseUrl: '${BASE_URL}', timeout: ${TIMEOUT} });
client.generations.share('${GENERATION_ID}').then(r => { console.log('Message:', r.message); console.log('Is Public:', r.isPublic); console.log('Share URL:', r.shareUrl); console.log('Metadata:', r.metadata); }).catch(e => console.error('ERROR:', e.message));
"

run_test 25 "Generations: download (SVG)" "
const { SVGMakerClient } = require('./dist/cjs/index.js');
const client = new SVGMakerClient('${API_KEY}', { baseUrl: '${BASE_URL}', timeout: ${TIMEOUT} });
client.generations.download('${GENERATION_ID}', { format: 'svg' }).then(r => { console.log('ID:', r.id); console.log('URL:', r.url); console.log('URL Expires In:', r.urlExpiresIn); console.log('Format:', r.format); console.log('Filename:', r.filename); console.log('Metadata:', r.metadata); }).catch(e => console.error('ERROR:', e.message));
"

run_test 26 "Generations: download (default format)" "
const { SVGMakerClient } = require('./dist/cjs/index.js');
const client = new SVGMakerClient('${API_KEY}', { baseUrl: '${BASE_URL}', timeout: ${TIMEOUT} });
client.generations.download('${GENERATION_ID}').then(r => { console.log('ID:', r.id); console.log('URL:', r.url); console.log('Format:', r.format); console.log('Filename:', r.filename); console.log('Metadata:', r.metadata); }).catch(e => console.error('ERROR:', e.message));
"

run_test 27 "Generations: download (SVGZ)" "
const { SVGMakerClient } = require('./dist/cjs/index.js');
const client = new SVGMakerClient('${API_KEY}', { baseUrl: '${BASE_URL}', timeout: ${TIMEOUT} });
client.generations.download('${GENERATION_ID}', { format: 'svgz' }).then(r => { console.log('ID:', r.id); console.log('URL:', r.url); console.log('URL Expires In:', r.urlExpiresIn); console.log('Format:', r.format); console.log('Filename:', r.filename); console.log('Metadata:', r.metadata); }).catch(e => console.error('ERROR:', e.message));
"

run_expected_fail 28 "Generations: get (invalid ID)" "
const { SVGMakerClient } = require('./dist/cjs/index.js');
const client = new SVGMakerClient('${API_KEY}', { baseUrl: '${BASE_URL}', timeout: ${TIMEOUT} });
client.generations.get('nonexistent-id-12345').then(r => { console.log('UNEXPECTED SUCCESS'); }).catch(e => console.log('EXPECTED ERROR:', e.message));
"

run_expected_fail 29 "Generations: list (invalid limit)" "
const { SVGMakerClient } = require('./dist/cjs/index.js');
const client = new SVGMakerClient('${API_KEY}', { baseUrl: '${BASE_URL}', timeout: ${TIMEOUT} });
client.generations.list({ limit: 200 }).then(r => { console.log('UNEXPECTED SUCCESS'); }).catch(e => console.log('EXPECTED ERROR:', e.message));
"

run_test 30 "Generations: delete (destructive — uses DELETE_GENERATION_ID)" "
const { SVGMakerClient } = require('./dist/cjs/index.js');
const client = new SVGMakerClient('${API_KEY}', { baseUrl: '${BASE_URL}', timeout: ${TIMEOUT} });
client.generations.delete('${DELETE_GENERATION_ID}').then(r => { console.log('Message:', r.message); console.log('Metadata:', r.metadata); }).catch(e => console.error('ERROR:', e.message));
"

# ─────────────────────────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}══════════════════════════════════════${NC}"
echo -e "${BOLD}  GALLERY TESTS  (list/get: 1000/60s, download: 5/60s)${NC}"
echo -e "${BOLD}══════════════════════════════════════${NC}"
# ─────────────────────────────────────────────────────────────────────────────

run_test 31 "Gallery: browse (default)" "
const { SVGMakerClient } = require('./dist/cjs/index.js');
const client = new SVGMakerClient('${API_KEY}', { baseUrl: '${BASE_URL}', timeout: ${TIMEOUT} });
client.gallery.list().then(r => { console.log('Items:', r.items); console.log('Pagination:', r.pagination); console.log('Metadata:', r.metadata); }).catch(e => console.error('ERROR:', e.message));
"

run_test 32 "Gallery: browse (with filters)" "
const { SVGMakerClient } = require('./dist/cjs/index.js');
const client = new SVGMakerClient('${API_KEY}', { baseUrl: '${BASE_URL}', timeout: ${TIMEOUT} });
client.gallery.list({ type: ['generate'], limit: 5 }).then(r => { console.log('Items:', r.items); console.log('Pagination:', r.pagination); console.log('Metadata:', r.metadata); }).catch(e => console.error('ERROR:', e.message));
"

run_test 33 "Gallery: browse (pro filter)" "
const { SVGMakerClient } = require('./dist/cjs/index.js');
const client = new SVGMakerClient('${API_KEY}', { baseUrl: '${BASE_URL}', timeout: ${TIMEOUT} });
client.gallery.list({ pro: 'true', limit: 10 }).then(r => { console.log('Items:', r.items); console.log('Pagination:', r.pagination); console.log('Metadata:', r.metadata); }).catch(e => console.error('ERROR:', e.message));
"

run_test 34 "Gallery: browse (with query)" "
const { SVGMakerClient } = require('./dist/cjs/index.js');
const client = new SVGMakerClient('${API_KEY}', { baseUrl: '${BASE_URL}', timeout: ${TIMEOUT} });
client.gallery.list({ query: 'mountain', limit: 10 }).then(r => { console.log('Items:', r.items); console.log('Pagination:', r.pagination); console.log('Metadata:', r.metadata); }).catch(e => console.error('ERROR:', e.message));
"

run_test 35 "Gallery: get by ID" "
const { SVGMakerClient } = require('./dist/cjs/index.js');
const client = new SVGMakerClient('${API_KEY}', { baseUrl: '${BASE_URL}', timeout: ${TIMEOUT} });
client.gallery.get('${GALLERY_ID}').then(r => { console.log('ID:', r.id); console.log('Prompt:', r.prompt); console.log('Type:', r.type); console.log('Quality:', r.quality); console.log('Is Public:', r.isPublic); console.log('Metadata:', r.metadata); }).catch(e => console.error('ERROR:', e.message));
"

run_test 36 "Gallery: get pro item" "
const { SVGMakerClient } = require('./dist/cjs/index.js');
const client = new SVGMakerClient('${API_KEY}', { baseUrl: '${BASE_URL}', timeout: ${TIMEOUT} });
client.gallery.get('${PRO_GALLERY_ID}').then(r => { console.log('ID:', r.id); console.log('Prompt:', r.prompt); console.log('Type:', r.type); console.log('Quality:', r.quality); console.log('Is Public:', r.isPublic); console.log('Metadata:', r.metadata); }).catch(e => console.error('ERROR:', e.message));
"

run_test 37 "Gallery: download (WebP — free)" "
const { SVGMakerClient } = require('./dist/cjs/index.js');
const client = new SVGMakerClient('${API_KEY}', { baseUrl: '${BASE_URL}', timeout: ${TIMEOUT} });
client.gallery.download('${GALLERY_ID}', { format: 'webp' }).then(r => { console.log('ID:', r.id); console.log('URL:', r.url); console.log('Format:', r.format); console.log('Filename:', r.filename); console.log('Metadata:', r.metadata); }).catch(e => console.error('ERROR:', e.message));
"

run_test 38 "Gallery: download (SVG — 1 credit)" "
const { SVGMakerClient } = require('./dist/cjs/index.js');
const client = new SVGMakerClient('${API_KEY}', { baseUrl: '${BASE_URL}', timeout: ${TIMEOUT} });
client.gallery.download('${GALLERY_ID}', { format: 'svg' }).then(r => { console.log('ID:', r.id); console.log('URL:', r.url); console.log('URL Expires In:', r.urlExpiresIn); console.log('Format:', r.format); console.log('Filename:', r.filename); console.log('Metadata:', r.metadata); }).catch(e => console.error('ERROR:', e.message));
"

run_test 39 "Gallery: download pro item (WebP — free for premium)" "
const { SVGMakerClient } = require('./dist/cjs/index.js');
const client = new SVGMakerClient('${API_KEY}', { baseUrl: '${BASE_URL}', timeout: ${TIMEOUT} });
client.gallery.download('${PRO_GALLERY_ID}', { format: 'webp' }).then(r => { console.log('ID:', r.id); console.log('URL:', r.url); console.log('Format:', r.format); console.log('Filename:', r.filename); console.log('Metadata:', r.metadata); }).catch(e => console.error('ERROR:', e.message));
"

run_expected_fail 40 "Gallery: get (invalid ID)" "
const { SVGMakerClient } = require('./dist/cjs/index.js');
const client = new SVGMakerClient('${API_KEY}', { baseUrl: '${BASE_URL}', timeout: ${TIMEOUT} });
client.gallery.get('nonexistent-id-12345').then(r => { console.log('UNEXPECTED SUCCESS'); }).catch(e => console.log('EXPECTED ERROR:', e.message));
"

# ─────────────────────────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}══════════════════════════════════════${NC}"
echo -e "${BOLD}  ACCOUNT TESTS  (limit: 1000/60s)${NC}"
echo -e "${BOLD}══════════════════════════════════════${NC}"
# ─────────────────────────────────────────────────────────────────────────────

run_test 41 "Account: get info" "
const { SVGMakerClient } = require('./dist/cjs/index.js');
const client = new SVGMakerClient('${API_KEY}', { baseUrl: '${BASE_URL}', timeout: ${TIMEOUT} });
client.account.getInfo().then(r => { console.log('Email:', r.email); console.log('Display Name:', r.displayName); console.log('Account Type:', r.accountType); console.log('Credits:', r.credits); console.log('Metadata:', r.metadata); }).catch(e => console.error('ERROR:', e.message));
"

run_test 42 "Account: all-time usage" "
const { SVGMakerClient } = require('./dist/cjs/index.js');
const client = new SVGMakerClient('${API_KEY}', { baseUrl: '${BASE_URL}', timeout: ${TIMEOUT} });
client.account.getUsage().then(r => { console.log('Period:', r.period); console.log('Summary:', r.summary); console.log('By Category:', JSON.stringify(r.byCategory, null, 2)); console.log('Metadata:', r.metadata); }).catch(e => console.error('ERROR:', e.message));
"

run_test 43 "Account: usage last 7 days" "
const { SVGMakerClient } = require('./dist/cjs/index.js');
const client = new SVGMakerClient('${API_KEY}', { baseUrl: '${BASE_URL}', timeout: ${TIMEOUT} });
client.account.getUsage({ days: 7 }).then(r => { console.log('Period:', r.period); console.log('Summary:', r.summary); console.log('Daily:', r.daily); console.log('All Time:', r.allTime); console.log('Metadata:', r.metadata); }).catch(e => console.error('ERROR:', e.message));
"

run_test 44 "Account: usage date range (2025-01-01 to 2025-06-30)" "
const { SVGMakerClient } = require('./dist/cjs/index.js');
const client = new SVGMakerClient('${API_KEY}', { baseUrl: '${BASE_URL}', timeout: ${TIMEOUT} });
client.account.getUsage({ start: '2025-01-01', end: '2025-06-30' }).then(r => { console.log('Period:', r.period); console.log('Summary:', r.summary); console.log('Daily:', r.daily); console.log('All Time:', r.allTime); console.log('Metadata:', r.metadata); }).catch(e => console.error('ERROR:', e.message));
"

run_expected_fail 45 "Account: usage with both days and start/end" "
const { SVGMakerClient } = require('./dist/cjs/index.js');
const client = new SVGMakerClient('${API_KEY}', { baseUrl: '${BASE_URL}', timeout: ${TIMEOUT} });
client.account.getUsage({ days: 7, start: '2025-01-01', end: '2025-01-31' }).then(r => { console.log('UNEXPECTED SUCCESS'); }).catch(e => console.log('EXPECTED ERROR:', e.message));
"

# =============================================================================
#  SUMMARY
# =============================================================================

echo ""
echo -e "${BOLD}══════════════════════════════════════════════════${NC}"
echo -e "${BOLD}  TEST RESULTS SUMMARY${NC}"
echo -e "${BOLD}══════════════════════════════════════════════════${NC}"
echo ""
echo -e "  Total:   ${BOLD}${TOTAL}${NC}"
echo -e "  Passed:  ${GREEN}${PASSED}${NC}"
echo -e "  Failed:  ${RED}${FAILED}${NC}"
echo -e "  Skipped: ${YELLOW}${SKIPPED}${NC}"
echo ""
echo -e "${BOLD}══════════════════════════════════════════════════${NC}"

if [ "$FAILED" -gt 0 ]; then
  echo -e "${RED}Some tests failed.${NC}"
  exit 1
else
  echo -e "${GREEN}All tests passed!${NC}"
  exit 0
fi
