# Plan: Fix `hideFlows` + Add `_` Prefix Ignoring

## Problem 1: `hideFlows` not working on client repos

A prototype with `"hideFlows": true` in its `.prototype.json` still expands and shows its flows in the Viewfinder, even when it has a single flow.

### Root cause

In `buildPrototypeIndex()` (`packages/core/src/viewfinder.js`, line 93–104), the metadata is extracted as:

```js
const raw = getPrototypeMetadata(name)   // full .prototype.json contents
const meta = raw?.meta || raw || {}       // prefers raw.meta if it exists
// ...
hideFlows: meta.hideFlows || false,
```

If the user puts `hideFlows` at the top level of the JSON (alongside `meta`) rather than *inside* `meta`, it gets silently ignored because `raw?.meta` takes precedence over `raw` itself. The fix should check both locations.

Additionally, the `||` operator is falsy-coalescing — `meta.hideFlows || false` would fail if `hideFlows` were `0` or `""`, though in practice it's always a boolean. Should use `?? false` for correctness.

### Fix

In `packages/core/src/viewfinder.js`, line 104:

```js
// Before
hideFlows: meta.hideFlows || false,

// After — check both meta.hideFlows and raw.hideFlows
hideFlows: meta.hideFlows ?? raw?.hideFlows ?? false,
```

Same pattern for line 127 (dynamic prototype fallback) is already `false`, no change needed.

### Affected files
- `packages/core/src/viewfinder.js` — line 104
- `packages/core/src/viewfinder.test.js` — add test for top-level `hideFlows`

---

## Problem 2: No way to exclude data files with `_` prefix

There's no convention for marking data files or directories as "ignored" or "draft." Following generouted's convention (where `_`-prefixed files/dirs are excluded from routes), storyboard data files prefixed with `_` should be skipped.

### Desired behavior

| File | Behavior |
|------|----------|
| `draft.flow.json` | ✅ Indexed normally |
| `_draft.flow.json` | ❌ Ignored |
| `_wip/default.flow.json` | ❌ Ignored (parent dir starts with `_`) |
| `prototypes/_Archive/example.prototype.json` | ❌ Ignored |
| `prototypes/Dashboard/_notes.object.json` | ❌ Ignored |

### Fix

In `packages/react/src/vite/data-plugin.js`, the `parseDataFile()` function (line 23) returns parsed metadata for each file. Add an early return for `_`-prefixed basenames. Also filter out files inside `_`-prefixed directories.

```js
function parseDataFile(filePath) {
  const base = path.basename(filePath)

  // Skip _-prefixed files (drafts/internal)
  if (base.startsWith('_')) return null

  // Skip files inside _-prefixed directories
  const normalized = filePath.replace(/\\/g, '/')
  if (normalized.split('/').some(seg => seg.startsWith('_') && seg !== '_data')) return null

  // ... existing logic
}
```

### Affected files
- `packages/react/src/vite/data-plugin.js` — `parseDataFile()` function

---

## Todos

1. **fix-hideflows-fallback** — In `viewfinder.js` line 104, check both `meta.hideFlows` and `raw.hideFlows` with nullish coalescing so the config works regardless of JSON nesting
2. **add-underscore-ignore** — In `data-plugin.js` `parseDataFile()`, skip files with `_`-prefixed basenames and files inside `_`-prefixed directories
3. **add-tests** — Add test for top-level `hideFlows` in `viewfinder.test.js`. Add test fixtures for `_`-prefixed file filtering in data-plugin tests if they exist.
4. **verify-existing-tests** — Run full test suite to ensure no regressions

## Notes

- The Viewfinder.svelte UI logic (line 231: `proto.hideFlows && proto.flows.length === 1`) is correct and doesn't need changes
- The `_` convention aligns with generouted's existing behavior where `_`-prefixed files aren't routes
- No `_`-prefixed data files currently exist in the repo, so this is a net-new convention
