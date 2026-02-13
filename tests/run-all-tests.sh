#!/usr/bin/env bash
# =============================================================================
# SVGMaker SDK — Full Integration Test Suite (58 tests)
# =============================================================================

set -euo pipefail

# ─── Configuration ───────────────────────────────────────────────────────────
API_KEY="svgmaker-ioxxxx"
BASE_URL="http://localhost:3000/api"
DELAY=3        # seconds between tests
TIMEOUT=300000 # ms for SDK timeout

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
echo -e "${BOLD}  GENERATE TESTS${NC}"
echo -e "${BOLD}══════════════════════════════════════${NC}"
# ─────────────────────────────────────────────────────────────────────────────

run_test 1 "Generate: with model" "
const { SVGMakerClient } = require('./dist/cjs/index.js');
const client = new SVGMakerClient('${API_KEY}', { baseUrl: '${BASE_URL}', timeout: ${TIMEOUT} });
client.generate.configure({ prompt: 'A minimalist mountain landscape', model: 'gpt-image-1-mini' }).execute().then(r => { console.log('SVG URL:', r.svgUrl); console.log('Credits:', r.creditCost); console.log('Message:', r.message); console.log('Metadata:', r.metadata); console.log('Generation ID:', r.generationId); }).catch(e => console.error('ERROR:', e.message));
"

run_test 2 "Generate: with quality" "
const { SVGMakerClient } = require('./dist/cjs/index.js');
const client = new SVGMakerClient('${API_KEY}', { baseUrl: '${BASE_URL}', timeout: ${TIMEOUT} });
client.generate.configure({ prompt: 'A red sports car', quality: 'medium' }).execute().then(r => { console.log('SVG URL:', r.svgUrl); console.log('Credits:', r.creditCost); console.log('Message:', r.message); console.log('Metadata:', r.metadata); console.log('Generation ID:', r.generationId); }).catch(e => console.error('ERROR:', e.message));
"

run_expected_fail 3 "Generate: model+quality together" "
const { SVGMakerClient } = require('./dist/cjs/index.js');
const client = new SVGMakerClient('${API_KEY}', { baseUrl: '${BASE_URL}', timeout: ${TIMEOUT} });
client.generate.configure({ prompt: 'A cat on a fence', quality: 'medium', model: 'gpt-image-1-mini' }).execute().then(r => { console.log('UNEXPECTED SUCCESS - should have failed'); }).catch(e => console.log('EXPECTED ERROR:', e.message));
"

run_test 4 "Generate: storage false" "
const { SVGMakerClient } = require('./dist/cjs/index.js');
const client = new SVGMakerClient('${API_KEY}', { baseUrl: '${BASE_URL}', timeout: ${TIMEOUT} });
client.generate.configure({ prompt: 'A simple house icon', quality: 'low', storage: false }).execute().then(r => { console.log('SVG URL:', r.svgUrl); console.log('Credits:', r.creditCost); console.log('Generation ID:', r.generationId); console.log('URL expires in:', r.svgUrlExpiresIn); console.log('Metadata:', r.metadata); }).catch(e => console.error('ERROR:', e.message));
"

run_test 5 "Generate: storage true" "
const { SVGMakerClient } = require('./dist/cjs/index.js');
const client = new SVGMakerClient('${API_KEY}', { baseUrl: '${BASE_URL}', timeout: ${TIMEOUT} });
client.generate.configure({ prompt: 'A golden trophy', quality: 'medium', storage: true }).execute().then(r => { console.log('SVG URL:', r.svgUrl); console.log('Credits:', r.creditCost); console.log('Generation ID:', r.generationId); console.log('URL expires in:', r.svgUrlExpiresIn); console.log('Message:', r.message); console.log('Metadata:', r.metadata); }).catch(e => console.error('ERROR:', e.message));
"

run_stream_test 6 "Generate: stream" "
const { SVGMakerClient } = require('./dist/cjs/index.js');
const client = new SVGMakerClient('${API_KEY}', { baseUrl: '${BASE_URL}', timeout: ${TIMEOUT} });
const stream = client.generate.configure({ prompt: 'A rocket launching into space', quality: 'low' }).stream();
stream.on('data', (e) => { console.log('Event:', e.status, e.message || ''); if (e.status === 'complete') { console.log('SVG URL:', e.svgUrl); console.log('Credits:', e.creditCost); console.log('Generation ID:', e.generationId); } });
stream.on('end', () => console.log('Stream ended'));
stream.on('error', (e) => console.error('ERROR:', e.message));
setTimeout(() => process.exit(0), 120000);
"

