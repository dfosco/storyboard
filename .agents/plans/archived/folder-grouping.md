# Folder Grouping for Prototypes

## Problem

The Viewfinder currently shows a flat list of prototypes. There's no way to group related prototypes together — e.g., "Getting Started" tutorials vs. "Advanced" examples. We need a file-system-driven grouping mechanism that doesn't interfere with routing.

## Convention

**Directory suffix: `.folder`**

A directory inside `src/prototypes/` with a `.folder` suffix is a **folder group** — it groups the prototypes inside it visually in the Viewfinder, but is **not** a route.

```
src/prototypes/
├── Getting Started.folder/          ← folder group (not a route)
│   ├── getting-started.folder.json  ← optional metadata (title, description, icon)
│   ├── Example/                     ← prototype (route: /Example)
│   │   ├── example.prototype.json
│   │   ├── basic.flow.json
│   │   └── index.jsx
│   └── Signup/                      ← prototype (route: /Signup)
│       ├── signup.prototype.json
│       └── index.jsx
├── AnotherPrototype/                ← prototype at top level (no folder)
│   └── ...
```

**Metadata file** (`*.folder.json`): optional, same `meta` shape as `.prototype.json`:

```json
{
  "meta": {
    "title": "Getting Started",
    "description": "Introductory prototypes for new users",
    "icon": "📚"
  }
}
```

If no metadata file is provided, the display name is derived from the directory name (strip `.folder` suffix).

**Single level only**: folders cannot be nested inside other folders.

## Approach

The change touches **7 files** across the core and react packages, plus tests. The route, data discovery, data model, viewfinder logic, and viewfinder UI layers all need updates.

## Todos

### 1. `routes` — Generouted routing exclusions for `.folder` directories
**File:** `src/routes.jsx`

This is critical — generouted's file-based routing discovers ALL `.jsx` files under `src/prototypes/` via `import.meta.glob`. The `.folder/` directory segments must be handled at the route level:

- **`patterns.route` regex** (line 18): Update to also strip `*.folder/` path segments. Currently:
  ```js
  patterns.route = [/^.*\/src\/prototypes\/|^\/prototypes\/|\.(jsx|tsx|mdx)$/g, '']
  ```
  Needs to become:
  ```js
  patterns.route = [/^.*\/src\/prototypes\/|^\/prototypes\/|[^/]*\.folder\/|\.(jsx|tsx|mdx)$/g, '']
  ```
  This ensures `src/prototypes/X.folder/MyProto/index.jsx` generates route `/MyProto/` (not `/X.folder/MyProto/`).

