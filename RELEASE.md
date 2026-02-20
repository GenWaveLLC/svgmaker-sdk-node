# Release Guide

This document outlines the release process and CI/CD pipeline for the SVGMaker SDK, providing both automated and manual release options with comprehensive quality gates and security monitoring.

## CI/CD Pipeline Overview

The project uses automated GitHub Actions workflows for continuous integration, testing, security monitoring, and release management. The pipeline consists of four main workflows and Dependabot configuration that ensure code quality, security, and automated releases.

### Workflows

#### 1. CI Workflow (`.github/workflows/ci.yml`)

**Triggers**:
- Push to `main` or `develop` branches
- Pull requests to `main` branch

**Features**:
- **Multi-version testing**: Tests on Node.js 18.x, 20.x, and 22.x
- **Code quality**: ESLint, TypeScript type checking
- **Test coverage**: Jest with coverage reporting to Codecov
- **Build verification**: Ensures package builds successfully
- **Artifact storage**: Uploads build artifacts for review

**Jobs**:
1. `test` - Runs tests across Node.js versions
2. `build` - Builds the package and uploads artifacts

#### 2. Release Workflow (`.github/workflows/release.yml`)

**Triggers**:
- Push to `main` branch (detects version changes in `package.json`)

**How it works**:
1. `detect-release` job compares the current `package.json` version against the previous commit
2. If the version changed and doesn't already exist on npm, the `release` job runs
3. Runs quality gates (tests, linting, build)
4. Generates release notes via the GitHub API, then enhances them with AI (GitHub Models inference API)
5. Creates a git tag, publishes to npm with provenance, and creates a GitHub Release

**Permissions**:
- `contents: write` — create tags and GitHub releases
- `id-token: write` — npm provenance (OIDC trusted publishing)
- `models: read` — call the GitHub Models inference API for AI-enhanced release notes

**AI-Enhanced Release Notes**:
The workflow uses GitHub Models (`openai/gpt-4.1` via `models.github.ai`) to rewrite raw GitHub-generated release notes into polished, user-facing notes with sections for What's New, Bug Fixes, Migration Guide, etc. If the AI call fails, it falls back to the raw GitHub-generated notes.

#### 3. Security Workflow (`.github/workflows/security.yml`)

**Triggers**:
- Weekly schedule (Mondays at 9 AM UTC)
- Push to `main` branch
- Pull requests to `main` branch

**Features**:
- **Security auditing**: Runs `npm audit` for vulnerabilities
- **Dependency monitoring**: Checks for outdated packages
- **License compliance**: Verifies package licenses
- **Reporting**: Generates dependency and license reports

**Jobs**:
1. `security-audit` - Checks for security vulnerabilities
2. `dependency-check` - Monitors outdated dependencies
3. `license-check` - Verifies license compliance

#### 4. Test AI Release Notes (`.github/workflows/test-ai-notes.yml`)

**Triggers**:
- Manual `workflow_dispatch` only

**Purpose**: Verify that the GitHub Models inference API is accessible with the `models: read` permission before a real release. Sends a simple prompt and asserts a non-empty response.

### Dependabot Configuration

**File**: `.github/dependabot.yml`

**Features**:
- **Automated updates**: Weekly dependency updates
- **Grouped updates**: Groups related dependencies (TypeScript, testing, linting)
- **Smart ignoring**: Ignores major version updates for stable dependencies
- **GitHub Actions updates**: Also updates GitHub Actions versions

## Release Process

### Automated Release Process (Recommended)

For most releases, follow this automated process:

1. **Prepare Your Codebase**
   ```bash
   git status  # Ensure your working directory is clean
   git add .
   git commit -m "chore: prepare for release"
   ```

