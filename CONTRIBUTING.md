# Contributing to Mouse Follower

## Commit Message Convention

This project uses [Conventional Commits](https://www.conventionalcommits.org/) for automatic versioning and changelog generation.

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- **feat**: A new feature (triggers minor version bump)
- **fix**: A bug fix (triggers patch version bump)
- **docs**: Documentation only changes
- **style**: Changes that don't affect code meaning (formatting, etc.)
- **refactor**: Code changes that neither fix bugs nor add features
- **perf**: Performance improvements
- **test**: Adding or updating tests
- **build**: Changes to build system or dependencies
- **ci**: Changes to CI configuration
- **chore**: Other changes that don't modify src or test files

### Breaking Changes

Add `BREAKING CHANGE:` in the footer or `!` after the type to trigger a major version bump:

```
feat!: remove deprecated API

BREAKING CHANGE: The `oldMethod()` has been removed. Use `newMethod()` instead.
```

### Examples

```bash
# Feature (minor version bump)
feat: add dark mode support for sprites

# Bug fix (patch version bump)
fix: correct sprite position calculation on HiDPI displays

# Breaking change (major version bump)
feat!: change follower API to use async/await

BREAKING CHANGE: follower.start() now returns a Promise instead of using callbacks
```

## Release Process

1. Create feature branches from `develop`
2. Make changes with proper commit messages
3. Create PR to `develop`
4. After review, merge to `develop`
5. When ready to release, create PR from `develop` to `main`
6. Merge to `main` triggers automatic:
   - Version bump based on commits
   - CHANGELOG.md generation
   - npm package publication
   - GitHub release creation