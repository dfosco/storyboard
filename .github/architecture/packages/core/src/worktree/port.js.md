# `packages/core/src/worktree/port.js`

<!--
source: packages/core/src/worktree/port.js
category: tooling
importance: high
-->

> [← Architecture Index](../../../../architecture.index.md)

## Goal

Manages `.worktrees/ports.json` — a gitignored registry mapping worktree names to unique dev-server ports. Main always gets port 1234; worktrees get 1235+. Published as `@dfosco/storyboard-core/worktree/port`.

## Exports

| Function | Description |
|----------|-------------|
| `portsFilePath(cwd?)` | Resolves path to `ports.json` from repo root or worktree dir |
| `detectWorktreeName()` | Returns worktree name from git context (`'main'` if not in a worktree) |
| `getPort(name)` | Get or assign a port for a worktree (creates `ports.json` if needed) |
| `resolvePort(name)` | Read-only lookup — falls back to 1234 without creating assignments |
| `slugify(name)` | Sanitize branch name for filesystem/subdomain safety |

## Key Design Decision

`portsFilePath()` derives the repo root from directory structure (regex matching `.worktrees/<name>/` in the realpath) rather than checking file existence. This ensures the shared registry is always at `<repo-root>/.worktrees/ports.json`, even on first run from a worktree.

## Dependencies

- Node.js `fs`, `path`, `child_process` — no npm dependencies

## Dependents

- `packages/core/src/cli/dev.js` — port assignment for Vite
- `packages/core/src/cli/proxy.js` — reads ports for Caddyfile generation
- `scripts/worktree-port.js` — standalone CLI wrapper
