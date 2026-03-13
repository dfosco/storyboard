# `package.json`

<!--
source: package.json
category: config
importance: high
-->

> [← Architecture Index](./architecture.index.md)

## Goal

Root package manifest for the storyboard monorepo. Defines the workspace structure, scripts, and dependencies. The monorepo uses npm workspaces with packages in the `packages/` directory (`packages/core`, `packages/react`, etc.).

## Composition

**Scripts:**
- `dev` / `build` / `preview` — Vite commands
- `lint` — ESLint
- `test` / `test:watch` / `test:core` / `test:react` / `test:svelte` — Vitest (per-package and Svelte UI)
- `changeset` / `version` / `tag` / `release` / `release:beta` / `release:alpha` — Changesets versioning and release scripts

**Key dependencies:**
- `@primer/react`, `@primer/octicons-react`, `@primer/primitives` — GitHub Primer design system
- `react`, `react-dom`, `react-router-dom` — React framework
- `@generouted/react-router` — File-based routing
- `reshaped` — Alternative design system
- `jsonc-parser` — JSONC support for data files
- `styled-components` — Legacy dependency (being migrated away)

**Key devDependencies:**
- `vite`, `@vitejs/plugin-react` — Build tooling
- `vitest`, `@testing-library/react`, `@testing-library/svelte`, `jsdom` — Testing
- `svelte`, `@sveltejs/vite-plugin-svelte` — Svelte plugin UI support
- `@changesets/cli` — Version management

**Workspace:** `"workspaces": ["packages/*"]` — enables `@dfosco/storyboard-core`, `@dfosco/storyboard-react`, and other local packages.

## Dependencies

N/A — this is the root manifest.

## Dependents

All build and development tooling reads this file.