run_test 7 "Generate: styleParams + aspectRatio + background" "
const { SVGMakerClient } = require('./dist/cjs/index.js');
const client = new SVGMakerClient('${API_KEY}', { baseUrl: '${BASE_URL}', timeout: ${TIMEOUT} });
client.generate.configure({ prompt: 'A forest with tall trees and a river', quality: 'low', aspectRatio: 'landscape', background: 'transparent', styleParams: { style: 'flat', color_mode: 'few_colors', image_complexity: 'scene', composition: 'full_scene' } }).execute().then(r => { console.log('SVG URL:', r.svgUrl); console.log('Credits:', r.creditCost); console.log('Message:', r.message); console.log('Metadata:', r.metadata); }).catch(e => console.error('ERROR:', e.message));
"

# ─────────────────────────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}══════════════════════════════════════${NC}"
echo -e "${BOLD}  EDIT TESTS${NC}"
echo -e "${BOLD}══════════════════════════════════════${NC}"
# ─────────────────────────────────────────────────────────────────────────────

run_test 8 "Edit: with model" "
const { SVGMakerClient } = require('./dist/cjs/index.js');
const client = new SVGMakerClient('${API_KEY}', { baseUrl: '${BASE_URL}', timeout: ${TIMEOUT} });
client.edit.configure({ image: 'tests/test-images/test-image.png', prompt: 'Add a golden frame around this image', model: 'gpt-image-1-mini' }).execute().then(r => { console.log('SVG URL:', r.svgUrl); console.log('Credits:', r.creditCost); console.log('Message:', r.message); console.log('Metadata:', r.metadata); console.log('Generation ID:', r.generationId); }).catch(e => console.error('ERROR:', e.message));
"

run_test 9 "Edit: with quality" "
const { SVGMakerClient } = require('./dist/cjs/index.js');
const client = new SVGMakerClient('${API_KEY}', { baseUrl: '${BASE_URL}', timeout: ${TIMEOUT} });
client.edit.configure({ image: 'tests/test-images/test-image.png', prompt: 'Make the background blue', quality: 'low' }).execute().then(r => { console.log('SVG URL:', r.svgUrl); console.log('Credits:', r.creditCost); console.log('Message:', r.message); console.log('Metadata:', r.metadata); }).catch(e => console.error('ERROR:', e.message));
"

run_expected_fail 10 "Edit: model+quality together" "
const { SVGMakerClient } = require('./dist/cjs/index.js');
const client = new SVGMakerClient('${API_KEY}', { baseUrl: '${BASE_URL}', timeout: ${TIMEOUT} });
client.edit.configure({ image: 'tests/test-images/test-image.png', prompt: 'Add stars', quality: 'medium', model: 'gpt-image-1-mini' }).execute().then(r => { console.log('UNEXPECTED SUCCESS - should have failed'); }).catch(e => console.log('EXPECTED ERROR:', e.message));
"

run_test 11 "Edit: storage false" "
const { SVGMakerClient } = require('./dist/cjs/index.js');
const client = new SVGMakerClient('${API_KEY}', { baseUrl: '${BASE_URL}', timeout: ${TIMEOUT} });
client.edit.configure({ image: 'tests/test-images/test-image.png', prompt: 'Convert to silhouette style', quality: 'low', storage: false }).execute().then(r => { console.log('SVG URL:', r.svgUrl); console.log('Credits:', r.creditCost); console.log('Generation ID:', r.generationId); console.log('URL expires in:', r.svgUrlExpiresIn); console.log('Metadata:', r.metadata); }).catch(e => console.error('ERROR:', e.message));
"

run_test 12 "Edit: storage true" "
const { SVGMakerClient } = require('./dist/cjs/index.js');
const client = new SVGMakerClient('${API_KEY}', { baseUrl: '${BASE_URL}', timeout: ${TIMEOUT} });
client.edit.configure({ image: 'tests/test-images/test-image.png', prompt: 'Add a sunset gradient', quality: 'low', storage: true }).execute().then(r => { console.log('SVG URL:', r.svgUrl); console.log('Credits:', r.creditCost); console.log('Generation ID:', r.generationId); console.log('URL expires in:', r.svgUrlExpiresIn); console.log('Message:', r.message); console.log('Metadata:', r.metadata); }).catch(e => console.error('ERROR:', e.message));
"

run_stream_test 13 "Edit: stream" "
const { SVGMakerClient } = require('./dist/cjs/index.js');
const client = new SVGMakerClient('${API_KEY}', { baseUrl: '${BASE_URL}', timeout: ${TIMEOUT} });
const stream = client.edit.configure({ image: 'tests/test-images/test-image.png', prompt: 'Make it look like a cartoon', quality: 'low' }).stream();
stream.on('data', (e) => { console.log('Event:', e.status, e.message || ''); if (e.status === 'complete') { console.log('SVG URL:', e.svgUrl); console.log('Credits:', e.creditCost); console.log('Generation ID:', e.generationId); } });
stream.on('end', () => console.log('Stream ended'));
stream.on('error', (e) => console.error('ERROR:', e.message));
setTimeout(() => process.exit(0), 120000);
"

