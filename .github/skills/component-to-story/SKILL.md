---
name: component-to-story
description: Migrates canvas JSX companion components (.canvas.jsx) into standalone story files (.story.jsx), updates the canvas JSONL to replace component sources with story widgets, and cleans up the old companion file.
---

# Component to Story Migration

> Triggered by: "migrate component to story", "convert component to story", "component to story", "migrate canvas component", "convert canvas jsx to story"

## What This Does

Migrates **canvas JSX companion** components (`.canvas.jsx`) into standalone **story files** (`.story.jsx`). After migration:

- A new `.story.jsx` file contains the component exports (rewritten as story variants)
- The canvas JSONL is updated with `widget_added` events for each migrated export (as story widgets)
- A `source_updated` event removes the migrated component sources
- The old `.canvas.jsx` file is deleted

This is an **all-or-nothing** migration per canvas — all named exports in a `.canvas.jsx` are migrated together to avoid broken dependencies between exports.

---

## Procedure

### Step 0: Identify the target canvas

If the user specified a canvas name, use it. Otherwise, discover canvases that have JSX companions:

```bash
# Find all .canvas.jsx files
find src/canvas src/components -name "*.canvas.jsx" -o -name "*.canvas.tsx" 2>/dev/null
```

If multiple canvases have companions, use `ask_user` to let the user pick which canvas to migrate (or offer "all" to batch them).

If no `.canvas.jsx` files exist, inform the user there's nothing to migrate.

---

### Step 1: Read the companion and canvas files

For the target canvas (e.g., `button-patterns`):

1. **Read the `.canvas.jsx` file** — identify all **named exports** (these are the components rendered on the canvas). Note any shared imports, helpers, hooks, or constants used across exports.

2. **Read the `.canvas.jsonl` file** — materialize the current state to get:
   - `state.sources` — the component source entries with positions
   - `state.widgets` — existing widgets (these stay untouched)

Build a migration map: for each named export in the `.canvas.jsx`, find its matching `sources` entry (matched by `export` field).

**Important:** If the `.canvas.jsx` has named exports that do NOT appear in `sources`, they still render on the canvas (at position 0,0). Include these in the migration too.

---

### Step 2: Create the story file

Create a new `.story.jsx` file. The location depends on where the `.canvas.jsx` lives:

- If in `src/canvas/<folder>/` → create story at `src/canvas/<folder>/<name>.story.jsx`
- If in `src/components/` → create story at `src/components/<name>.story.jsx`
- Default: same directory as the `.canvas.jsx`

The story file name (without `.story.jsx`) becomes the **storyId**.

#### Rewriting the code

Copy the full content of the `.canvas.jsx` and adapt it:

1. **Keep all imports** — stories use the same import patterns as canvas components
2. **Keep all named exports** — each becomes a story variant
3. **Keep shared helpers/hooks/constants** — they may be used across exports
4. **Remove any `export default`** — stories only use named exports (StoryPage ignores default)
5. **Do NOT rename exports** — the export names are used as `exportName` in widget references

The rewrite should be minimal — stories and canvas components have the same export convention (named React function exports). The main change is the file suffix.

Example — before (`button-patterns.canvas.jsx`):
```jsx
import { Button } from '@primer/react'

export function PrimaryButtons() {
  return (
    <div style={{ padding: '1.5rem', display: 'flex', gap: '0.5rem' }}>
      <Button variant="primary">Save</Button>
      <Button>Cancel</Button>
    </div>
  )
}

export function DangerButtons() {
  return (
    <div style={{ padding: '1.5rem', display: 'flex', gap: '0.5rem' }}>
      <Button variant="danger">Delete</Button>
    </div>
  )
}
```

After (`button-patterns.story.jsx`):
```jsx
import { Button } from '@primer/react'

export function PrimaryButtons() {
  return (
    <div style={{ padding: '1.5rem', display: 'flex', gap: '0.5rem' }}>
      <Button variant="primary">Save</Button>
      <Button>Cancel</Button>
    </div>
  )
}

export function DangerButtons() {
  return (
    <div style={{ padding: '1.5rem', display: 'flex', gap: '0.5rem' }}>
      <Button variant="danger">Delete</Button>
    </div>
  )
}
```

In many cases the content is identical — only the filename changes.

---

### Step 3: Update the canvas JSONL

