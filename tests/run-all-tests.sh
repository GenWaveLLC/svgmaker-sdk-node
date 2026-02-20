#!/usr/bin/env bash
# =============================================================================
# SVGMaker SDK — Integration Test Runner (thin wrapper)
# Builds the SDK then runs the Node.js integration test suite.
# =============================================================================

set -euo pipefail

# Ensure we run from the project root (parent of this script's directory)
cd "$(dirname "$0")/.."

BOLD='\033[1m'
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

# ─── Pre-flight build ───────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}Running npm run build...${NC}"
if ! npm run build; then
  echo -e "${RED}Build failed — aborting tests.${NC}"
  exit 1
fi
echo -e "${GREEN}Build succeeded.${NC}"
echo ""

# ─── Run tests ──────────────────────────────────────────────────
node tests/run-integration-tests.js
node tests/run-streaming-tests.js
