---
"@meganetaaan/mouse-follower": minor
---

Refactor to monorepo structure with separate library and demo packages

- Move library to packages/mouse-follower/ directory
- Move demo to packages/demo/ directory  
- Add pnpm workspace configuration
- Update CI/CD workflows for monorepo
- Add changesets for version management
- Add test coverage reporting with @vitest/coverage-v8
- Update documentation for new structure
- Replace semantic-release with changesets workflow