Append new events to the `.canvas.jsonl` file. **Never rewrite existing events** — the JSONL is an append-only event log.

#### 3a: Idempotency check

Before adding widgets, check if any story widgets already reference this storyId. Parse the materialized widgets:

```js
const existingStoryWidgets = state.widgets.filter(
  w => w.type === 'story' && w.props?.storyId === storyId
)
```

Skip adding a `widget_added` event for any export that already has a corresponding story widget (matched by `exportName`).

#### 3b: Append `widget_added` events

For each named export being migrated, append a `widget_added` event:

```jsonl
{"event":"widget_added","timestamp":"<ISO timestamp>","widget":{"id":"story-<random-6-char>","type":"story","position":{"x":<source.x>,"y":<source.y>},"props":{"storyId":"<story-file-name>","exportName":"<ExportName>","width":600,"height":400}}}
```

Field details:
- **`id`**: Generate as `story-<6-random-alphanumeric>` (e.g., `story-h12tkn`)
- **`position`**: Use the source entry's position (`source.position.x`, `source.position.y`). If no source entry exists for this export, place it at `{"x": 0, "y": 0}`
- **`storyId`**: The story file name without the `.story.jsx` suffix (e.g., `button-patterns`)
- **`exportName`**: The exact named export (e.g., `PrimaryButtons`). Use empty string `""` only if the story has a single export and you want to render all variants
- **`width`/`height`**: Default to `600` × `400` (the standard story widget size)
- **`timestamp`**: Current ISO timestamp

#### 3c: Append `source_updated` event

After all widget events, append a `source_updated` event that removes the migrated sources. Since `source_updated` is a **full replacement** (not a patch), you must include any sources that were NOT migrated:

```jsonl
{"event":"source_updated","timestamp":"<ISO timestamp>","sources":[]}
```

If ALL sources were migrated (the common case for all-or-nothing), this is simply an empty array. If for some reason some sources should remain (e.g., from a different `.canvas.jsx`), include only those.

---

### Step 4: Delete the old companion file

After the JSONL is updated, delete the `.canvas.jsx` file:

```bash
rm <path-to-canvas>.canvas.jsx
```

If the companion was a `.canvas.tsx`, delete that instead.

---

### Step 5: Verify and confirm

1. **Check the dev server** — if running, the Vite watcher should pick up the new `.story.jsx` and the deleted `.canvas.jsx`. The canvas page should now show story widgets where components used to be.

2. **Report to the user**:
   - Which canvas was migrated
   - The new story file path and its route URL (`/components/<storyId>`)
   - How many exports were migrated
   - How many story widgets were added to the canvas
   - The deleted `.canvas.jsx` path

3. **Suggest next steps**:
   - Visit `/components/<storyId>` to see the story page with all variants
   - Reload the canvas page if widgets don't appear immediately (the live-patch HMR should handle this automatically in most cases)
   - Run the project linter to catch any import issues: `npm run lint`

---

## Batch Mode

When the user says "migrate all components to stories" or selects "all" in the picker:

1. Discover all `.canvas.jsx` / `.canvas.tsx` files
2. Run the migration procedure for each, sequentially
3. Report a summary at the end:
   - Total canvases migrated
   - Total exports converted
   - Total story widgets added
   - Any failures (with reasons)

---

## Edge Cases

### Canvas has no sources but has JSX exports
The exports still render on the canvas (at default position). Migrate them and place story widgets at `{"x": 0, "y": 0}`.

### Canvas JSX has a default export
Ignore it — stories only use named exports. If the default export is the only export, warn the user that the component needs to be refactored into named exports first.

### Canvas has both components AND existing story widgets
Only touch the `sources` array. Leave existing widgets (including story widgets) untouched. The new `widget_added` events are appended alongside them.

### Shared imports between multiple canvas companions
If two `.canvas.jsx` files import from the same local module, the migration still works since story files can import from the same locations. No special handling needed.

### Duplicate storyId conflict
If a `.story.jsx` with the same name already exists, use `ask_user` to let the user choose:
- Merge exports into the existing story file
- Use a different name (e.g., `<name>-v2`)
- Abort this canvas migration

---

## CLI Shortcut

This skill does not have a CLI command — it is Copilot-only. The agent performs all file operations directly.

```
# Example invocations:
"migrate button-patterns component to story"
"convert all canvas components to stories"
"component to story for design-overview canvas"
```
