---
name: canvas
description: Work with Storyboard canvases — add, move, update, remove, and arrange widgets. Use when asked to add a sticky note, move a widget, rearrange widgets, update widget content, delete a widget, or describe canvas state.
---

# Canvas

> Triggered by: "add a sticky note", "add widget", "move widget", "delete widget", "rearrange", "update sticky", "change the text", "put a markdown", "to the right of", "below", "next to", "describe the canvas", "what's on the canvas", "list widgets", "remove widget"

## What This Does

Reads, manipulates, and arranges widgets on a Storyboard canvas. Supports absolute and relational positioning, bulk layout, content updates, and widget removal — all through the canvas server API.

## Prerequisites

- The dev server **must** be running (`storyboard dev` or `npm run dev`)
- The target canvas must already exist

---

## Reference: Widget Types and Default Sizes

| Type | Default W×H | Content Prop | Other Props |
|------|------------|-------------|-------------|
| `sticky-note` | 270×170 | `text` | `color` (yellow, blue, green, pink, purple, orange), `width`, `height` |
| `markdown` | 530×240 | `content` (markdown) | `width` |
| `prototype` | 800×600 | `src` (URL/path) | `label`, `zoom` (25–200), `width`, `height` |
| `figma-embed` | 800×450 | `url` | `width`, `height` |
| `image` | — | `src` (image path/URL) | `width`, `height`, `private` |
| `link-preview` | — | `url` | `title` |

## Reference: Grid & Spacing

- Default grid size: **24px** (stored in the canvas JSONL as `gridSize`; fall back to 24)
- When positioning: **snap to grid** — `Math.round(value / gridSize) * gridSize`
- Standard gap between widgets: **1 grid unit** (= `gridSize`, usually 24px)

## Reference: Server API

All endpoints are at `http://localhost:{PORT}/_storyboard/canvas/`. The port is determined by the worktree:

```js
import { detectWorktreeName, getPort } from '@dfosco/storyboard-core/worktree/port'
const port = getPort(detectWorktreeName())
```

### Read canvas state
```
GET /read?name={CANVAS_NAME}
```
Returns the materialized canvas:
```json
{
  "title": "My Canvas",
  "grid": true,
  "gridSize": 24,
  "widgets": [
    {
      "id": "sticky-note-abc123",
      "type": "sticky-note",
      "position": { "x": 100, "y": 200 },
      "props": { "text": "Hello", "color": "yellow", "width": 270, "height": 170 }
    }
  ]
}
```

### List canvases
```
GET /list
```
Returns `{ canvases: [{ name, title, path, widgetCount }] }`.

### Add a widget
```
POST /widget
{ "name": "{CANVAS}", "type": "{TYPE}", "position": { "x": 0, "y": 0 }, "props": {} }
```
Or via CLI: `npx storyboard canvas add {TYPE} --canvas {NAME} --x {X} --y {Y} --props '{JSON}'`

### Remove a widget
```
DELETE /widget
{ "name": "{CANVAS}", "widgetId": "{WIDGET_ID}" }
```

### Bulk update (move, resize, reorder, update props)
```
PUT /update
{ "name": "{CANVAS}", "widgets": [ ...full widgets array... ] }
```
This replaces the entire widgets array. **Always read the current state first**, modify the array, then PUT it back.

### Update canvas settings
```
PUT /update
{ "name": "{CANVAS}", "settings": { "title": "...", "grid": true, "gridSize": 24, ... } }
```
Allowed setting keys: `title`, `description`, `grid`, `gridSize`, `colorMode`, `dotted`, `centered`, `author`, `snapToGrid`.

---

## Procedure

### Step 1: Identify the canvas

If the user doesn't specify which canvas:
```bash
curl -s http://localhost:{PORT}/_storyboard/canvas/list
```
If there's one canvas, use it. If multiple, ask the user.

### Step 2: Read the canvas state

**Always read the current state before any operation that involves positioning or modifying existing widgets:**

```bash
curl -s "http://localhost:{PORT}/_storyboard/canvas/read?name={CANVAS_NAME}"
```

Parse the response to get the `widgets` array and `gridSize`.

### Step 3: Resolve positioning (for add/move operations)

**Absolute** — User gives coordinates:
> "Add a sticky note at 200, 400" → `x=200, y=400` (snap to grid)

**Relational** — User positions relative to another widget:

| Relation | X formula | Y formula |
|----------|-----------|-----------|
| **right of** ref | `ref.x + ref.width + gap` | `ref.y` |
| **left of** ref | `ref.x - new.width - gap` | `ref.y` |
| **below** ref | `ref.x` | `ref.y + ref.height + gap` |
| **above** ref | `ref.x` | `ref.y - new.height - gap` |
| **center aligned with** ref | `ref.x + (ref.width - new.width) / 2` | (same y, or same formula for vertical) |

