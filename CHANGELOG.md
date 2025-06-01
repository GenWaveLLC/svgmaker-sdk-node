# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- GitHub Actions CI/CD pipeline
- Automated release workflow
- Security and dependency monitoring
- Dependabot configuration for automated updates
- Comprehensive release documentation
- Release issue templates

### Changed
- Enhanced package.json scripts for release management
- Improved build process with automated cleanup

### Security
- Added automated security auditing
- Weekly dependency vulnerability checks

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
- Complete documentation and examples

### Features
- API key authentication
- Streaming response support
- File path and Buffer/Stream input support
- Configurable quality and aspect ratio settings
- Background and style customization
- Basic validation
- Cache support

---

## Release Notes Template

When creating a new release, copy the template below and fill in the details:

```markdown
## [X.Y.Z] - YYYY-MM-DD

### Added
- New features

### Changed
- Changes in existing functionality

### Deprecated
- Soon-to-be removed features

### Removed
- Now removed features

### Fixed
- Bug fixes

### Security
- Security improvements
```

## Migration Guide

### From 0.1.x to 0.2.x

The 0.2.0 release adds several new features but maintains backward compatibility:

- **New Features**: Retry logic, rate limiting, enhanced logging, and detailed error messages
- **No Breaking Changes**: All existing code will continue to work
- **Recommended Updates**: Consider using the new error handling features for better debugging

### From 0.x.x to 1.0.0 (Future Major Release)

When we release version 1.0.0, any breaking changes will be documented here with migration instructions.

## Support

- **Documentation**: [API Documentation](docs/api-documentation.md)
- **Examples**: [Basic Usage](examples/basic-usage.ts)
- **Issues**: [GitHub Issues](https://github.com/GenWaveLLC/svgmaker-sdk-node/issues)
- **Releases**: [GitHub Releases](https://github.com/GenWaveLLC/svgmaker-sdk-node/releases)