---
name: create-widget
description: Canvas widget manipulation — add, edit, move, remove, and inspect widgets on *.canvas.jsonl canvases. Use when asked to add a sticky note, embed a prototype, place markdown, move widgets, change widget properties, remove widgets, or inspect canvas contents.
---

# Create Widget

> Triggered by: "add widget", "add a sticky note", "place a note", "embed a prototype", "add markdown", "add a link", "edit widget", "change widget", "move widget", "remove widget", "delete widget", "inspect canvas", "show canvas", "what's on the canvas", "update widget", "resize widget", "change color", "canvas widget"

## What This Does

Manipulates widgets on an existing `*.canvas.jsonl` canvas — adding, editing, moving, removing, and inspecting widgets. Supports all widget types: **sticky notes**, **markdown blocks**, **prototype embeds**, and **link previews**.

This skill handles **widget operations on an existing canvas**. To create a new canvas file, use the **create** skill instead.

**Scope:** This skill manages **JSON-defined mutable widgets** only — the `widgets[]` array in `.canvas.jsonl`. Canvases may also have JSX-backed component widgets (from `.canvas.jsx` companion files) tracked via the `sources[]` array. Those are code-defined and only their **position** is managed in JSONL; their content lives in the `.canvas.jsx` file and is outside the scope of this skill.

---

## Step 0: Detect Operation Mode

Widget operations can be performed via the **Server API** (preferred when dev server is running) or **Direct File Editing** (fallback).

**Always run this check first:**

```bash
PORT=$(cat .port 2>/dev/null || echo 1234)
curl -sf "http://localhost:${PORT}/_storyboard/canvas/list" > /dev/null 2>&1 && echo "API" || echo "FILE"
```

- If `"API"` → use the Server API with `curl` at `http://localhost:${PORT}`
- If `"FILE"` → edit `.canvas.jsonl` files directly

## Step 0b: Identify the Target Canvas

Before any operation, resolve which canvas to target:

**Via API:** List canvases and let the user disambiguate if needed:

```bash
PORT=$(cat .port 2>/dev/null || echo 1234)
curl -s "http://localhost:${PORT}/_storyboard/canvas/list"
```

If only one canvas exists, use it. If multiple exist and the user didn't specify, ask which one.

**Via file system:** Find all canvas files:

```bash
find src/canvas -name "*.canvas.jsonl" 2>/dev/null
```

Canvas files live in `src/canvas/` — either at the root or inside `*.folder/` subdirectories. The canvas name is the filename without the `.canvas.jsonl` suffix (e.g., `src/canvas/design-overview.canvas.jsonl` → name is `design-overview`).

**Important:** Canvas names must be unique by basename. If two canvases share the same name across different folders, the server resolves to the first match found. Always verify with `/list` when ambiguity is possible.

---

## Canvas File Format (`.canvas.jsonl`)

Canvas data is stored as an **append-only JSONL event stream**. Each line is a self-contained JSON object representing an event. The first line is always a `canvas_created` event; subsequent lines are change events. Current state is derived by replaying all events in order.

### Event Types

| Event | Purpose | Key fields |
|-------|---------|------------|
| `canvas_created` | Initial state (always line 1) | `title`, `grid`, `gridSize`, `colorMode`, `widgets[]`, `sources[]` |
| `widget_added` | Append one widget | `widget: {id, type, position, props}` |
| `widget_updated` | Patch widget props | `widgetId`, `props: {partial}` |
| `widget_moved` | Update widget position | `widgetId`, `position: {x, y}` |
| `widget_removed` | Remove a widget by ID | `widgetId` |
| `widgets_replaced` | Replace entire widgets array | `widgets[]` |
| `settings_updated` | Patch canvas settings | `settings: {title?, grid?, gridSize?, colorMode?, dotted?, centered?, author?}` |
| `source_updated` | Replace JSX sources array | `sources[]` |

Every event **must** include an `event` field and a `timestamp` (ISO 8601) field.

### Example file