run_test 14 "Edit: styleParams + aspectRatio + background" "
const { SVGMakerClient } = require('./dist/cjs/index.js');
const client = new SVGMakerClient('${API_KEY}', { baseUrl: '${BASE_URL}', timeout: ${TIMEOUT} });
client.edit.configure({ image: 'tests/test-images/test-image.png', prompt: 'Restyle this image', quality: 'low', aspectRatio: 'square', background: 'opaque', styleParams: { style: 'isometric', color_mode: 'monochrome', composition: 'centered_object' } }).execute().then(r => { console.log('SVG URL:', r.svgUrl); console.log('Credits:', r.creditCost); console.log('Message:', r.message); console.log('Metadata:', r.metadata); }).catch(e => console.error('ERROR:', e.message));
"

# ─────────────────────────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}══════════════════════════════════════${NC}"
echo -e "${BOLD}  CONVERT — AI VECTORIZE TESTS${NC}"
echo -e "${BOLD}══════════════════════════════════════${NC}"
# ─────────────────────────────────────────────────────────────────────────────

run_test 15 "AI Vectorize: without stream" "
const { SVGMakerClient } = require('./dist/cjs/index.js');
const client = new SVGMakerClient('${API_KEY}', { baseUrl: '${BASE_URL}', timeout: ${TIMEOUT} });
client.convert.aiVectorize.configure({ file: 'tests/test-images/test-image.png' }).execute().then(r => { console.log('SVG URL:', r.svgUrl); console.log('Credits:', r.creditCost); console.log('Message:', r.message); console.log('Generation ID:', r.generationId); console.log('Metadata:', r.metadata); }).catch(e => console.error('ERROR:', e.message));
"

run_stream_test 16 "AI Vectorize: with stream" "
const { SVGMakerClient } = require('./dist/cjs/index.js');
const client = new SVGMakerClient('${API_KEY}', { baseUrl: '${BASE_URL}', timeout: ${TIMEOUT} });
const stream = client.convert.aiVectorize.configure({ file: 'tests/test-images/test-image.png' }).stream();
stream.on('data', (e) => { console.log('Event:', e.status, e.message || ''); if (e.status === 'complete') { console.log('SVG URL:', e.svgUrl); console.log('Credits:', e.creditCost); console.log('Generation ID:', e.generationId); } });
stream.on('end', () => console.log('Stream ended'));
stream.on('error', (e) => console.error('ERROR:', e.message));
setTimeout(() => process.exit(0), 120000);
"

run_test 17 "AI Vectorize: storage true" "
const { SVGMakerClient } = require('./dist/cjs/index.js');
const client = new SVGMakerClient('${API_KEY}', { baseUrl: '${BASE_URL}', timeout: ${TIMEOUT} });
client.convert.aiVectorize.configure({ file: 'tests/test-images/test-image.png', storage: true }).execute().then(r => { console.log('SVG URL:', r.svgUrl); console.log('Credits:', r.creditCost); console.log('Message:', r.message); console.log('Generation ID:', r.generationId); console.log('URL expires in:', r.svgUrlExpiresIn); console.log('Metadata:', r.metadata); }).catch(e => console.error('ERROR:', e.message));
"

# ─────────────────────────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}══════════════════════════════════════${NC}"
echo -e "${BOLD}  GENERATIONS TESTS${NC}"
echo -e "${BOLD}══════════════════════════════════════${NC}"
# ─────────────────────────────────────────────────────────────────────────────

run_test 18 "Generations: list (default)" "
const { SVGMakerClient } = require('./dist/cjs/index.js');
const client = new SVGMakerClient('${API_KEY}', { baseUrl: '${BASE_URL}', timeout: ${TIMEOUT} });
client.generations.list().then(r => { console.log('Items:', r.items); console.log('Pagination:', r.pagination); console.log('Metadata:', r.metadata); }).catch(e => console.error('ERROR:', e.message));
"

run_test 19 "Generations: list (with filters)" "
const { SVGMakerClient } = require('./dist/cjs/index.js');
const client = new SVGMakerClient('${API_KEY}', { baseUrl: '${BASE_URL}', timeout: ${TIMEOUT} });
client.generations.list({ page: 1, limit: 5, type: ['generate', 'edit'] }).then(r => { console.log('Items:', r.items); console.log('Pagination:', r.pagination); console.log('Metadata:', r.metadata); }).catch(e => console.error('ERROR:', e.message));
"

