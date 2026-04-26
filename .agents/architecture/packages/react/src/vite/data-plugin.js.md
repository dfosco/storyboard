# `packages/react/src/vite/data-plugin.js`

<!--
source: packages/react/src/vite/data-plugin.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

Vite plugin that discovers all storyboard data files (flows, objects, records, prototypes, canvases, stories) at dev/build time and generates a virtual module (`virtual:storyboard-data-index`) that seeds the core data index. This is the build-time backbone — without it, no flow/object/record data would be available at runtime.

## Composition

**Default export:** `storyboardDataPlugin()` — returns a Vite plugin object.

**Key internal functions:**
- `parseDataFile(filePath)` — extracts name, suffix, prototype scope from file paths
- `buildIndex(root)` — globs for all `*.{flow,scene,object,record,prototype,folder}.json`, `*.canvas.jsonl`, `*.meta.json`, and `*.story.{jsx,tsx}`, reads/parses them, resolves template variables, builds the full data index
- `generateModule(index, root)` — emits the virtual module source code that calls `init()` and exports all data collections
- `resolveTemplateVars(obj, vars)` — replaces `${currentDir}`, `${currentProto}`, `${currentProtoDir}` in JSON string values
- `buildUnifiedConfig(root)` — merges `storyboard.config.json` with tool configs
- `batchGitMetadata(root, filePaths)` — extracts git author and last-modified for prototypes

**Glob patterns:**
```js
'**/*.{flow,scene,object,record,prototype,folder}.{json,jsonc}'
'**/*.canvas.jsonl'
'**/*.meta.json'
'**/*.story.{jsx,tsx}'
```

**Virtual module exports:** `flows`, `scenes`, `objects`, `records`, `prototypes`, `folders`, `canvases`, `canvasAliases`, `stories`.

**HMR:**
- Data file changes trigger full module reload.
- Canvas JSONL changes check `isCanvasWriteInFlight(absPath)` before emitting HMR events — prevents duplicate events when the canvas server API already pushed an update.
- Story file (`*.story.*`) changes use soft-invalidate instead of full-reload — preserves canvas state and prevents iframe reload.

**Branch injection (`transformIndexHtml`):** Injects `__SB_BRANCHES__` using `listRunningServers()` from server registry instead of reading stale `.worktrees/ports.json`.

**Exported plugin:** `terminalSnapshotPlugin()` — copies terminal snapshots into build output for production. Reads from two sources: public snapshots (`assets/.storyboard-public/terminal-snapshots/`) and legacy snapshots (`.storyboard/terminal-snapshots/`). Emits to `_storyboard/terminal-snapshots/` in the build.

**Pre-bundle config:** `optimizeDeps.include` lists `cmdk`, `remark`, `remark-gfm`, `remark-html`, `use-sync-external-store/shim`, and `use-sync-external-store/shim/with-selector`.

**Named test exports:** `resolveTemplateVars`, `computeTemplateVars`, `parseDataFile`.

## Dependencies

- `node:fs`, `node:path`, `node:child_process` (execSync for git)
- `glob` (globSync)
- `jsonc-parser` (parseJsonc)
- `@dfosco/storyboard-core/canvas/materializer` — materializeFromText
- `@dfosco/storyboard-core/canvas/identity` — toCanvasId
- `@dfosco/storyboard-core/canvas/writeGuard` — `isCanvasWriteInFlight` (prevents duplicate HMR events when the canvas server API already pushed an update)
- `@dfosco/storyboard-core/config` — getConfig
- `@dfosco/storyboard-core/worktree/serverRegistry` — `listRunningServers` (live server list for branch injection, replaces stale `ports.json`)

## Dependents

None directly import this file. It is configured as a Vite plugin in `vite.config.js` and consumed at build time via the `virtual:storyboard-data-index` module by [`context.jsx`](../context.jsx.md).

## Notes

This is a ~1450-line file with significant complexity around canvas routing, story route generation, prototype metadata extraction, and config merging. Canvas JSONL files are materialized at build time. Duplicate name+suffix combinations within the same scope cause a build error. The `terminalSnapshotPlugin` is a separate exported plugin (not part of the main data plugin) that must be registered independently in `vite.config.js`.
