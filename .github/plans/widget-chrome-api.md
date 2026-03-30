# Widget Chrome & Configuration API

## Problem

Canvas widgets each handle their own features ad-hoc — the sticky note has a custom color picker dot, the prototype embed has inline zoom controls, markdown has nothing. There's no unified interaction model, no shared toolbar, and widget configuration is scattered across JS files.

## Approach

Introduce a **config-driven widget system** with a single source of truth (`widgets.config.json` in core) and a shared **WidgetChrome** component that renders a universal hover toolbar below every widget.

---

## Current Architecture (what exists)

| Layer | File | Role |
|-------|------|------|
| Config | `core-ui.config.json` | Modes, menus, shortcuts — no widget config |
| Registry | `widgets/index.js` | Maps type → React component |
| Schemas | `widgets/widgetProps.js` | Prop schemas with types, defaults, categories |
| Widgets | `StickyNote.jsx`, `MarkdownBlock.jsx`, etc. | Self-contained renderers with ad-hoc features |
| Canvas | `CanvasPage.jsx` | Renders widgets, handles selection via click, delete |
| Wrapper | `WidgetWrapper.jsx` | Shared shadow/border for non-sticky widgets |
| Selection | `.selected` in `CanvasPage.module.css` | Blue outline on clicked widget div |

## Target Architecture

### 1. `packages/core/widgets.config.json` — Single source of truth

```jsonc
{
  "widgets": {
    "sticky-note": {
      "label": "Sticky Note",
      "icon": "📝",
      "component": "./widgets/StickyNote.jsx",
      "props": {
        "text":  { "type": "text",   "label": "Text",  "category": "content", "default": "" },
        "color": { "type": "select", "label": "Color", "category": "settings", "default": "yellow",
                   "options": ["yellow", "blue", "green", "pink", "purple", "orange"] }
      },
      "features": [
        { "id": "color",    "type": "color-picker", "prop": "color" },
        { "id": "delete",   "type": "action",       "action": "delete" }
      ]
    },
    "markdown": {
      "label": "Markdown",
      "icon": "📄",
      "component": "./widgets/MarkdownBlock.jsx",
      "props": {
        "content": { "type": "text",   "label": "Content", "category": "content", "default": "" },
        "width":   { "type": "number", "label": "Width",   "category": "size",    "default": 360, "min": 200, "max": 1200 }
      },
      "features": [
        { "id": "delete", "type": "action", "action": "delete" }
      ]
    },
    "prototype": {
      "label": "Prototype",
      "icon": "🖥️",
      "component": "./widgets/PrototypeEmbed.jsx",
      "props": {
        "src":    { "type": "url",    "label": "URL",    "category": "content",  "default": "" },
        "label":  { "type": "text",   "label": "Label",  "category": "settings", "default": "" },
        "zoom":   { "type": "number", "label": "Zoom",   "category": "settings", "default": 100, "min": 25, "max": 200 },
        "width":  { "type": "number", "label": "Width",  "category": "size",     "default": 800, "min": 200, "max": 2000 },
        "height": { "type": "number", "label": "Height", "category": "size",     "default": 600, "min": 200, "max": 1500 }
      },
      "features": [
        { "id": "zoom-in",  "type": "action", "action": "zoom-in"  },
        { "id": "zoom-out", "type": "action", "action": "zoom-out" },
        { "id": "edit-url", "type": "action", "action": "edit"     },
        { "id": "delete",   "type": "action", "action": "delete"   }
      ]
    },
    "link-preview": {
      "label": "Link Preview",
      "icon": "🔗",
      "component": "./widgets/LinkPreview.jsx",
      "props": {
        "url":   { "type": "url",  "label": "URL",   "category": "content", "default": "" },
        "title": { "type": "text", "label": "Title", "category": "content", "default": "" }
      },
      "features": [
        { "id": "delete", "type": "action", "action": "delete" }
      ]
    }
  }
}
```

**Key design decisions:**
- `props` replaces `widgetProps.js` schemas entirely — JSON is the source of truth
- `features` is an ordered array of toolbar items rendered left-to-right
- Feature `type` determines the button rendering: `"action"` = icon button, `"color-picker"` = specialized color picker
- Feature `action` maps to a handler: `"delete"` and `"edit"` are standard; widget-specific actions like `"zoom-in"` are dispatched to the widget component

### 2. `packages/core/package.json` — Export the config

```json
"./widgets.config.json": "./widgets.config.json"
```

### 3. `packages/react/src/canvas/widgets/WidgetChrome.jsx` — Unified toolbar

The new shared wrapper replaces ad-hoc feature UI in individual widgets.

#### Interaction model

```
┌─────────────────────────────┐
│         Widget body          │  ← The actual widget renders here
│                              │
└─────────────────────────────┘  ← Selection outline snaps HERE
  ○                              ← Trigger dot (neutral gray, centered)
```

**On hover** (widget OR area below):