Where:
- `ref.width` = `ref.props.width` or the default width for that widget type
- `ref.height` = `ref.props.height` or the default height for that widget type
- `new.width/height` = the size of the widget being placed (from props or defaults)
- `gap` = `gridSize` (typically 24)
- **Always snap the final result**: `Math.round(value / gridSize) * gridSize`

**Implicit reference** — If the user says "to the right of the blue sticky" without an ID, read the canvas state and find the matching widget by type + props (e.g. a sticky-note with `color: "blue"`). If ambiguous, ask.

**No position given** — Place at a sensible location:
- If the canvas is empty, start at `(0, 0)`.
- If there are existing widgets, place to the right of the rightmost widget or below the last row.

### Step 4: Execute the operation

**Adding a widget:**
```bash
npx storyboard canvas add {TYPE} --canvas {NAME} --x {X} --y {Y} --props '{JSON}'
```

**Moving a widget:**
1. Read canvas state → get widgets array
2. Find the target widget by ID
3. Update its `position` field
4. PUT the full array back:
```bash
curl -X PUT http://localhost:{PORT}/_storyboard/canvas/update \
  -H 'Content-Type: application/json' \
  -d '{"name":"{CANVAS}","widgets":[...updated array...]}'
```

**Updating widget props** (text, color, size, content, etc.):
1. Read canvas state → get widgets array
2. Find the target widget by ID
3. Merge new props into `widget.props`
4. PUT the full array back

**Removing a widget:**
```bash
curl -X DELETE http://localhost:{PORT}/_storyboard/canvas/widget \
  -H 'Content-Type: application/json' \
  -d '{"name":"{CANVAS}","widgetId":"{WIDGET_ID}"}'
```

**Rearranging / laying out multiple widgets:**
1. Read canvas state → get widgets array
2. Calculate new positions for all affected widgets using the positioning formulas
3. PUT the full updated array back in a single call

### Step 5: Confirm

After the operation, tell the user what changed. For relational positioning, confirm the calculated coordinates. For bulk operations, summarize the layout.

---

## Examples

### Add a sticky note with text
User: "Add a yellow sticky note saying 'TODO: fix bug' to my-canvas"
```bash
npx storyboard canvas add sticky-note --canvas my-canvas --x 0 --y 0 --props '{"text":"TODO: fix bug","color":"yellow"}'
```

### Relational positioning
User: "Add a blue sticky to the right of sticky-note-f20afo on my-canvas"
1. Read canvas: find `sticky-note-f20afo` at `{x: 100, y: 200}` with `width: 270`
2. Calculate: x = `100 + 270 + 24 = 394` → snap to `Math.round(394/24)*24 = 384`, y = `200`
3. Run:
```bash
npx storyboard canvas add sticky-note --canvas my-canvas --x 384 --y 200 --props '{"text":"","color":"blue"}'
```

### Move a widget
User: "Move sticky-note-abc123 below markdown-xyz789"
1. Read canvas: find `markdown-xyz789` at `{x: 0, y: 0}` with `height: 240`
2. Calculate: x = `0`, y = `0 + 240 + 24 = 264` → snap to `264`
3. Update the widgets array, set `sticky-note-abc123.position` to `{x: 0, y: 264}`
4. PUT the full array back

### Update content
User: "Change the text of sticky-note-abc123 to 'Done!'"
1. Read canvas, find `sticky-note-abc123`
2. Set `props.text = "Done!"`
3. PUT the full widgets array back

### Row of widgets
User: "Add three sticky notes in a row: red, blue, green"

Stride = `270 + 24 = 294` → snap to `Math.round(294/24)*24 = 288`
```bash
npx storyboard canvas add sticky-note --canvas my-canvas --x 0 --y 0 --props '{"color":"red"}'
npx storyboard canvas add sticky-note --canvas my-canvas --x 288 --y 0 --props '{"color":"blue"}'
npx storyboard canvas add sticky-note --canvas my-canvas --x 576 --y 0 --props '{"color":"green"}'
```

### Describe canvas state
User: "What's on my-canvas?"
1. Read canvas state
2. List all widgets with their type, position, key props, and ID

### Remove a widget
User: "Delete the prototype embed on my-canvas"
1. Read canvas, find the widget of type `prototype`
2. Run:
```bash
curl -X DELETE http://localhost:{PORT}/_storyboard/canvas/widget \
  -H 'Content-Type: application/json' \
  -d '{"name":"my-canvas","widgetId":"prototype-xyz789"}'
```
