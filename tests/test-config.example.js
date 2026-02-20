// =============================================================================
// SVGMaker SDK — Shared Test Configuration (Example)
// =============================================================================
// Copy this file to test-config.js and fill in your values:
//   cp tests/test-config.example.js tests/test-config.js
// =============================================================================

module.exports = {
  API_KEY: 'your-api-key-here',
  BASE_URL: 'https://api.svgmaker.io',
  TIMEOUT: 300000,
  DELAY: 3000,
  ASSETS_DIR: 'tests/assets',

  // IDs used by integration tests (GENERATION_ID and DELETE_GENERATION_ID are auto-populated)
  GALLERY_ID: 'REPLACE_ME',
  PRO_GALLERY_ID: 'REPLACE_ME',
};
