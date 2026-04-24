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
- `dev` — Runs `storyboard dev` (CLI-based dev server with auto-port assignment and Caddy proxy)
- `dev:vite` — Runs Vite directly (bypasses CLI)
- `build` / `preview` — Vite build and preview
- `setup` — One-time environment setup (deps, Caddy, gh CLI)
- `lint` — ESLint + import checker (`check:imports` in storyboard-core)
- `test` / `test:watch` / `test:core` / `test:react` / `test:svelte` — Vitest (per-package and Svelte UI)
- `changeset` / `version` / `tag` — Changesets versioning
- `release` / `release:beta` / `release:alpha` / `release:resume` / `release:resume:beta` / `release:resume:alpha` — Release scripts (stable, prerelease, and resume variants)
- `build:ui` / `dev:ui` — Delegated to `@dfosco/storyboard-core` workspace for UI bundle builds
- `link` / `unlink` — Build UI, link workspace packages, and start dev server (for consumer repo development)
- `hotel:add` — Regenerate Caddy proxy config (`storyboard proxy`)
- `prepare` — Sets git hooks path to `.githooks`

**Key dependencies:**
- `@primer/react`, `@primer/octicons-react`, `@primer/primitives` — GitHub Primer design system
- `react` (v19), `react-dom`, `react-router-dom` (v7) — React framework
- `@generouted/react-router` — File-based routing
- `reshaped` — Alternative design system
- `jsonc-parser` — JSONC support for data files
- `styled-components` — Legacy dependency (being migrated away)
- `@internationalized/date` — Locale-aware date utilities
- `@lucide/svelte` — Svelte icon library for plugin UIs
- `web-vitals` — Performance metrics

**Key devDependencies:**
- `vite` (v7), `@vitejs/plugin-react` — Build tooling
- `vitest` (v4), `@testing-library/react`, `@testing-library/svelte`, `@testing-library/dom`, `@testing-library/user-event`, `jsdom` — Testing
- `svelte` (v5), `@sveltejs/vite-plugin-svelte` — Svelte plugin UI support
- `tailwindcss` (v4), `@tailwindcss/vite` — Tailwind CSS v4 integration
- `@changesets/cli`, `@changesets/changelog-github` — Version management
- `highlight.js`, `marked` — Markdown rendering and syntax highlighting
- `postcss-preset-env`, `@csstools/postcss-global-data` — PostCSS processing

**Workspace:** `"workspaces": ["packages/*"]` — enables `@dfosco/storyboard-core`, `@dfosco/storyboard-react`, and other local packages.

## Dependencies

N/A — this is the root manifest.

## Dependents

All build and development tooling reads this file.