2. **Update Documentation**
   - Add a new section to `CHANGELOG.md` following [Keep a Changelog](https://keepachangelog.com/)
   - Update `README.md`, examples, and API docs as needed
   ```bash
   git add CHANGELOG.md README.md docs/ examples/
   git commit -m "docs: update changelog and documentation for release"
   ```

3. **Bump the Version**
   ```bash
   npm run release:patch    # For bug fixes
   npm run release:minor    # For new features
   npm run release:major    # For breaking changes
   ```

   This command:
   - Bumps version in `package.json`
   - Commits the version change
   - Pushes to `main`

4. **Automated CI/CD Workflow** (triggered on push to `main`)
   - Detects the version change in `package.json`
   - Runs tests, linting, and build
   - Generates and AI-enhances release notes
   - Creates a git tag and pushes it
   - Publishes to npm with provenance
   - Creates a GitHub Release with polished release notes

**Note**:
- `npm run version:*`: Local version bump only (manual push required)
- `npm run release:*`: Version bump + git push (recommended)

### Manual Release Process

If you prefer manual control over releases:

```bash
# 1. Update version manually
npm version [patch|minor|major] --no-git-tag-version

# 2. Update CHANGELOG.md

# 3. Commit changes
git add .
git commit -m "chore: prepare release v$(node -p 'require("./package.json").version')"

# 4. Push to main (the workflow will create the tag automatically)
git push origin main
```

### Emergency Releases

For critical bug fixes that need immediate release:

```bash
# Create a hotfix branch from main
git checkout main
git checkout -b hotfix/critical-fix

# Make your fixes and commit
git add .
git commit -m "fix: critical security issue"

# Push and create PR
git push origin hotfix/critical-fix

# After PR is merged, create release
npm run release:patch  # This will push automatically
```

## Pre-Release Checklist

- [ ] All tests pass locally (`npm test`)
- [ ] Code is properly linted (`npm run lint`)
- [ ] TypeScript compiles without errors (`npm run typecheck`)
- [ ] Build succeeds (`npm run build`)
- [ ] CHANGELOG.md is updated
- [ ] Version number follows semantic versioning
- [ ] Documentation is up to date
- [ ] Examples work with new version

## Post-Release Checklist

- [ ] Verify package is published on [npm](https://www.npmjs.com/package/@genwave/svgmaker-sdk)
- [ ] GitHub release is created with AI-enhanced release notes
- [ ] CI/CD pipeline completed successfully
- [ ] Documentation website is updated (if applicable)
- [ ] Announcement made to relevant channels

## Rollback Process

If a release has critical issues, follow these steps in order:

### Option 1: Unpublish (Within 24 hours only)
```bash
# Only possible within 24 hours of publication
npm unpublish @genwave/svgmaker-sdk@<version>
```

### Option 2: Deprecate and Patch (Recommended)
```bash
# 1. Deprecate the problematic version
npm deprecate @genwave/svgmaker-sdk@<version> "This version has critical issues, please upgrade to latest"

# 2. Fix the issues in your codebase
# 3. Create a patch release with fixes
npm run release:patch  # Includes automatic push
```

### Option 3: Emergency Hotfix
For critical security issues:
```bash
# Create hotfix branch
git checkout main
git checkout -b hotfix/critical-fix

# Make fixes and test thoroughly
# Push and create PR for review
git push origin hotfix/critical-fix

# After merge, create immediate patch release
npm run release:patch  # Includes automatic push
```

**Important**: Always test thoroughly before any rollback action.

## Required Secrets and Permissions

The following need to be configured in GitHub repository settings:

### NPM_TOKEN
- **Purpose**: Authenticate with npm for publishing
- **How to get**:
  1. Go to [npm.com](https://www.npmjs.com)
  2. Login and go to Access Tokens
  3. Create new token with "Automation" type
  4. Copy token to GitHub repository secrets

### CODECOV_TOKEN (Optional)
- **Purpose**: Upload test coverage reports
- **How to get**:
  1. Go to [codecov.io](https://codecov.io)
  2. Connect your GitHub repository
  3. Copy the token from repository settings
  4. Add to GitHub repository secrets

### GitHub Models Access
- **Purpose**: AI-enhanced release notes via the GitHub Models inference API
- **Requirement**: The `release` job must have `models: read` permission so that `GITHUB_TOKEN` can call `models.github.ai`
- **Fallback**: If the API is unavailable or returns an empty response, the workflow falls back to raw GitHub-generated release notes

## Monitoring and Troubleshooting

### Workflow Status

Monitor your releases through:
- [GitHub Actions tab](https://github.com/GenWaveLLC/svgmaker-sdk-node/actions) for workflow status
- Email notifications for failed workflows
- Detailed logs in workflow runs for debugging

### Common Issues and Solutions

#### 1. NPM Publish Failures
**Symptoms**: Release workflow fails during npm publish step
**Solutions**:
- Verify `NPM_TOKEN` is set and valid in repository secrets
- Check if version already exists on npm (versions cannot be republished)
- Ensure token has "automation" permissions for publishing
- Verify package name is available and not claimed by another user

#### 2. Test Failures in CI
**Symptoms**: CI workflow fails during test execution
**Solutions**:
- Run tests locally first: `npm test`
- Check Node.js version compatibility (we test on 18.x, 20.x, 22.x)
- Verify all environment variables are properly set
- Check for missing dependencies or version conflicts
- Review test timeout settings for slower environments

#### 3. Security Audit Failures
**Symptoms**: Security workflow reports vulnerabilities
**Solutions**:
- Run `npm audit` locally to identify specific issues
- Use `npm audit fix` for automatic fixes
- Manually update vulnerable dependencies
- Add audit exceptions for false positives (document reasoning)

#### 4. GitHub Release Creation Failures
**Symptoms**: Release workflow fails to create GitHub release
**Solutions**:
- Verify `GITHUB_TOKEN` has sufficient permissions (`contents: write`)
- Check workflow logs for tag creation errors
- Verify repository settings allow release creation

#### 5. AI Release Notes Empty/Fallback
**Symptoms**: GitHub release uses raw notes instead of AI-enhanced notes
**Solutions**:
- Verify the `release` job has `models: read` permission
- Run the Test AI Release Notes workflow (`workflow_dispatch`) to check API access
- Check workflow logs for the curl response from `models.github.ai`
- The AI step is non-blocking — raw notes are used as fallback

#### 6. Git Working Directory Not Clean
**Symptoms**: `npm version` fails with "Git working directory not clean"
**Solutions**:
```bash
# Check what files are uncommitted
git status

# Option 1: Commit all changes
git add .
git commit -m "chore: prepare for release"

# Option 2: Stash changes temporarily
git stash
npm run version:patch
git stash pop

# Option 3: Use --force flag (not recommended)
npm version patch --force
```

#### 7. Build Failures
**Symptoms**: Package build fails during release
**Solutions**:
- Run `npm run build` locally to reproduce
- Check TypeScript configuration and compilation errors
- Verify all imports and exports are correct
- Ensure build artifacts are properly generated

### Workflow Customization

To customize workflows:

1. **Modify triggers**: Change `on` section in workflow files
2. **Add/remove Node.js versions**: Update strategy matrix in CI workflow
3. **Change schedule**: Update cron expression in security workflow
4. **Add new jobs**: Follow existing job patterns

### Getting Help

- Check the [GitHub Actions logs](https://github.com/GenWaveLLC/svgmaker-sdk-node/actions)
- Review the [npm package page](https://www.npmjs.com/package/@genwave/svgmaker-sdk)
- Open an issue in the repository for support

## Version History

| Version | Release Date | Type | Description |
|---------|-------------|------|-------------|
| 1.0.0   | 2026-02-19  | Major | v1 API support, new endpoints, breaking URL change |
| 0.3.1   | 2025-12-11  | Patch | TypeScript fix, Edit API quality levels, OIDC publishing |
| 0.3.0   | 2025-07-14  | Minor | SVG content decoder, base64 fix, streaming fixes |
| 0.2.2   | 2025-06-02  | Patch | npm package rename to @genwave/svgmaker-sdk |
| 0.2.1   | 2025-06-01  | Patch | ESM module fix |
| 0.2.0   | 2025-06-01  | Minor | Retry logic, rate limiting, error handling, interceptors |
| 0.1.0   | 2025-05-31  | Initial | Initial release with core functionality |

## Additional Resources

- **Development Guide**: [`CONTRIBUTING.md`](./CONTRIBUTING.md) - Development workflow and contribution guidelines
- **Testing Guide**: [`TESTING.md`](./TESTING.md) - Testing strategies and quality assurance
- **API Documentation**: [`docs/api-documentation.md`](./docs/api-documentation.md) - Comprehensive API reference
- **GitHub Actions**: [Workflow files](./.github/workflows/) - View and customize CI/CD workflows

---

*This document is maintained alongside the codebase. Please keep it updated when making changes to the release process.*
