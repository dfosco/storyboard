# `packages/core/src/cli/index.js`

<!--
source: packages/core/src/cli/index.js
category: tooling
importance: high
-->

> [← Architecture Index](../../../../architecture.index.md)

## Goal

Entry point for the `storyboard` CLI (alias: `sb`). Published as a bin in `@dfosco/storyboard-core`. Dispatches subcommands to their respective modules.

## Commands

| Subcommand | Module | Description |
|------------|--------|-------------|
| `dev` | `./dev.js` | Start Vite with worktree-aware base path + Caddy proxy update |
| `setup` | `./setup.js` | Install brew, Caddy, gh; start proxy |
| `proxy` | `./proxy.js` | Generate Caddyfile + start/reload Caddy |
| `update:version` | `./updateVersion.js` | Update @dfosco/storyboard-* packages to latest |

## Dependencies

- `./dev.js`, `./setup.js`, `./proxy.js`, `./updateFlag.js` — subcommand modules
- `../worktree/port.js` — port registry (used by dev and proxy)

## Dependents

- `packages/core/package.json` — registered as `storyboard` and `sb` bins
- `package.json` — `npm run dev` delegates to `storyboard dev`