run_test 20 "Generations: list (with query)" "
const { SVGMakerClient } = require('./dist/cjs/index.js');
const client = new SVGMakerClient('${API_KEY}', { baseUrl: '${BASE_URL}', timeout: ${TIMEOUT} });
client.generations.list({ query: 'mountain', limit: 10 }).then(r => { console.log('Items:', r.items); console.log('Pagination:', r.pagination); console.log('Metadata:', r.metadata); }).catch(e => console.error('ERROR:', e.message));
"

run_test 21 "Generations: get by ID" "
const { SVGMakerClient } = require('./dist/cjs/index.js');
const client = new SVGMakerClient('${API_KEY}', { baseUrl: '${BASE_URL}', timeout: ${TIMEOUT} });
client.generations.get('seed-gen-025').then(r => { console.log('ID:', r.id); console.log('Prompt:', r.prompt); console.log('Type:', r.type); console.log('Quality:', r.quality); console.log('Is Public:', r.isPublic); console.log('Metadata:', r.metadata); }).catch(e => console.error('ERROR:', e.message));
"

run_test 22 "Generations: share" "
const { SVGMakerClient } = require('./dist/cjs/index.js');
const client = new SVGMakerClient('${API_KEY}', { baseUrl: '${BASE_URL}', timeout: ${TIMEOUT} });
client.generations.share('seed-gen-025').then(r => { console.log('Message:', r.message); console.log('Is Public:', r.isPublic); console.log('Share URL:', r.shareUrl); console.log('Metadata:', r.metadata); }).catch(e => console.error('ERROR:', e.message));
"

run_test 23 "Generations: download (SVG)" "
const { SVGMakerClient } = require('./dist/cjs/index.js');
const client = new SVGMakerClient('${API_KEY}', { baseUrl: '${BASE_URL}', timeout: ${TIMEOUT} });
client.generations.download('seed-gen-025', { format: 'svg' }).then(r => { console.log('ID:', r.id); console.log('URL:', r.url); console.log('URL Expires In:', r.urlExpiresIn); console.log('Format:', r.format); console.log('Filename:', r.filename); console.log('Metadata:', r.metadata); }).catch(e => console.error('ERROR:', e.message));
"

run_test 24 "Generations: download (default format)" "
const { SVGMakerClient } = require('./dist/cjs/index.js');
const client = new SVGMakerClient('${API_KEY}', { baseUrl: '${BASE_URL}', timeout: ${TIMEOUT} });
client.generations.download('seed-gen-025').then(r => { console.log('ID:', r.id); console.log('URL:', r.url); console.log('Format:', r.format); console.log('Filename:', r.filename); console.log('Metadata:', r.metadata); }).catch(e => console.error('ERROR:', e.message));
"

run_test 25 "Generations: download (SVGZ)" "
const { SVGMakerClient } = require('./dist/cjs/index.js');
const client = new SVGMakerClient('${API_KEY}', { baseUrl: '${BASE_URL}', timeout: ${TIMEOUT} });
client.generations.download('seed-gen-025', { format: 'svgz' }).then(r => { console.log('ID:', r.id); console.log('URL:', r.url); console.log('URL Expires In:', r.urlExpiresIn); console.log('Format:', r.format); console.log('Filename:', r.filename); console.log('Metadata:', r.metadata); }).catch(e => console.error('ERROR:', e.message));
"

run_test 26 "Generations: delete (destructive)" "
const { SVGMakerClient } = require('./dist/cjs/index.js');
const client = new SVGMakerClient('${API_KEY}', { baseUrl: '${BASE_URL}', timeout: ${TIMEOUT} });
client.generations.delete('seed-gen-025').then(r => { console.log('Message:', r.message); console.log('Metadata:', r.metadata); }).catch(e => console.error('ERROR:', e.message));
"

run_expected_fail 27 "Generations: get (invalid ID)" "
const { SVGMakerClient } = require('./dist/cjs/index.js');
const client = new SVGMakerClient('${API_KEY}', { baseUrl: '${BASE_URL}', timeout: ${TIMEOUT} });
client.generations.get('nonexistent-id-12345').then(r => { console.log('UNEXPECTED SUCCESS'); }).catch(e => console.log('EXPECTED ERROR:', e.message));
"

run_expected_fail 28 "Generations: list (invalid limit)" "
const { SVGMakerClient } = require('./dist/cjs/index.js');
const client = new SVGMakerClient('${API_KEY}', { baseUrl: '${BASE_URL}', timeout: ${TIMEOUT} });
client.generations.list({ limit: 200 }).then(r => { console.log('UNEXPECTED SUCCESS'); }).catch(e => console.log('EXPECTED ERROR:', e.message));
"