- **Glob patterns** (lines 20-25): The existing `**` wildcards already cross `.folder/` directories, so `ROUTES`, `MODALS`, and `PRESERVED` globs don't need changes — they'll discover `.jsx` files inside `.folder/` directories correctly. However, the `PRESERVED` glob only matches root-level `_app`/`404` files, which is correct (we don't want `.folder/`-level `_app.jsx` files).

- **Route deduplication risk**: If two prototypes in different folders have the same name (e.g., `A.folder/Settings/index.jsx` and `B.folder/Settings/index.jsx`), they'd both try to register route `/Settings/` — this would be a generouted conflict. Document this as a known limitation (same-name prototypes across folders is not supported).

### 2. `data-plugin` — Discover folders and adjust scoping
**File:** `packages/react/src/vite/data-plugin.js`

- Add `folder` to the glob pattern: `**/*.{flow,scene,object,record,prototype,folder}.{json,jsonc}`
- Add `folder` to `buildIndex` → `index = { flow: {}, object: {}, record: {}, prototype: {}, folder: {} }`
- Update `parseDataFile()`:
  - Handle `suffix === 'folder'`: extract the name from the `.folder/` parent directory (strip `.folder` suffix). E.g., `Getting Started.folder/getting-started.folder.json` → name `Getting Started`.
  - Handle files inside `.folder/` directories: for prototype/flow/record suffixes, update the regex to skip `.folder/` path segments when extracting the prototype scope. The current regex `src/prototypes/([^/]+)/` would capture `GettingStarted.folder` — it needs to skip `.folder` directories and capture the next segment.
    - New regex: `/(?:^|\/)src\/prototypes\/(?:[^/]+\.folder\/)?([^/]+)\//`
  - Inject a `folder` field into prototype metadata at `generateModule` time so prototypes know which folder they belong to.
- Update `generateModule()`:
  - Include `folders` in the generated init call: `init({ flows, objects, records, prototypes, folders })`
  - Export `folders` alongside the other collections
- Update file watcher to handle `.folder.json` changes

### 3. `loader` — Store and expose folder data
**File:** `packages/core/src/loader.js`

- Add `folders: {}` to the initial `dataIndex`
- Update `init()` to accept `folders`: `dataIndex.folders = index.folders || {}`
- Add `listFolders()` → returns `Object.keys(dataIndex.folders)`
- Add `getFolderMetadata(name)` → returns `dataIndex.folders[name] ?? null`
- Export the new functions

### 4. `core exports` — Re-export folder functions
**File:** `packages/core/src/index.js`

- Export `listFolders` and `getFolderMetadata` from `./loader.js`

### 5. `viewfinder logic` — Group prototypes by folder
**File:** `packages/core/src/viewfinder.js`

- Import `listFolders`, `getFolderMetadata` from `./loader.js`
- Update `buildPrototypeIndex()` to:
  - Read all folders and their metadata
  - Group prototypes into folders based on their `folder` field (injected by data-plugin)
  - Return a new shape:
    ```js
    {
      folders: [
        {
          name: "Getting Started",        // display name (from meta.title or dirName)
          dirName: "Getting Started",      // key (folder directory name sans .folder)
          description: null,
          icon: null,
          prototypes: [ /* prototype entries with their flows */ ]
        }
      ],
      prototypes: [ /* ungrouped prototypes (not in any folder) */ ],
      globalFlows: [ /* flows not in any prototype */ ]
    }
    ```

### 6. `viewfinder UI` — Render folder sections
**File:** `packages/core/src/svelte-plugin-ui/components/Viewfinder.svelte`

- Build a unified display list: `[...folders (with nested prototypes), ...ungrouped prototypes, ...global flows group]`
- Render folders as collapsible section headers containing their prototypes
- Ungrouped prototypes render at the top level (same as today)
- Folder header: shows name, optional description, optional icon
- Folder is collapsible (starts expanded)
- Visual distinction: folder header styled as a section divider/label, not as a clickable prototype card
- Update the stats line to reflect the new grouping

### 7. Tests
- **`packages/react/src/vite/data-plugin.test.js`** — Add tests for:
  - `.folder.json` discovery and parsing
  - Prototype scoping inside `.folder/` directories (flows, records, objects)
  - Folder metadata injection into prototype data
  - `folders` appearing in generated module
- **`packages/core/src/viewfinder.test.js`** — Add tests for:
  - `buildPrototypeIndex` with folders — prototypes grouped correctly
  - Prototypes without a folder remain ungrouped
  - Folder metadata (title, description, icon) propagated
- **`packages/core/src/loader.test.js`** — Add tests for:
  - `listFolders()` and `getFolderMetadata()`

## Notes

- The `.folder` suffix was chosen over underscore prefix (`_GettingStarted/`) or parentheses (`(GettingStarted)/`) because it's more semantic and explicit. It follows the existing pattern of suffix-based file type naming (`.flow.json`, `.prototype.json`).
- Folder names can include spaces — they don't become routes so URL encoding isn't a concern.
- **Same-name prototypes across folders**: Two prototypes with the same directory name in different folders would create a route conflict. This is a known limitation.
- The Viewfinder React wrapper (`packages/react/src/Viewfinder.jsx`) shouldn't need changes since it delegates to the Svelte component.
