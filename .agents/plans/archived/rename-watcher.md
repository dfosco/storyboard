# Rename Watcher

## Problem
When prototype/canvas files or directories are renamed, canvas embed widgets that reference those routes via `props.src` become stale. This requires manual URL updates across potentially many canvas JSONL files.

## Solution
A file-system watcher that runs alongside `storyboard dev`, detects renames, updates affected canvas embed URLs, and auto-commits the changes.

## Implementation

### Files
- `packages/core/src/rename-watcher/config.json` — user-editable watched directories, exclusions, debounce, autocommit settings
- `packages/core/src/rename-watcher/watcher.js` — snapshot-based rename detection, canvas embed URL rewriting, auto-commit
- `packages/core/src/cli/dev.js` — wires the watcher into `storyboard dev`

### Design
1. **Snapshot diffing**: On startup, scans watched directories. On any `fs.watch` event (debounced 500ms), re-scans and diffs old vs new file sets.
2. **Phase 1 — File renames**: Same directory, same extension, exactly 1 removed + 1 added → file rename.
3. **Phase 2 — Directory renames**: If all unmatched removed/added files can be explained by a single prefix swap → directory rename.
4. **Ambiguity guard**: Only acts on unambiguous 1:1 mappings to avoid false positives.
5. **Canvas embed update**: Materializes each `.canvas.jsonl`, rewrites `props.src` on prototype/canvas widgets using segment-boundary matching.
6. **Auto-commit**: Uses `git commit --only` with repo-busy guards (index.lock, merge, rebase).

### Key decisions
- Uses `fs.watch({ recursive: true })` (Node native) — no additional dependencies
- Does NOT update `flow=` query params (flow names are data identifiers, not route paths)
- Segment-boundary URL matching prevents partial rewrites (e.g. `/Signup` won't match `/Signup2`)
- `.folder` renames are correctly ignored (routes don't change when `.folder` segments are renamed)