run_expected_fail 29 "Generations: get private item (should fail)" "
const { SVGMakerClient } = require('./dist/cjs/index.js');
const client = new SVGMakerClient('${API_KEY}', { baseUrl: '${BASE_URL}', timeout: ${TIMEOUT} });
client.generations.get('seed-gen-001').then(r => { console.log('UNEXPECTED SUCCESS'); }).catch(e => console.log('EXPECTED ERROR:', e.message));
"

# ─────────────────────────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}══════════════════════════════════════${NC}"
echo -e "${BOLD}  GALLERY TESTS${NC}"
echo -e "${BOLD}══════════════════════════════════════${NC}"
# ─────────────────────────────────────────────────────────────────────────────

run_test 30 "Gallery: browse (default)" "
const { SVGMakerClient } = require('./dist/cjs/index.js');
const client = new SVGMakerClient('${API_KEY}', { baseUrl: '${BASE_URL}', timeout: ${TIMEOUT} });
client.gallery.list().then(r => { console.log('Items:', r.items); console.log('Pagination:', r.pagination); console.log('Metadata:', r.metadata); }).catch(e => console.error('ERROR:', e.message));
"

run_test 31 "Gallery: browse (with filters)" "
const { SVGMakerClient } = require('./dist/cjs/index.js');
const client = new SVGMakerClient('${API_KEY}', { baseUrl: '${BASE_URL}', timeout: ${TIMEOUT} });
client.gallery.list({ page: 1, limit: 5, type: ['generate', 'edit'] }).then(r => { console.log('Items:', r.items); console.log('Pagination:', r.pagination); console.log('Metadata:', r.metadata); }).catch(e => console.error('ERROR:', e.message));
"

run_test 32 "Gallery: browse (pro filter)" "
const { SVGMakerClient } = require('./dist/cjs/index.js');
const client = new SVGMakerClient('${API_KEY}', { baseUrl: '${BASE_URL}', timeout: ${TIMEOUT} });
client.gallery.list({ pro: 'true', limit: 10 }).then(r => { console.log('Items:', r.items); console.log('Pagination:', r.pagination); console.log('Metadata:', r.metadata); }).catch(e => console.error('ERROR:', e.message));
"

run_test 33 "Gallery: browse (gold filter)" "
const { SVGMakerClient } = require('./dist/cjs/index.js');
const client = new SVGMakerClient('${API_KEY}', { baseUrl: '${BASE_URL}', timeout: ${TIMEOUT} });
client.gallery.list({ gold: 'true', limit: 10 }).then(r => { console.log('Items:', r.items); console.log('Pagination:', r.pagination); console.log('Metadata:', r.metadata); }).catch(e => console.error('ERROR:', e.message));
"

run_test 34 "Gallery: browse (with query)" "
const { SVGMakerClient } = require('./dist/cjs/index.js');
const client = new SVGMakerClient('${API_KEY}', { baseUrl: '${BASE_URL}', timeout: ${TIMEOUT} });
client.gallery.list({ query: 'mountain', limit: 10 }).then(r => { console.log('Items:', r.items); console.log('Pagination:', r.pagination); console.log('Metadata:', r.metadata); }).catch(e => console.error('ERROR:', e.message));
"

run_test 35 "Gallery: get by ID" "
const { SVGMakerClient } = require('./dist/cjs/index.js');
const client = new SVGMakerClient('${API_KEY}', { baseUrl: '${BASE_URL}', timeout: ${TIMEOUT} });
client.gallery.get('seed-gen-018').then(r => { console.log('ID:', r.id); console.log('Prompt:', r.prompt); console.log('Type:', r.type); console.log('Quality:', r.quality); console.log('Is Public:', r.isPublic); console.log('Metadata:', r.metadata); }).catch(e => console.error('ERROR:', e.message));
"

run_test 36 "Gallery: download (SVG — costs 1 credit)" "
const { SVGMakerClient } = require('./dist/cjs/index.js');
const client = new SVGMakerClient('${API_KEY}', { baseUrl: '${BASE_URL}', timeout: ${TIMEOUT} });
client.gallery.download('seed-gen-018', { format: 'svg' }).then(r => { console.log('ID:', r.id); console.log('URL:', r.url); console.log('URL Expires In:', r.urlExpiresIn); console.log('Format:', r.format); console.log('Filename:', r.filename); console.log('Metadata:', r.metadata); }).catch(e => console.error('ERROR:', e.message));
"

