# Contributing to SVGMaker SDK

Thank you for your interest in contributing to the SVGMaker SDK! This document provides guidelines and instructions for contributing.

## Code of Conduct

Please be respectful and considerate of others when contributing to this project. We expect all contributors to adhere to this Code of Conduct.

## How to Contribute

1. **Fork the repository** - Create your own fork of the repository.
2. **Create a branch** - Create a new branch for your contribution.
3. **Make your changes** - Implement your changes, following the code style guidelines.
4. **Write tests** - Add tests for your changes to maintain test coverage.
5. **Run tests** - Ensure all tests pass before submitting your contribution.
6. **Submit a pull request** - Submit a pull request from your branch to the main repository.

## Development Setup

```bash
# Clone your fork
git clone https://github.com/your-username/svgmaker-sdk-node.git
cd svgmaker-sdk-node

# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test
```

## Code Style

This project uses ESLint and Prettier for code style and formatting. Please make sure your code adheres to these standards.

```bash
# Run linting
npm run lint

# Format code
npm run format
```

## Testing

All changes should include appropriate tests. We use Jest for testing.

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage
```

## Commit Messages

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification for commit messages:

- `feat:` for new features
- `fix:` for bug fixes
- `docs:` for documentation changes
- `style:` for formatting changes
- `refactor:` for code refactoring
- `test:` for adding or modifying tests
- `chore:` for maintenance tasks

## Pull Request Process

1. Update the README.md with details of changes if applicable.
2. The PR should work on Node.js 18.x and above.
3. The PR will be merged once it passes all checks and is approved by a maintainer.

## Releasing

Releases are automated. When a push to `main` includes a version bump in `package.json`, the release workflow will:

1. Auto-generate a changelog from conventional commit messages
2. Create a git tag (`vX.Y.Z`)
3. Publish to npm
4. Create a GitHub Release

**To release a new version:**

1. Bump the version in `package.json` (use `npm run version:patch`, `version:minor`, or `version:major`)
2. Merge to `main` (via PR or direct push)
3. The release happens automatically

Because the changelog is generated from commit messages, always use [Conventional Commits](https://www.conventionalcommits.org/) format.

## Questions?

If you have any questions about contributing, please open an issue or contact the maintainers.

Thank you for contributing to the SVGMaker SDK!