```
┌─────────────────────────────┐
│         Widget body          │
│                              │
└─────────────────────────────┘  ← Selection outline still snaps here
  [🎨] [🗑]              [▪]   ← Feature buttons (left) + select handle (right)
```

**Hover area**: Includes the widget itself AND the toolbar area below. Hovering either reveals the toolbar.

**Trigger dot → toolbar transition**: The centered dot fades out, replaced by the row of feature buttons on the left and the select handle on the right.

**Button style**: Small, fully rounded, 1.6px border, similar to CoreUIBar menu buttons but smaller.

**Select handle**: A small rounded rectangle (not a checkbox) on the right side. This serves **two purposes**:
1. **Selection toggle** — clicking it selects/deselects the widget. When selected, it fills blue and the widget gets the selection outline (snapped to widget bounds).
2. **Drag handle** — dragging it moves the widget on the canvas. This replaces any other drag mechanism and becomes the canonical way to reposition widgets.

When selected:
- The handle fills with accent blue
- Widget gets selection outline (snapped to widget bounds, not including toolbar)
- Widget can be deleted with Delete/Backspace

#### Component API

```jsx
<WidgetChrome
  widgetId={widget.id}
  features={widgetConfig.features}
  selected={selectedWidgetId === widget.id}
  onSelect={() => setSelectedWidgetId(widget.id)}
  onDeselect={() => setSelectedWidgetId(null)}
  onAction={(actionId) => handleAction(widget.id, actionId)}
  onDragStart={(e) => handleDragStart(widget.id, e)}
>
  <WidgetRenderer widget={widget} onUpdate={...} />
</WidgetChrome>
```

#### CSS structure

```
.chromeContainer         — outer wrapper, defines hover area
  .widgetSlot            — contains the widget, selection outline targets this
  .toolbar               — below widget, hidden by default
    .triggerDot           — centered neutral dot (visible at rest)
    .toolbarContent       — feature buttons + select handle (visible on hover)
      .featureButtons     — left-aligned action buttons
      .selectHandle       — right-aligned rounded rect, drag handle + select toggle
        (default: muted border)
        (selected: filled accent blue)
        (drag cursor: grab/grabbing)
```

### 4. Changes to `CanvasPage.jsx`

- **Remove**: Click-to-select on widget wrapper div
- **Keep**: Delete/Backspace handling for selected widget
- **Add**: Load `widgets.config.json`, pass features to WidgetChrome
- **Add**: Action handler that dispatches to widget components or standard actions

### 5. Changes to individual widgets

- **StickyNote.jsx**: Remove the `.pickerArea` / color picker dot (moves to WidgetChrome). Expose a `handleAction(actionId)` callback or use a ref-based imperative API for widget-specific actions.
- **PrototypeEmbed.jsx**: Remove inline zoom bar and edit button (moves to WidgetChrome features)
- **MarkdownBlock.jsx**: No change needed (already minimal)
- **LinkPreview.jsx**: No change needed

### 6. `widgetProps.js` → Generated from config

`readProp()` and `readAllProps()` utility functions stay. The schema objects (`stickyNoteSchema`, etc.) are replaced by a loader that reads `widgets.config.json` and builds the same shape at init time.

---

## Implementation Todos

### Phase 1: Config file & schema migration
1. **Create `widgets.config.json`** in `packages/core/` with all widget definitions
2. **Export it** from core package.json
3. **Add Vite alias** in vite.config.js
4. **Create `widgetConfig.js`** loader that reads the config and builds schema objects
5. **Migrate `widgetProps.js`** to read from the config-generated schemas (keep `readProp`/`readAllProps`/`getDefaults` API)

### Phase 2: WidgetChrome component
6. **Create `WidgetChrome.jsx`** with hover area, trigger dot, toolbar reveal
7. **Create `WidgetChrome.module.css`** with button styles matching CoreUIBar
8. **Implement select handle** (rounded rect, right-aligned — click to select, drag to move)
9. **Implement standard actions** (delete)

### Phase 3: Integration
10. **Update `CanvasPage.jsx`** to wrap widgets in WidgetChrome instead of bare divs
11. **Remove click-to-select** from CanvasPage (selection now via select handle only)
12. **Move selection outline** to WidgetChrome's `.widgetSlot` instead of wrapper div
13. **Wire drag** from select handle to tiny-canvas position updates

### Phase 4: Widget-specific features
13. **Extract StickyNote color picker** into a WidgetChrome feature
14. **Extract PrototypeEmbed zoom/edit** into WidgetChrome features
15. **Clean up** ad-hoc feature UI from individual widgets

### Phase 5: Polish
16. **Verify** all widgets render correctly with WidgetChrome
17. **Test** hover interactions, selection, keyboard delete
18. **Update** CanvasCreateMenu and CanvasToolbar to read widget types from config

---

## Open Questions (resolved)

- **Trigger dot style**: Neutral gray/muted, same for all widgets ✓
- **Template source**: Component file path in config ✓
- **Schema location**: Moved entirely into widgets.config.json ✓
- **Feature types**: Mix of standard (delete) and widget-specific (color, zoom) ✓