run_test 37 "Gallery: download (WebP — free)" "
const { SVGMakerClient } = require('./dist/cjs/index.js');
const client = new SVGMakerClient('${API_KEY}', { baseUrl: '${BASE_URL}', timeout: ${TIMEOUT} });
client.gallery.download('seed-gen-018', { format: 'webp' }).then(r => { console.log('ID:', r.id); console.log('URL:', r.url); console.log('Format:', r.format); console.log('Filename:', r.filename); console.log('Metadata:', r.metadata); }).catch(e => console.error('ERROR:', e.message));
"

run_test 38 "Gallery: download (default format)" "
const { SVGMakerClient } = require('./dist/cjs/index.js');
const client = new SVGMakerClient('${API_KEY}', { baseUrl: '${BASE_URL}', timeout: ${TIMEOUT} });
client.gallery.download('seed-gen-018').then(r => { console.log('ID:', r.id); console.log('URL:', r.url); console.log('Format:', r.format); console.log('Filename:', r.filename); console.log('Metadata:', r.metadata); }).catch(e => console.error('ERROR:', e.message));
"

run_expected_fail 39 "Gallery: get (invalid ID)" "
const { SVGMakerClient } = require('./dist/cjs/index.js');
const client = new SVGMakerClient('${API_KEY}', { baseUrl: '${BASE_URL}', timeout: ${TIMEOUT} });
client.gallery.get('nonexistent-id-12345').then(r => { console.log('UNEXPECTED SUCCESS'); }).catch(e => console.log('EXPECTED ERROR:', e.message));
"

run_expected_fail 40 "Gallery: list (invalid limit)" "
const { SVGMakerClient } = require('./dist/cjs/index.js');
const client = new SVGMakerClient('${API_KEY}', { baseUrl: '${BASE_URL}', timeout: ${TIMEOUT} });
client.gallery.list({ limit: 200 }).then(r => { console.log('UNEXPECTED SUCCESS'); }).catch(e => console.log('EXPECTED ERROR:', e.message));
"

run_test 41 "Gallery: get pro item" "
const { SVGMakerClient } = require('./dist/cjs/index.js');
const client = new SVGMakerClient('${API_KEY}', { baseUrl: '${BASE_URL}', timeout: ${TIMEOUT} });
client.gallery.get('seed-gen-016').then(r => { console.log('ID:', r.id); console.log('Prompt:', r.prompt); console.log('Type:', r.type); console.log('Quality:', r.quality); console.log('Is Public:', r.isPublic); console.log('Metadata:', r.metadata); }).catch(e => console.error('ERROR:', e.message));
"

run_test 42 "Gallery: download pro item (WebP — free)" "
const { SVGMakerClient } = require('./dist/cjs/index.js');
const client = new SVGMakerClient('${API_KEY}', { baseUrl: '${BASE_URL}', timeout: ${TIMEOUT} });
client.gallery.download('seed-gen-016', { format: 'webp' }).then(r => { console.log('ID:', r.id); console.log('URL:', r.url); console.log('Format:', r.format); console.log('Filename:', r.filename); console.log('Metadata:', r.metadata); }).catch(e => console.error('ERROR:', e.message));
"

run_expected_fail 43 "Gallery: get private item (should fail)" "
const { SVGMakerClient } = require('./dist/cjs/index.js');
const client = new SVGMakerClient('${API_KEY}', { baseUrl: '${BASE_URL}', timeout: ${TIMEOUT} });
client.gallery.get('seed-gen-020').then(r => { console.log('UNEXPECTED SUCCESS'); }).catch(e => console.log('EXPECTED ERROR:', e.message));
"

# ─────────────────────────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}══════════════════════════════════════${NC}"
echo -e "${BOLD}  ACCOUNT TESTS${NC}"
echo -e "${BOLD}══════════════════════════════════════${NC}"
# ─────────────────────────────────────────────────────────────────────────────

run_test 44 "Account: get info" "
const { SVGMakerClient } = require('./dist/cjs/index.js');
const client = new SVGMakerClient('${API_KEY}', { baseUrl: '${BASE_URL}', timeout: ${TIMEOUT} });
client.account.getInfo().then(r => { console.log('Email:', r.email); console.log('Display Name:', r.displayName); console.log('Account Type:', r.accountType); console.log('Credits:', r.credits); console.log('Metadata:', r.metadata); }).catch(e => console.error('ERROR:', e.message));
"

run_test 45 "Account: all-time usage" "
const { SVGMakerClient } = require('./dist/cjs/index.js');
const client = new SVGMakerClient('${API_KEY}', { baseUrl: '${BASE_URL}', timeout: ${TIMEOUT} });
client.account.getUsage().then(r => { console.log('Period:', r.period); console.log('Summary:', r.summary); console.log('By Category:', JSON.stringify(r.byCategory, null, 2)); console.log('Metadata:', r.metadata); }).catch(e => console.error('ERROR:', e.message));
"