```jsonl
{"event":"canvas_created","timestamp":"2026-03-29T22:44:56.978Z","title":"Design Overview","grid":true,"gridSize":24,"colorMode":"auto","widgets":[]}
{"event":"widget_added","timestamp":"2026-03-29T23:00:00.000Z","widget":{"id":"sticky-note-abc123","type":"sticky-note","position":{"x":100,"y":200},"props":{"text":"Hello world","color":"yellow"}}}
{"event":"widget_added","timestamp":"2026-03-29T23:01:00.000Z","widget":{"id":"markdown-def456","type":"markdown","position":{"x":400,"y":200},"props":{"content":"## Notes\n\nSome markdown content","width":400}}}
```

### Position System

- **Origin:** top-left corner of the canvas (0, 0)
- **Units:** pixels
- **x** increases to the right, **y** increases downward
- Positions are rounded to integers
- Minimum values: `x >= 0`, `y >= 0`

### Widget ID Convention

IDs are generated as `{type}-{random6chars}` using lowercase alphanumeric characters:

```
sticky-note-abc123
markdown-def456
prototype-ghi789
link-preview-jkl012
```

When creating widgets via direct file editing, generate a random 6-character suffix:

```bash
ID="${TYPE}-$(cat /dev/urandom | LC_ALL=C tr -dc 'a-z0-9' | head -c 6)"
```

---

## Widget Types Reference

### 1. Sticky Note (`sticky-note`)

A colored note card with editable text.

| Prop | Type | Category | Default | Constraints |
|------|------|----------|---------|-------------|
| `text` | string | content | `""` | Free text, supports newlines |
| `color` | select | settings | `"yellow"` | One of: `yellow`, `blue`, `green`, `pink`, `purple`, `orange` |
| `width` | number | size | _(auto)_ | Minimum: 180 |
| `height` | number | size | _(auto)_ | Minimum: 60 |

**Example widget object:**

```json
{
  "id": "sticky-note-abc123",
  "type": "sticky-note",
  "position": { "x": 100, "y": 200 },
  "props": {
    "text": "Remember to update the API docs",
    "color": "blue"
  }
}
```

### 2. Markdown Block (`markdown`)

A rendered markdown content block.

| Prop | Type | Category | Default | Constraints |
|------|------|----------|---------|-------------|
| `content` | string | content | `""` | Markdown text (headings, bold, italic, code, lists) |
| `width` | number | size | `360` | Min: 200, Max: 1200 |

**Supported markdown syntax:** `# h1`, `## h2`, `### h3`, `**bold**`, `*italic*`, `` `code` ``, `- list items`, paragraphs (double newline).

**Example widget object:**

```json
{
  "id": "markdown-def456",
  "type": "markdown",
  "position": { "x": 400, "y": 100 },
  "props": {
    "content": "## Component API\n\n- `onClick` — primary action handler\n- `variant` — visual style: **primary**, **secondary**, **danger**",
    "width": 450
  }
}
```

### 3. Prototype Embed (`prototype`)

An iframe embedding an internal prototype page (or external URL).

| Prop | Type | Category | Default | Constraints |
|------|------|----------|---------|-------------|
| `src` | url/path | content | `""` | Prototype route (e.g. `/Example?flow=default`) or full URL |
| `label` | string | settings | `""` | Display label (falls back to `src`) |
| `zoom` | number | settings | `100` | Min: 25, Max: 200 (percentage) |
| `width` | number | size | `800` | Min: 200, Max: 2000 |
| `height` | number | size | `600` | Min: 200, Max: 1500 |

**`src` format:**
- Internal prototype: `/<PrototypeName>?flow=<flowName>` (e.g. `/Example?flow=default`)
- With hash overrides: `/Example?flow=default#user.name=Alice`
- External URL: `https://example.com` (full URL)

**Example widget object:**

```json
{
  "id": "prototype-ghi789",
  "type": "prototype",
  "position": { "x": 0, "y": 0 },
  "props": {
    "src": "/Signup?flow=Signup/validation-errors",
    "label": "Signup — Validation Errors",
    "zoom": 75,
    "width": 1024,
    "height": 768
  }
}
```

