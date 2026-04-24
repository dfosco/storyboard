# `packages/core/src/scaffold.js`

<!--
source: packages/core/src/scaffold.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../architecture.index.md)

## Goal

CLI script (`npx storyboard-scaffold`) that syncs scaffold files from `@dfosco/storyboard-core` to consumer repos. Reads `scaffold/manifest.json` and copies files in two modes: `"scaffold"` (only if target doesn't exist — never overwrites config) and `"updateable"` (always overwrites with latest — for skills, scripts). Supports both files and directories.

## Composition

This is a standalone Node.js script (shebang `#!/usr/bin/env node`), not a library module.

**Flow:**
1. Reads `scaffold/manifest.json` from the package's scaffold directory
2. Iterates entries, applying `scaffold` or `updateable` mode logic
3. Makes `.sh` files executable (`0o755`)
4. Reports created/updated/skipped counts

```bash
npx storyboard-scaffold
# ✔ Created .github/skills/ship/SKILL.md (scaffold)
# ✔ Updated scripts/setup.sh (sync)
# ⏭ Skipped storyboard.config.json (already exists)
```

## Dependencies

- `node:fs`, `node:path` — Node.js built-ins

## Dependents

- `packages/core/package.json` — registered as `bin: { "storyboard-scaffold": ... }`
- `packages/core/scaffold/manifest.json` — the manifest it reads
- `packages/core/src/cli/setup.js` — may invoke scaffold as part of setup
