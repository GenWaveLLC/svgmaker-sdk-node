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

#### 2. Auto Release Workflow (`.github/workflows/auto-release.yml`)

**Triggers**:
- Push to `main` branch with changes to `package.json`

**Features**:
- **Version detection**: Automatically detects version changes in package.json
- **Git tagging**: Creates and pushes semantic version tags (e.g., `v1.2.3`)
- **Release triggering**: Automatically triggers the release workflow

**Process**:
1. Compares current and previous `package.json` versions
2. Creates git tag if version changed (follows `v*.*.*` pattern)
3. Pushes tag to trigger release workflow

#### 3. Release Workflow (`.github/workflows/release.yml`)

**Triggers**:
- Git tags matching `v*.*.*` pattern (e.g., `v1.2.3`)

**Features**:
- **Quality gates**: Runs tests and linting before release
- **Automated publishing**: Publishes to npm automatically
- **GitHub releases**: Creates GitHub releases with changelog
- **Documentation updates**: Updates documentation if needed

**Process**:
1. Validates code quality (tests, linting, build)
2. Extracts changelog for the version
3. Creates GitHub release
4. Publishes to npm
5. Updates documentation

#### 4. Security Workflow (`.github/workflows/security.yml`)

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

### Dependabot Configuration

**File**: `.github/dependabot.yml`

**Features**:
- **Automated updates**: Weekly dependency updates
- **Grouped updates**: Groups related dependencies (TypeScript, testing, linting)
- **Smart ignoring**: Ignores major version updates for stable dependencies
- **GitHub Actions updates**: Also updates GitHub Actions versions

## Release Process

Choose between automated (recommended) or manual release process based on your workflow preferences.

### Quick Start (Automated Release)

For most releases, use the automated process:

```bash
# 1. Ensure working directory is clean
git add .
git commit -m "chore: prepare for release"

# 2. Update CHANGELOG.md with your changes (then commit again)
git add CHANGELOG.md
git commit -m "docs: update changelog for release"

# 3. Run the appropriate version command:
npm run release:patch    # For bug fixes (0.1.0 → 0.1.1)
npm run release:minor    # For new features (0.1.0 → 0.2.0)
npm run release:major    # For breaking changes (0.1.0 → 1.0.0)

# 4. The CI/CD pipeline handles the rest automatically
```

**Important**:
- The [`npm version`](package.json:1) command requires a clean git working directory
- Use [`release:*`](package.json:40) scripts (not [`version:*`](package.json:37)) for automated releases as they include the git push step
- The [`version:*`](package.json:37) scripts only bump locally without pushing to remote

### 1. Prepare for Release

1. **Commit All Current Changes**
   ```bash
   # Check git status
   git status
   
   # Commit any uncommitted changes
   git add .
   git commit -m "chore: prepare for release"
   ```

