# Widget Expand Modal

## Problem

Prototype and Figma embed widgets on canvas need an "expand" action that opens the iframe in a near-fullscreen modal (90vh × 90vw) with a dark overlay, close button, and ESC support. The iframe must be immediately interactable.

## Approach

Use the existing config-driven feature system. Add an `expand` feature to both widget configs, register the icon, and handle the action in both widget components. The modal is rendered **inside** each widget component (not a portal) using a fixed-position overlay that escapes the canvas zoom transform.

## Files to Change

1. **`packages/core/widgets.config.json`** — Add `expand` feature to `prototype` and `figma-embed`
2. **`packages/react/src/canvas/widgets/WidgetChrome.jsx`** — Add `ExpandIcon` to icon registry
3. **`packages/react/src/canvas/widgets/PrototypeEmbed.jsx`** — Add `expanded` state, handle `expand` action, render modal overlay
4. **`packages/react/src/canvas/widgets/PrototypeEmbed.module.css`** — Add modal/overlay/close styles
5. **`packages/react/src/canvas/widgets/FigmaEmbed.jsx`** — Same expand state + modal logic
6. **`packages/react/src/canvas/widgets/FigmaEmbed.module.css`** — Same modal/overlay/close styles

## Steps

### 1. Add `expand` feature to widget configs
Add `{ "id": "expand", "type": "action", "action": "expand", "label": "Expand", "icon": "expand" }` to both `prototype` and `figma-embed` features arrays — place before `copy`.

### 2. Add ExpandIcon to WidgetChrome icon registry
Add an inline SVG expand icon (screen-full octicon style) and register as `'expand'` in `ICON_REGISTRY`.

### 3. Implement expand in PrototypeEmbed
- Add `expanded` state (false by default)
- Handle `'expand'` action in `useImperativeHandle` — sets expanded = true
- When expanded, render a **fixed-position** overlay:
  - Dark backdrop (`position: fixed, inset: 0, z-index: 100000, background: rgba(0,0,0,0.8)`)
  - Centered container (90vw × 90vh)
  - The iframe inside at full size, no zoom scaling, immediately interactable (no drag overlay)
  - Close [×] button at top-right
  - ESC key listener to close
- When collapsing, return to normal inline rendering

### 4. Implement expand in FigmaEmbed
Same pattern as PrototypeEmbed but simpler (no zoom/scale logic).

### 5. Add CSS for modal overlay
Shared modal styles in each widget's CSS module: backdrop, container, close button, iframe sizing.

## Edge Cases & Risks

- **Canvas zoom transform**: The modal uses `position: fixed` which is not affected by ancestor transforms, so it will correctly overlay the full viewport.
- **ESC conflict**: CanvasPage has a global ESC handler (clears selection). The expanded modal's ESC handler should `stopPropagation` so it doesn't also deselect.
- **Iframe interactivity**: The expanded iframe must NOT have a drag overlay — it should be immediately interactive.
- **Theme**: Modal backdrop should work in both light and dark canvas themes.