### 4. Link Preview (`link-preview`)

A card that displays a link with an optional title.

| Prop | Type | Category | Default | Constraints |
|------|------|----------|---------|-------------|
| `url` | url | content | `""` | Absolute URL (must include `https://`) |
| `title` | string | content | `""` | Optional display title |

**Example widget object:**

```json
{
  "id": "link-preview-jkl012",
  "type": "link-preview",
  "position": { "x": 600, "y": 50 },
  "props": {
    "url": "https://primer.style/components",
    "title": "Primer Components"
  }
}
```

---

## Operations

### Add a Widget

**Via API (preferred):**

```bash
PORT=$(cat .port 2>/dev/null || echo 1234)
curl -s -X POST "http://localhost:${PORT}/_storyboard/canvas/widget" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "<canvas-name>",
    "type": "<widget-type>",
    "position": { "x": <x>, "y": <y> },
    "props": { <widget-props> }
  }'
```

Response on success: `{"success": true, "widget": {id, type, position, props}}`

The server generates the widget ID automatically.

**Via direct file edit:**

Append a `widget_added` event line to the `.canvas.jsonl` file:

```jsonl
{"event":"widget_added","timestamp":"<ISO-8601>","widget":{"id":"<type>-<random6>","type":"<widget-type>","position":{"x":<x>,"y":<y>},"props":{<widget-props>}}}
```

---

### Edit Widget Props

Use this to change text, color, content, URL, zoom, dimensions, or any other widget property.

**Via API (read → modify → write):**

The server has no dedicated widget-update endpoint. You must:

1. **Read** the current state:
   ```bash
   PORT=$(cat .port 2>/dev/null || echo 1234)
   curl -s "http://localhost:${PORT}/_storyboard/canvas/read?name=<canvas-name>"
   ```

2. **Modify** the target widget's props in the returned `widgets` array (keeping all other widgets unchanged).

3. **Write** the full array back:
   ```bash
   curl -s -X PUT "http://localhost:${PORT}/_storyboard/canvas/update" \
     -H "Content-Type: application/json" \
     -d '{"name":"<canvas-name>","widgets":[<full-modified-widgets-array>]}'
   ```

**Critical:** `PUT /update` replaces the **entire** widgets array. Always preserve all widgets you are not modifying.

**Via direct file edit:**

Append a `widget_updated` event (surgical single-widget prop patch — no need to read first):

```jsonl
{"event":"widget_updated","timestamp":"<ISO-8601>","widgetId":"<widget-id>","props":{"text":"new text"}}
```

Only include the props you want to change — they are shallow-merged into existing props.

---

### Move a Widget

**Via API (read → modify → write):**

Same pattern as editing: read current state, update the target widget's `position` in the array, write the full array back via `PUT /update`. Preserve all other widgets unchanged.

**Via direct file edit:**

Append a `widget_moved` event (no need to read first):

```jsonl
{"event":"widget_moved","timestamp":"<ISO-8601>","widgetId":"<widget-id>","position":{"x":<new-x>,"y":<new-y>}}
```

---

### Remove a Widget

**Via API:**

```bash
PORT=$(cat .port 2>/dev/null || echo 1234)
curl -s -X DELETE "http://localhost:${PORT}/_storyboard/canvas/widget" \
  -H "Content-Type: application/json" \
  -d '{"name": "<canvas-name>", "widgetId": "<widget-id>"}'
```

**Via direct file edit:**

Append a `widget_removed` event:

```jsonl
{"event":"widget_removed","timestamp":"<ISO-8601>","widgetId":"<widget-id>"}
```

---

### Bulk Update (Multiple Changes at Once)

When making several changes (e.g. repositioning multiple widgets, editing several props), use a single bulk operation instead of multiple individual ones.

**Via API (read → modify → write):**

