# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed
- Fix AI-enhanced release notes failing silently due to missing `models: read` permission in release job
- Add test workflow for verifying GitHub Models API access

## [1.0.0] - 2026-02-19

### Breaking Changes
- Migrated SDK base URL from `svgmaker.io/api` to `api.svgmaker.io`
- Updated response types to match v1 API

### Added
- v1 API support with model parameter and stream field accumulation
- Gallery endpoint
- Account endpoint
- SVG optimize route
- Convert and enhance API endpoints
- Integration test runner (58 tests) migrated from bash to Node.js with streaming test suite
- Automated release flow with AI-generated changelog
- `prepare-release` slash command for automated version bump workflow
- v1.0.0 migration guide and breaking changes documentation in README

### Changed
- Updated `actions/setup-node` from v4 to v6 in all workflows

## [0.3.1] - 2025-12-11

### Fixed
- Fix TypeScript error for Buffer to Blob conversion
- Update Edit API to support all quality levels and fix docs

### Changed
- Update release workflow for npm OIDC trusted publishing
- Updated SDK documentation

## [0.3.0] - 2025-07-14

### Added
- Smart SVG content decoder utility

### Fixed
- Fixed base64 decoding
- Edit/convert working for streaming and non-streaming
- Streaming response change for generate
- Edit/convert/generate synced and working

## [0.2.2] - 2025-06-02

### Changed
- Changed official npm package name to `@genwave/svgmaker-sdk`

### Fixed
- Fixed issues with ESM modules

## [0.2.1] - 2025-06-01

### Fixed
- Fixed issues with ESM modules

## [0.2.0] - 2025-06-01

### Added
- Retry logic with exponential backoff
- Rate limiting functionality
- Detailed error messages
- Logging system
- Enhanced error handling with custom error types
- Request/response interceptors
- Configurable timeout handling
- Advanced utility modules

### Changed
- Improved error handling system
- Enhanced validation with better error messages
- Better TypeScript type definitions

### Security
- Enhanced input validation
- Improved error message sanitization

## [0.1.0] - 2025-05-31

### Added
- Initial release of SVGMaker SDK
- Core SVGMakerClient implementation
- Generate SVG client with fluent API
- Edit SVG/Image client with file and stream support
- Convert Image to SVG client
- Basic error handling system
- TypeScript support with full type definitions
- Jest testing framework setup
- ESLint and Prettier configuration
- Dual package distribution (CommonJS and ESM)
- API key authentication
- Streaming response support
- File path and Buffer/Stream input support
- Configurable quality and aspect ratio settings
- Background and style customization
- Basic validation
- Cache support

---

> Changelog entries for new releases are auto-generated from conventional commit messages by the release workflow.
