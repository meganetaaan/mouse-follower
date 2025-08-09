# Contributing to Mouse Follower

## Development Setup

This project uses pnpm workspace. Make sure you have Node.js >=20.19.0 and pnpm installed:

```bash
npm install -g pnpm
```

### Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/meganetaaan/mouse-follower.git
   cd mouse-follower
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Start development:
   ```bash
   pnpm dev  # Start demo application
   ```

### Project Structure

```
packages/
├── mouse-follower/    # Main library (@meganetaaan/mouse-follower)
│   ├── src/           # Library source code
│   ├── dist/          # Build output (generated)
│   └── package.json   # Library package configuration
└── demo/              # Demo application
    ├── src/           # Demo source code
    ├── public/        # Static assets
    └── package.json   # Demo package configuration
```

### Development Commands

- `pnpm dev` - Start demo development server
- `pnpm build:lib` - Build library package
- `pnpm build:demo` - Build demo application
- `pnpm test` - Run library tests
- `pnpm check:fix` - Lint and format code

### Working on the Library

The main library code is in `packages/mouse-follower/`:
- Make changes to library source code
- Add tests for new features
- Run `pnpm test` to ensure tests pass
- Use `pnpm build:lib` to build the library

### Working on the Demo

The demo application is in `packages/demo/`:
- Uses the library via workspace dependency
- Test your library changes in real-time
- Run `pnpm dev` for live development

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

### Scopes

Use these scopes to indicate which part of the project is affected:

- **lib**: Changes to the main library (`packages/mouse-follower/`)
- **demo**: Changes to the demo application (`packages/demo/`)
- **ci**: Changes to GitHub Actions or build configuration
- **deps**: Dependency updates
- **docs**: Documentation changes

### Examples

```bash
# Library feature (minor version bump)
feat(lib): add dark mode support for sprites

# Library bug fix (patch version bump)
fix(lib): correct sprite position calculation on HiDPI displays

# Demo improvement
feat(demo): add new example for advanced physics

# Breaking library change (major version bump)
feat(lib)!: change follower API to use async/await

BREAKING CHANGE: follower.start() now returns a Promise instead of using callbacks
```

## Release Process

This project uses semantic-release for automated releases:

1. **Development**: Work on feature branches from `main`
2. **Pull Request**: Create PR to `main` with proper commit messages
3. **Review**: Code review and approval
4. **Merge**: Merge to `main` triggers automatic:
   - Version bump based on conventional commits
   - CHANGELOG.md generation  
   - npm package publication (library only)
   - GitHub release creation
   - GitHub Pages deployment (demo)

### Publishing

Only the library package (`@meganetaaan/mouse-follower`) is published to npm. The demo is deployed to GitHub Pages but remains a private package.