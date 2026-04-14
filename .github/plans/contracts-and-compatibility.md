# Contracts and Compatibility — Implementation Plan

## Problem Statement

The 4.0.0 roadmap requires shared contracts before feature slices (paste URL rules, GitHub embeds, command palette) can ship independently. Currently:

1. **Canvas identity is basename-only** — `findCanvasPath()` and the data-plugin both key canvases by bare name (e.g. `design-overview`), not by path. Two canvases in different folders with the same basename would collide.
2. **No config schema for upcoming features** — `storyboard.config.json` has no keys for paste URL rules, GitHub embed behavior, or command palette providers. Feature slices need these contracts to code against.
3. **No documented compatibility/migration** for projects upgrading to 4.0.0 with existing canvas data.

## Approach

Define contracts as code — schemas, defaults, and documented types — so downstream slices can import/consume them without rework. All new config keys have safe defaults so existing projects work unchanged.

## Files to Change

| File | Action | Purpose |
|------|--------|---------|
| `packages/core/src/configSchema.js` | **Create** | Canonical config schema with defaults, validation, and JSDoc types |
| `packages/core/src/canvas/identity.js` | **Create** | Path-based canvas ID utilities: `toCanvasId(relPath)`, `parseCanvasId(id)` |
| `packages/core/src/canvas/server.js` | **Modify** | Use `identity.js` in `findCanvasPath()` — keep basename fallback for compat |
| `packages/react/src/vite/data-plugin.js` | **Modify** | Use `identity.js` for canvas indexing; emit path-based IDs alongside names |
| `packages/react/src/context.jsx` | **Modify** | Support path-based canvas IDs in `canvasRouteMap` |
| `packages/core/scaffold/storyboard.config.json` | **Modify** | Add new keys with defaults for scaffold |
| `storyboard.config.json` | **Modify** | Add new keys for this repo |

## Steps

### 1. Create `configSchema.js` — config contract

Define the full `storyboard.config.json` schema with:

- **Existing keys** (documented as-is): `customDomain`, `devDomain`, `repository`, `modes`, `comments`, `plugins`, `workshop`, `featureFlags`, `ui`, `toolbar`
- **New keys with defaults:**
  - `canvas.pasteRules` — array of `{ match: RegExp, widgetType: string, propsMap: object }` rules for URL→widget conversion. Default: built-in Figma rule.
  - `canvas.github.embedBehavior` — `"link-preview" | "rich-embed"` (default: `"link-preview"`)
  - `canvas.github.ghGuard` — `"copy" | "link" | "off"` (default: `"copy"`) — what `gh` CLI guard does
  - `commandPalette.providers` — array of provider IDs to enable (default: `["prototypes", "flows", "canvases", "pages"]`)
  - `commandPalette.ranking` — `"recent" | "alphabetical" | "frecency"` (default: `"frecency"`)

Export: `getConfig(raw)` — merges user config over defaults, returns validated config. `getConfigDefaults()` — returns bare defaults.

### 2. Create `canvas/identity.js` — path-based canvas ID

- `toCanvasId(relPath)` — `"src/canvas/design.folder/overview.canvas.jsonl"` → `"design/overview"`. Strips `src/canvas/`, `.folder` suffixes, and `.canvas.jsonl`. Falls back to basename for paths outside `src/canvas/`.
- `parseCanvasId(id)` — `"design/overview"` → `{ folder: "design", name: "overview" }`. Plain `"overview"` → `{ folder: null, name: "overview" }`.
- `canvasIdToRoute(id)` — `"design/overview"` → `"/canvas/overview"` (route stays name-based for URL compat).
- `isLegacyCanvasId(id)` — returns true if ID has no `/` (basename-only).

### 3. Wire `identity.js` into data-plugin

In `parseDataFile()` for canvas files, set a new `id` field using `toCanvasId()`. The `index.canvas` map switches from `{ name: absPath }` to `{ id: absPath }` — but also emits a `_legacyNameMap` for backward compat so `name`-based lookups still work.

### 4. Wire `identity.js` into canvas server

`findCanvasPath()` tries path-based ID first, falls back to basename match. No API change — callers still pass a name string, server resolves it.

### 5. Wire into context.jsx

`canvasRouteMap` populates from both path-based IDs and legacy names. Route matching is unchanged (still `/canvas/<name>`).

### 6. Update scaffold and repo configs

Add the new keys with defaults to both `storyboard.config.json` files.

### 7. Wire `getConfig()` into server-plugin

`readConfig()` in server-plugin passes raw config through `getConfig()` so all consumers get validated, defaulted config.

## Edge Cases & Risks

- **Existing projects** must work unchanged — all new config keys have defaults, and canvas name-based lookup is a fallback path.
- **Duplicate canvas names in different folders** — currently throws. Path-based IDs fix this by making the key unique. But legacy name lookups remain ambiguous — log a warning when two canvases share a name.
- **Branch base-path** — `isSameOriginPrototype()` in CanvasPage.jsx already handles `BRANCH_PREFIX_RE`. No changes needed for the contract layer.
- **No runtime breaking changes** — all new exports are additive. No existing API signatures change.