```bash
PORT=$(cat .port 2>/dev/null || echo 1234)
# 1. Read current state
STATE=$(curl -s "http://localhost:${PORT}/_storyboard/canvas/read?name=<canvas-name>")
# 2. Extract and modify the widgets array (use jq, python, or node)
# 3. Send the complete updated widgets array
curl -s -X PUT "http://localhost:${PORT}/_storyboard/canvas/update" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"<canvas-name>\",\"widgets\":$UPDATED_WIDGETS}"
```

**Critical:** Always start from the latest state. Never construct a `widgets` array from scratch — you'll lose widgets you didn't know about.

**Via direct file edit:**

For multiple individual changes (e.g. moving two widgets), append separate events:

```jsonl
{"event":"widget_moved","timestamp":"<ISO-8601>","widgetId":"<id-1>","position":{"x":100,"y":200}}
{"event":"widget_moved","timestamp":"<ISO-8601>","widgetId":"<id-2>","position":{"x":300,"y":200}}
```

For coordinated changes requiring atomicity, append a single `widgets_replaced` event with the full updated array. **Read the current state first** (replay the file or use grep) to avoid losing widgets:

```jsonl
{"event":"widgets_replaced","timestamp":"<ISO-8601>","widgets":[<complete-widgets-array>]}
```

---

### Read Canvas State (Inspect)

**Via API (preferred):**

```bash
PORT=$(cat .port 2>/dev/null || echo 1234)
curl -s "http://localhost:${PORT}/_storyboard/canvas/read?name=<canvas-name>" | python3 -m json.tool
```

Returns the materialized state: `{title, grid, gridSize, colorMode, widgets[], sources[], ...}`

**Via direct file reading:**

The API does full event replay and materialization. Without it, you can approximate the current widget state:

```bash
# Get the last full-state snapshot (canvas_created or widgets_replaced)
tac <file>.canvas.jsonl | grep -m1 -E '"widgets_replaced"|"canvas_created"' | python3 -m json.tool
```

Then look for any `widget_added`, `widget_updated`, `widget_moved`, or `widget_removed` events that appear **after** that snapshot line. Apply them mentally or via script.

For simple canvases with few events, just reading the whole file works:

```bash
cat <file>.canvas.jsonl | python3 -c "
import sys, json
events = [json.loads(l) for l in sys.stdin if l.strip()]
# Print last known widgets array
for e in reversed(events):
    if 'widgets' in e:
        print(json.dumps(e['widgets'], indent=2))
        break
"
```

---

## Operation Quick Reference

| Operation | API mode | File mode |
|-----------|----------|-----------|
| **Add widget** | `POST /widget` | Append `widget_added` event |
| **Remove widget** | `DELETE /widget` | Append `widget_removed` event |
| **Edit props** | `GET /read` → modify → `PUT /update` | Append `widget_updated` event |
| **Move widget** | `GET /read` → modify → `PUT /update` | Append `widget_moved` event |
| **Bulk changes** | `GET /read` → modify → `PUT /update` | Append `widgets_replaced` (read first!) |
| **Read state** | `GET /read?name=X` | Parse file events |
| **Update settings** | `PUT /update` with `settings` | Append `settings_updated` event |

---

### List All Canvases

**Via API:**

```bash
PORT=$(cat .port 2>/dev/null || echo 1234)
curl -s "http://localhost:${PORT}/_storyboard/canvas/list" | python3 -m json.tool
```

**Via file system:**

```bash
find src/canvas -name "*.canvas.jsonl" 2>/dev/null
```

---

### Update Canvas Settings

Change canvas-level settings (title, grid, color mode, etc.):

**Via API:**

```bash
PORT=$(cat .port 2>/dev/null || echo 1234)
curl -s -X PUT "http://localhost:${PORT}/_storyboard/canvas/update" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "<canvas-name>",
    "settings": {
      "title": "New Title",
      "grid": true,
      "gridSize": 24,
      "colorMode": "auto"
    }
  }'
```

Allowed settings keys: `title`, `description`, `grid`, `gridSize`, `colorMode`, `dotted`, `centered`, `author`.