run_test 46 "Account: usage last 7 days" "
const { SVGMakerClient } = require('./dist/cjs/index.js');
const client = new SVGMakerClient('${API_KEY}', { baseUrl: '${BASE_URL}', timeout: ${TIMEOUT} });
client.account.getUsage({ days: 7 }).then(r => { console.log('Period:', r.period); console.log('Summary:', r.summary); console.log('Daily:', r.daily); console.log('All Time:', r.allTime); console.log('Metadata:', r.metadata); }).catch(e => console.error('ERROR:', e.message));
"

run_test 47 "Account: usage for date range" "
const { SVGMakerClient } = require('./dist/cjs/index.js');
const client = new SVGMakerClient('${API_KEY}', { baseUrl: '${BASE_URL}', timeout: ${TIMEOUT} });
client.account.getUsage({ start: '2025-01-01', end: '2025-01-31' }).then(r => { console.log('Period:', r.period); console.log('Summary:', r.summary); console.log('Daily:', r.daily); console.log('All Time:', r.allTime); console.log('Metadata:', r.metadata); }).catch(e => console.error('ERROR:', e.message));
"

run_expected_fail 48 "Account: usage with both days and start/end" "
const { SVGMakerClient } = require('./dist/cjs/index.js');
const client = new SVGMakerClient('${API_KEY}', { baseUrl: '${BASE_URL}', timeout: ${TIMEOUT} });
client.account.getUsage({ days: 7, start: '2025-01-01', end: '2025-01-31' }).then(r => { console.log('UNEXPECTED SUCCESS'); }).catch(e => console.log('EXPECTED ERROR:', e.message));
"

# ─────────────────────────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}══════════════════════════════════════${NC}"
echo -e "${BOLD}  OPTIMIZE SVG TESTS${NC}"
echo -e "${BOLD}══════════════════════════════════════${NC}"
# ─────────────────────────────────────────────────────────────────────────────

run_test 49 "Optimize SVG: default (no compression)" "
const { SVGMakerClient } = require('./dist/cjs/index.js');
const client = new SVGMakerClient('${API_KEY}', { baseUrl: '${BASE_URL}', timeout: ${TIMEOUT} });
client.optimizeSvg.configure({ file: './tests/test-images/test.svg' }).execute().then(r => { console.log('Optimized SVG URL:', r.svgUrl); console.log('Expires in:', r.svgUrlExpiresIn); }).catch(e => console.error('ERROR:', e.message));
"

run_test 50 "Optimize SVG: with SVGZ compression" "
const { SVGMakerClient } = require('./dist/cjs/index.js');
const client = new SVGMakerClient('${API_KEY}', { baseUrl: '${BASE_URL}', timeout: ${TIMEOUT} });
client.optimizeSvg.configure({ file: './tests/test-images/test.svg', compress: true }).execute().then(r => { console.log('SVGZ URL:', r.svgzUrl); console.log('Filename:', r.filename); console.log('Compressed size:', r.compressedSize); }).catch(e => console.error('ERROR:', e.message));
"

# ─────────────────────────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}══════════════════════════════════════${NC}"
echo -e "${BOLD}  CONVERT — TRACE TESTS${NC}"
echo -e "${BOLD}══════════════════════════════════════${NC}"
# ─────────────────────────────────────────────────────────────────────────────

run_test 51 "Trace: default settings" "
const { SVGMakerClient } = require('./dist/cjs/index.js');
const client = new SVGMakerClient('${API_KEY}', { baseUrl: '${BASE_URL}', timeout: ${TIMEOUT} });
client.convert.trace.configure({ file: './tests/test-images/test-image.png' }).execute().then(r => { console.log('Results:', JSON.stringify(r.results, null, 2)); console.log('Summary:', r.summary); console.log('Metadata:', r.metadata); }).catch(e => console.error('ERROR:', e.message));
"

run_test 52 "Trace: custom params" "
const { SVGMakerClient } = require('./dist/cjs/index.js');
const client = new SVGMakerClient('${API_KEY}', { baseUrl: '${BASE_URL}', timeout: ${TIMEOUT} });
client.convert.trace.configure({ file: './tests/test-images/test-image.png', preset: 'photo', mode: 'spline', detail: 60, smoothness: 70 }).execute().then(r => { console.log('Results:', JSON.stringify(r.results, null, 2)); console.log('Summary:', r.summary); console.log('Metadata:', r.metadata); }).catch(e => console.error('ERROR:', e.message));
"

