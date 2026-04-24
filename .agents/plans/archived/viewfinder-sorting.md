# Viewfinder Sorting (Title A-Z / Last Updated)

## Problem

The Viewfinder lists prototypes in file-system order. Users need to sort by title (A-Z) or by last updated (most recently changed first).

## Approach

1. **Build-time**: Generate a `lastModified` ISO timestamp for each prototype by querying git for the most recent commit touching any file in the prototype directory. Inject it into prototype metadata alongside `gitAuthor`.

2. **Frontend**: Add a sort toggle to the Viewfinder header. Two options: "Title" (A-Z) and "Last updated" (newest first). Default to "Last updated". Apply sorting to both ungrouped prototypes and prototypes within folders.

## Todos

### 1. `data-plugin` — Generate `lastModified` timestamps
**File:** `packages/react/src/vite/data-plugin.js`

- Add `getLastModified(root, dirPath)` function using `git log -1 --format="%aI" -- "{dirPath}"` to get the most recent commit date for any file in a prototype directory
- In `generateModule()`, inject `lastModified` into prototype metadata (same pattern as `gitAuthor`)
- The dir path should be the prototype directory, not just the `.prototype.json` file — so it captures changes to any file (flows, pages, components)

### 2. `viewfinder logic` — Pass through `lastModified`
**File:** `packages/core/src/viewfinder.js`

- Add `lastModified: raw?.lastModified || null` to the prototype entry in `buildPrototypeIndex()`
- No sorting here — keep the data layer sort-agnostic, sorting happens in the UI

### 3. `viewfinder UI` — Sort toggle and sorting logic
**File:** `packages/core/src/svelte-plugin-ui/components/Viewfinder.svelte`

- Add a sort toggle in the header (next to the stats line or branch dropdown)
- Two options: "Title" (alphabetical A-Z) and "Last updated" (newest first)
- Default: "Last updated"
- Sort applies to:
  - Ungrouped prototypes
  - Prototypes within each folder (sorted independently per folder)
  - Folders themselves (by most recent prototype within them)
- Use Octicon icons for the sort toggle (e.g. `sort-asc` / `sort-desc`)

### 4. Tests
- **`data-plugin.test.js`**: Test that `lastModified` appears in generated module for prototypes
- **`viewfinder.test.js`**: Test that `lastModified` is passed through in `buildPrototypeIndex()`