2. **Update CHANGELOG.md**
   - Add a new section for the upcoming version
   - Document all changes, bug fixes, and new features
   - Follow [Keep a Changelog](https://keepachangelog.com/) format
   - Include migration notes for breaking changes
   ```bash
   # Commit changelog updates
   git add CHANGELOG.md
   git commit -m "docs: update changelog for v$(node -p 'require("./package.json").version')"
   ```

3. **Update Documentation**
   - Ensure README.md reflects new features
   - Update API documentation if needed
   - Review and update examples
   - Verify all links are working
   ```bash
   # Commit documentation updates
   git add docs/ README.md examples/
   git commit -m "docs: update documentation for release"
   ```

4. **Create Version Tag and Push**
   ```bash
   # Ensure working directory is clean
   git status
   
   # Create version bump, tag, and push to remote (RECOMMENDED)
   npm run release:patch    # For bug fixes (0.1.0 → 0.1.1)
   npm run release:minor    # For new features (0.1.0 → 0.2.0)
   npm run release:major    # For breaking changes (0.1.0 → 1.0.0)
   
   # Alternative: Manual push after version bump
   npm run version:patch    # Only bumps version locally
   git push --follow-tags   # Then manually push with tags
   ```

**Prerequisites**:
- Git working directory must be clean (no uncommitted changes)
- All changes must be committed before running version commands
- Use [`release:*`](package.json:40) scripts for full automation (bump + push)

### 2. Manual Release Process

If you prefer manual control over releases:

```bash
# 1. Update version manually
npm version [patch|minor|major] --no-git-tag-version

# 2. Update CHANGELOG.md

# 3. Commit changes
git add .
git commit -m "chore: prepare release v$(node -p 'require("./package.json").version')"

# 4. Create and push tag
VERSION=$(node -p 'require("./package.json").version')
git tag -a "v$VERSION" -m "Release v$VERSION"
git push origin main --tags
```

### 3. Automated Release Process (Recommended)

The automated process provides a seamless release experience:

1. **Version Bump**: When you run `npm run release:[patch|minor|major]`, it:
   - Updates `package.json` version using semantic versioning
   - Creates a git commit with the version change
   - Creates a git tag (e.g., `v1.2.3`)
   - Pushes both commit and tag to GitHub automatically

**Script Comparison**:
   - [`npm run version:*`](package.json:37): Only bumps version locally (requires manual push)
   - [`npm run release:*`](package.json:40): Bumps version AND pushes to remote (recommended)

2. **Auto-Release Trigger**: The auto-release workflow detects the new tag and:
   - Runs comprehensive quality checks (tests, linting, TypeScript compilation)
   - Builds the package for distribution
   - Publishes to npm registry
   - Creates a GitHub release with extracted changelog
   - Updates documentation if configured

**Benefits**: Ensures consistency, reduces human error, and provides audit trail.

### 4. Emergency Releases

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

- [ ] Verify package is published on [npm](https://www.npmjs.com/package/svgmaker-sdk)
- [ ] GitHub release is created with proper changelog
- [ ] CI/CD pipeline completed successfully
- [ ] Documentation website is updated (if applicable)
- [ ] Announcement made to relevant channels

## Rollback Process

If a release has critical issues, follow these steps in order:

### Option 1: Unpublish (Within 24 hours only)
```bash
# Only possible within 24 hours of publication
npm unpublish svgmaker-sdk@<version>
```

### Option 2: Deprecate and Patch (Recommended)
```bash
# 1. Deprecate the problematic version
npm deprecate svgmaker-sdk@<version> "This version has critical issues, please upgrade to latest"

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

## Required Secrets

The following secrets need to be configured in GitHub repository settings:

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
- Verify `GITHUB_TOKEN` has sufficient permissions
- Ensure tag format matches `v*.*.*` pattern exactly
- Check that CHANGELOG.md has proper formatting for extraction
- Verify repository settings allow release creation

#### 5. Git Working Directory Not Clean
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

#### 6. Build Failures
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
- Review the [npm package page](https://www.npmjs.com/package/svgmaker-sdk)
- Open an issue in the repository for support

## Benefits of This Release Process

| Benefit | Description | Impact |
|---------|-------------|---------|
| **Automated Quality Assurance** | Every change tested across multiple Node.js versions | Reduces production bugs |
| **Consistent Release Process** | Standardized workflow reduces human error | Reliable deployments |
| **Security First** | Proactive vulnerability detection and monitoring | Enhanced security posture |
| **Dependency Management** | Automated updates with smart grouping | Keeps dependencies current |
| **Audit Trail** | Complete history of releases and changes | Compliance and debugging |
| **Rollback Support** | Quick recovery from problematic releases | Minimizes downtime |

## Getting Started Checklist

### Initial Setup
- [ ] Configure `NPM_TOKEN` in repository secrets
- [ ] Configure `CODECOV_TOKEN` for coverage reports (optional)
- [ ] Test CI workflow with a draft PR
- [ ] Verify all workflow files are present and correctly configured

### First Release
- [ ] Ensure git working directory is clean (`git status`)
- [ ] Update CHANGELOG.md with initial release notes
- [ ] Commit all changes before version bump
- [ ] Run `npm run release:minor` for first minor release (includes push)
- [ ] Verify automated release completes successfully
- [ ] Check package appears on npm registry
- [ ] Validate GitHub release is created

### Ongoing Maintenance
- [ ] Monitor weekly Dependabot PRs and merge when appropriate
- [ ] Review security audit results regularly
- [ ] Keep documentation updated with new features
- [ ] Follow semantic versioning principles consistently

## Version History

| Version | Release Date | Type | Description |
|---------|-------------|------|-------------|
| 0.1.0   | 2025-05-31  | Initial | Initial release with core functionality |

## Additional Resources

- **Development Guide**: [`CONTRIBUTING.md`](../CONTRIBUTING.md) - Development workflow and contribution guidelines
- **Testing Guide**: [`TESTING.md`](../TESTING.md) - Testing strategies and quality assurance
- **API Documentation**: [`docs/api-documentation.md`](./docs/api-documentation.md) - Comprehensive API reference
- **GitHub Actions**: [Workflow files](../.github/workflows/) - View and customize CI/CD workflows

---

*This document is maintained alongside the codebase. Please keep it updated when making changes to the release process.*