# ─────────────────────────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}══════════════════════════════════════${NC}"
echo -e "${BOLD}  CONVERT — SVG TO VECTOR TESTS${NC}"
echo -e "${BOLD}══════════════════════════════════════${NC}"
# ─────────────────────────────────────────────────────────────────────────────

run_test 53 "SVG to Vector: convert to PDF" "
const { SVGMakerClient } = require('./dist/cjs/index.js');
const client = new SVGMakerClient('${API_KEY}', { baseUrl: '${BASE_URL}', timeout: ${TIMEOUT} });
client.convert.svgToVector.configure({ file: './tests/test-images/test.svg', toFormat: 'PDF' }).execute().then(r => { console.log('Results:', JSON.stringify(r.results, null, 2)); console.log('Summary:', r.summary); console.log('Metadata:', r.metadata); }).catch(e => console.error('ERROR:', e.message));
"

run_test 54 "SVG to Vector: convert to DXF with textToPath" "
const { SVGMakerClient } = require('./dist/cjs/index.js');
const client = new SVGMakerClient('${API_KEY}', { baseUrl: '${BASE_URL}', timeout: ${TIMEOUT} });
client.convert.svgToVector.configure({ file: './tests/test-images/test.svg', toFormat: 'DXF', textToPath: true }).execute().then(r => { console.log('Results:', JSON.stringify(r.results, null, 2)); console.log('Summary:', r.summary); console.log('Metadata:', r.metadata); }).catch(e => console.error('ERROR:', e.message));
"

# ─────────────────────────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}══════════════════════════════════════${NC}"
echo -e "${BOLD}  CONVERT — RASTER TO RASTER TESTS${NC}"
echo -e "${BOLD}══════════════════════════════════════${NC}"
# ─────────────────────────────────────────────────────────────────────────────

run_test 55 "Raster to Raster: PNG to JPG with quality" "
const { SVGMakerClient } = require('./dist/cjs/index.js');
const client = new SVGMakerClient('${API_KEY}', { baseUrl: '${BASE_URL}', timeout: ${TIMEOUT} });
client.convert.rasterToRaster.configure({ file: './tests/test-images/test-image.png', toFormat: 'JPG', quality: 85 }).execute().then(r => { console.log('Results:', JSON.stringify(r.results, null, 2)); console.log('Summary:', r.summary); console.log('Metadata:', r.metadata); }).catch(e => console.error('ERROR:', e.message));
"

run_test 56 "Raster to Raster: PNG to WEBP with width resize" "
const { SVGMakerClient } = require('./dist/cjs/index.js');
const client = new SVGMakerClient('${API_KEY}', { baseUrl: '${BASE_URL}', timeout: ${TIMEOUT} });
client.convert.rasterToRaster.configure({ file: './tests/test-images/test-image.png', toFormat: 'WEBP', width: 512 }).execute().then(r => { console.log('Results:', JSON.stringify(r.results, null, 2)); console.log('Summary:', r.summary); console.log('Metadata:', r.metadata); }).catch(e => console.error('ERROR:', e.message));
"

# ─────────────────────────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}══════════════════════════════════════${NC}"
echo -e "${BOLD}  BATCH CONVERT TESTS${NC}"
echo -e "${BOLD}══════════════════════════════════════${NC}"
# ─────────────────────────────────────────────────────────────────────────────

run_test 57 "Batch Convert: multiple files to SVG" "
const { SVGMakerClient } = require('./dist/cjs/index.js');
const client = new SVGMakerClient('${API_KEY}', { baseUrl: '${BASE_URL}', timeout: ${TIMEOUT} });
client.convert.batch.configure({ files: ['./tests/test-images/test-image.png', './tests/test-images/test-image.png'], toFormat: 'SVG' }).execute().then(r => { console.log('Results:', JSON.stringify(r.results, null, 2)); console.log('Summary:', r.summary); console.log('Metadata:', r.metadata); }).catch(e => console.error('ERROR:', e.message));
"

# ─────────────────────────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}══════════════════════════════════════${NC}"
echo -e "${BOLD}  ENHANCE PROMPT TESTS${NC}"
echo -e "${BOLD}══════════════════════════════════════${NC}"
# ─────────────────────────────────────────────────────────────────────────────

run_test 58 "Enhance Prompt: basic" "
const { SVGMakerClient } = require('./dist/cjs/index.js');
const client = new SVGMakerClient('${API_KEY}', { baseUrl: '${BASE_URL}', timeout: ${TIMEOUT} });
client.enhancePrompt.configure({ prompt: 'a cat sitting on a fence' }).execute().then(r => { console.log('Enhanced Prompt:', r.enhancedPrompt); console.log('Metadata:', r.metadata); }).catch(e => console.error('ERROR:', e.message));
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
