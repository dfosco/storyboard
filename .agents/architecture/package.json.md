# `package.json`

<!--
source: package.json
category: config
importance: high
-->

> [← Architecture Index](../architecture.index.md)

## Goal

Root package manifest for the Storyboard monorepo. This is a **private** npm workspace root that orchestrates five publishable packages under `packages/*`, hosts the prototype app itself, and defines all top-level scripts for development, building, testing, linting, and releasing.

The root package is not published to npm — it exists solely to run the app and coordinate workspace packages.

## Composition

### Identity

- **name:** `storyboard`
- **private:** `true`
- **type:** `module` (ESM throughout)
- **version:** `4.1.0` (root version, tracked separately from packages)

### Workspaces

```json
"workspaces": ["packages/*"]
```

This enables npm workspace resolution for all five packages:
- [`@dfosco/storyboard-core`](./packages/core/package.json.md)
- [`@dfosco/storyboard-react`](./packages/react/package.json.md)
- [`@dfosco/storyboard-react-primer`](./packages/react-primer/package.json.md)
- [`@dfosco/storyboard-react-reshaped`](./packages/react-reshaped/package.json.md)
- [`@dfosco/tiny-canvas`](./packages/tiny-canvas/package.json.md)

### Key Scripts

| Script | Command | Purpose |
|--------|---------|---------|
| `dev` | `storyboard dev` | Start dev server via storyboard CLI |
| `dev:vite` | `vite` | Start Vite directly (bypasses CLI) |
| `build` | `vite build` | Production build |
| `lint` | `eslint . && npm run check:imports -w @dfosco/storyboard-core` | Lint + import check |
| `test` | `vitest run` | Run all tests |
| `test:integration` | `vitest run --config vitest.integration.config.js` | Run integration tests |
| `test:core` | `vitest run packages/core` | Test core package only |
| `test:react` | `vitest run packages/react` | Test react package only |
| `version` | `changeset version && node scripts/sync-root-version.js` | Bump versions via changesets |
| `build:ui` | `npm run build:ui -w @dfosco/storyboard-core` | Build externalized core UI bundle |
| `release` | `./scripts/release.sh` | Full release workflow |
| `setup` | `./scripts/setup.sh` | First-time project setup |

### Runtime Dependencies

Key app-level dependencies (consumed by `src/` prototypes and components):

| Package | Purpose |
|---------|---------|
| `react`, `react-dom` | ^19.2.0 — React framework |
| `react-router-dom` | ^7.12.0 — Routing |
| `@generouted/react-router` | ^1.19.11 — File-based route generation |
| `@primer/react` | ^38.5.0 — GitHub Primer design system |
| `@primer/octicons-react` | ^19.21.1 — GitHub icons |
| `@primer/primitives` | ^11.3.2 — Design tokens |
| `reshaped` | ^3.9.0 — Alternative UI library |
| `styled-components` | ^6.1.19 — Required peer dep for Primer |
| `@radix-ui/react-*` | Radix UI primitives (avatar, checkbox, collapsible, dialog, dropdown-menu, label, popover, select, separator, slot, toggle, toggle-group, tooltip) |
| `cmdk` | Command palette component |
| `ghostty-web` | ^0.4.0 — Terminal emulation |
| `node-pty` | ^1.1.0 — PTY for terminal widgets |
| `ws` | ^8.20.0 — WebSocket for dev server |

### Dev Dependencies

| Package | Purpose |
|---------|---------|
| `vite` | ^7.3.1 — Build tool |
| `vitest` | ^4.0.18 — Test runner |
| `eslint` | ^9.39.2 — Linting |
| `@changesets/cli` | ^2.29.8 — Version management |
| `@vitejs/plugin-react` | ^5.1.2 — React Vite plugin |
| `@tailwindcss/vite` | ^4.2.2 — Tailwind CSS |
| `tailwindcss` | ^4.2.2 — Tailwind CSS engine |
| `jsdom` | ^28.1.0 — Test DOM environment |
| `@testing-library/*` | Test utilities (dom, react, user-event) |

## Dependencies

The root `package.json` doesn't import anything directly — it defines the dependency graph that [`vite.config.js`](./vite.config.js.md) and app source code consume.

## Dependents

- All workspace packages inherit workspace linking from this file
- [`vite.config.js`](./vite.config.js.md) — reads dependencies for pre-bundling
- [`vitest.config.js`](./vitest.config.js.md) — test configuration
- [`eslint.config.js`](./eslint.config.js.md) — linting configuration
- CI/CD workflows use scripts defined here

## Notes

- The `postinstall` script (`chmod +x node_modules/node-pty/prebuilds/darwin-*/spawn-helper`) works around a macOS permission issue with `node-pty` prebuilt binaries.
- The `prepare` script sets `core.hooksPath` to `.githooks` for custom git hooks.
- Version bumping uses `changeset version` followed by `scripts/sync-root-version.js` to keep the root version in sync with packages.