**Via direct file edit:**

```jsonl
{"event":"settings_updated","timestamp":"<ISO-8601>","settings":{"title":"New Title"}}
```

---

## Procedure

### When the user asks to add a widget

1. **Identify the canvas.** If not specified, check if only one canvas exists. If multiple, ask which one.
2. **Identify the widget type.** Infer from context:
   - "sticky note", "note", "add a note" → `sticky-note`
   - "markdown", "text block", "content block" → `markdown`
   - "embed", "prototype", "iframe", "embed a page" → `prototype`
   - "link", "URL", "link preview" → `link-preview`
3. **Gather props from the user's message.** Extract text, colors, URLs, sizes from the request. Use sensible defaults for anything not specified.
4. **Choose a position.** If the user says "next to", "below", "to the right of" an existing widget, read current state and calculate position relative to that widget. Otherwise use `{x: 100, y: 100}` or space widgets with ~50px gaps.
5. **Execute the operation** using the API or direct file editing.
6. **Confirm** what was created, including the widget ID and position.

### When the user asks to edit a widget

1. **Identify the canvas and widget.** Match by ID, type, content, or position description (e.g. "the blue sticky note", "the markdown about API docs").
2. **Read current state** (required for both API and file mode) to find the target widget and its current props.
3. **Apply the requested changes** (color, text, content, size, URL, zoom, etc.).
4. **Execute:**
   - API: read → modify widgets array → `PUT /update` with full array
   - File: append `widget_updated` event with only the changed props
5. **Confirm** what changed.

### When the user asks to move a widget

1. **Identify the widget** as above.
2. **Read current state** to find the widget's current position.
3. **Determine the new position.** The user may say absolute coords or relative directions ("move it right", "place it below the prototype embed"). Calculate coordinates accordingly.
4. **Execute:**
   - API: read → modify position in widgets array → `PUT /update` with full array
   - File: append `widget_moved` event
5. **Confirm** new position.

### When the user asks to remove a widget

1. **Identify the widget** as above.
2. **Execute** via API `DELETE /widget` or `widget_removed` event.
3. **Confirm** removal.

### When the user asks to inspect or describe the canvas

1. **Read the current state** via API or file.
2. **Summarize:** list widget types, counts, brief content preview, positions.

---

## Layout Helpers

When arranging multiple widgets, use these spacing conventions:

- **Horizontal gap between widgets:** 50–100px
- **Vertical gap between widgets:** 50–100px
- **Grid alignment:** align to `gridSize` (default 24px) when canvas grid is enabled
- **Common layouts:**
  - **Row:** place widgets at same `y`, incrementing `x` by `widget.width + gap`
  - **Column:** place widgets at same `x`, incrementing `y` by estimated height + gap
  - **Grid:** combine row and column patterns

**Estimated widget heights** (for layout calculations):
- Sticky note: 180px (default, or use explicit `height` prop)
- Markdown: varies by content; estimate ~20px per line of text + 40px padding
- Prototype embed: use `height` prop (default 600px)
- Link preview: ~80px

---

## Rules

- **Always read current canvas state before editing or removing** — never guess widget IDs or positions.
- **Prefer the API** when the dev server is running — it handles ID generation, validation, and materialization.
- **Use direct file editing only as fallback** when the API is unavailable.
- **One operation at a time for individual changes**, bulk `widgets_replaced` for multi-widget changes.
- **Preserve all existing widgets** when doing bulk operations — never drop widgets the user didn't ask to change.
- **Widget IDs are stable** — once created, a widget's ID doesn't change. Always use the exact ID from the state.
- **Props are shallow-merged** on `widget_updated` — only include the props you want to change.
- **Validate prop constraints** before writing (colors must be valid, numbers within min/max ranges, URLs properly formatted).
- **Canvas files live in `src/canvas/`** — either at the root or inside `*.folder/` directories.
- **Timestamps must be ISO 8601 format** — use `new Date().toISOString()` or `date -u +"%Y-%m-%dT%H:%M:%S.000Z"`.
