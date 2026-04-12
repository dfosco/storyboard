# Fix Widget Resize Persistence

## Problem

Canvas widgets (especially sticky notes) lose their size on page refresh. Sticky notes use CSS `resize: both` which lets users drag to resize, but the resulting dimensions are never captured or saved to the `.jsonl` canvas state. PrototypeEmbed already handles this correctly via a JS resize handle.

## Approach

Replace the native CSS `resize: both` on sticky notes with a shared JS resize handle component (same pattern as PrototypeEmbed). This gives explicit control over resize events and reliably persists dimensions via `onUpdate`.

The ResizeHandle component will be reusable so any widget can opt into resize persistence.

## Files to Change

| File | Action | Description |
|------|--------|-------------|
| `packages/react/src/canvas/widgets/widgetProps.js` | Modify | Add `width`/`height` to `stickyNoteSchema` |
| `packages/react/src/canvas/widgets/ResizeHandle.jsx` | Create | Shared resize handle component |
| `packages/react/src/canvas/widgets/ResizeHandle.module.css` | Create | Styling for the resize handle |
| `packages/react/src/canvas/widgets/StickyNote.jsx` | Modify | Use ResizeHandle, apply saved dimensions |
| `packages/react/src/canvas/widgets/StickyNote.module.css` | Modify | Remove `resize: both` |

## Steps

1. **Add `width`/`height` to `stickyNoteSchema`** — number type, category `size`, no defaults (so sticky notes size naturally from content until first user resize)
2. **Create `ResizeHandle` component** — bottom-right corner handle using mousedown/mousemove/mouseup pattern (proven in PrototypeEmbed). Props: `width`, `height`, `minWidth`, `minHeight`, `onResize(width, height)`.
3. **Create `ResizeHandle.module.css`** — small triangle in bottom-right corner, visible on hover
4. **Update `StickyNote.jsx`** — read width/height from props, apply as inline styles when present, render ResizeHandle inside the sticky, pass onUpdate
5. **Update `StickyNote.module.css`** — remove `resize: both` (JS handle replaces it), keep `overflow: auto`

## Edge Cases & Risks

- **No saved dimensions (fresh widget):** width/height default to `null`, element sizes naturally from content. ResizeHandle reads `offsetWidth`/`offsetHeight` as starting point for the first drag.
- **Content overflow after resize:** With explicit dimensions, additional text scrolls instead of growing the sticky. This is expected behavior after explicit resize (same as PrototypeEmbed).
- **Existing canvases:** Old stickies without saved width/height render identically to before (natural sizing). Only after user resizes do dimensions get saved.
- **Min constraints:** `min-width: 180px` stays in CSS, JS handle also enforces it.
