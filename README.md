# Mouse Follower Monorepo

[![CI](https://github.com/meganetaaan/mouse-follower/workflows/CI/badge.svg)](https://github.com/meganetaaan/mouse-follower/actions/workflows/ci.yml) [![npm version](https://badge.fury.io/js/%40meganetaaan%2Fmouse-follower.svg)](https://www.npmjs.com/package/@meganetaaan/mouse-follower) [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A monorepo for the mouse-follower library and its demo application.

## 🚀 [Live Demo](https://meganetaaan.github.io/mouse-follower/)

## Packages

This monorepo contains the following packages:

### [@meganetaaan/mouse-follower](./packages/mouse-follower)

The main library for creating animated sprites that smoothly follow the mouse cursor using physics-based movement.

- 🎯 Smooth physics-based following animation
- 🎨 Canvas-based sprite rendering with transparency support
- 🔗 Chain multiple followers in formation
- ⚡ High-performance animation with requestAnimationFrame
- 🎮 Customizable physics parameters
- 📱 Works on both desktop and mobile devices

[View package README →](./packages/mouse-follower/README.md)

### [Demo Application](./packages/demo)

An interactive demo application showcasing the library's capabilities.

- Multiple follower examples
- Formation demonstrations
- Event-driven animations
- Stack-chan sprite integration

## Development

This project uses pnpm workspace for package management.

### Prerequisites

- Node.js 18+
- pnpm 8+

### Getting Started

```bash
# Install dependencies for all packages
pnpm install

# Start the demo development server
pnpm dev

# Run tests for the library
pnpm test

# Build all packages
pnpm build

# Build library only
pnpm build:lib

# Build demo only
pnpm build:demo

# Lint and format all packages
pnpm check:fix
```

### Workspace Structure

```
.
├── packages/
│   ├── mouse-follower/    # Main library (@meganetaaan/mouse-follower)
│   │   ├── src/          # Library source code
│   │   ├── test/         # Library tests
│   │   └── README.md     # Library documentation
│   └── demo/             # Demo application (private)
│       ├── src/          # Demo source code
│       └── public/       # Demo static assets
├── docs/                 # Project documentation
├── CLAUDE.md            # AI assistant instructions
├── CONTRIBUTING.md      # Contribution guidelines
└── README.md           # This file
```

### Development Workflow

#### Working on the Library

```bash
cd packages/mouse-follower
pnpm test          # Run tests in watch mode
pnpm build         # Build the library
```

#### Working on the Demo

```bash
pnpm dev           # Start Vite dev server from root
# or
cd packages/demo
pnpm dev           # Start from demo package
```

#### Publishing

The library package is published to npm. To publish a new version:

```bash
# Build and test
pnpm build:lib
pnpm test

# Publish (from root)
pnpm publish:lib
```

### Testing

The library uses Vitest with jsdom for testing:

- Unit tests for physics calculations
- DOM manipulation tests
- Animation system tests
- Sprite rendering tests

Run tests with:

```bash
pnpm test              # Run once
pnpm test --watch      # Watch mode
pnpm test --coverage   # Coverage report
```

## Contributing

Please read [CONTRIBUTING.md](./CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## Links

- [NPM Package](https://www.npmjs.com/package/@meganetaaan/mouse-follower)
- [GitHub Repository](https://github.com/meganetaaan/mouse-follower)
- [Live Demo](https://meganetaaan.github.io/mouse-follower/)
- [Bug Reports](https://github.com/meganetaaan/mouse-follower/issues)