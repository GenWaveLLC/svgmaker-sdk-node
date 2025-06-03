---
name: Release Checklist
about: Track progress for a new release
title: 'Release v[VERSION]'
labels: release
assignees: ''
---

## Release Information

- **Version**: v[VERSION]
- **Type**: [patch/minor/major]
- **Target Date**: [DATE]

## Pre-Release Checklist

### Code Quality
- [ ] All tests pass (`npm test`)
- [ ] Code is properly linted (`npm run lint`)
- [ ] TypeScript compiles without errors (`npm run typecheck`)
- [ ] Build succeeds (`npm run build`)
- [ ] Manual testing completed
- [ ] Security audit passed (`npm audit`)

### Documentation
- [ ] CHANGELOG.md updated
- [ ] README.md reviewed and updated
- [ ] API documentation updated
- [ ] Examples tested and updated
- [ ] Release notes prepared

### Version Management
- [ ] Version number follows semantic versioning
- [ ] Breaking changes documented (if major release)
- [ ] Migration guide prepared (if needed)

## Release Process

### Automated Release
- [ ] Version bumped using `npm run release:[patch|minor|major]`
- [ ] Changes pushed to main branch
- [ ] Auto-release workflow triggered
- [ ] GitHub tag created

### Manual Verification
- [ ] CI/CD pipeline completed successfully
- [ ] Package published to npm
- [ ] GitHub release created
- [ ] Release notes are accurate

## Post-Release Checklist

### Verification
- [ ] Package available on [npm](https://www.npmjs.com/package/@genwave/svgmaker-sdk)
- [ ] Installation works: `npm install @genwave/svgmaker-sdk@[VERSION]`
- [ ] Basic functionality tested in clean environment
- [ ] Examples work with new version

### Communication
- [ ] Team notified of release
- [ ] Documentation website updated (if applicable)
- [ ] Changelog published
- [ ] Social media announcement (if applicable)

### Monitoring
- [ ] No critical issues reported within 24 hours
- [ ] Download metrics reviewed
- [ ] User feedback monitored

## Rollback Plan

If issues are discovered:

1. **Immediate**: Deprecate problematic version
   ```bash
   npm deprecate @genwave/svgmaker-sdk@[VERSION] "Critical issue found, please upgrade"
   ```

2. **Short-term**: Prepare patch release with fixes
3. **Last resort**: Unpublish if within 24 hours and critical security issue

## Notes

<!-- Add any additional notes, considerations, or special instructions for this release -->

## Related Issues

<!-- Link any issues that are resolved or addressed in this release -->

---

**Release Manager**: @[USERNAME]
**Review Required**: @[TEAM]