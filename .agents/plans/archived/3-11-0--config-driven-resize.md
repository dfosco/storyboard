# Config-Driven Widget Resize

## Problem

Widget resize handles on canvas are hardcoded in each widget component. There's no centralized way to enable/disable resize per widget type or control whether resize is available in production builds.

## Approach

Add a `resize: { enabled, prod }` config object to each widget type in `widgets.config.json` (the single source of truth for widget definitions). Expose an `isResizable(type)` helper that respects both the config and the build environment. Thread a `resizable` prop through to each widget component so resize handles render conditionally.

## Files Changed

| File | Change |
|------|--------|
| `packages/core/widgets.config.json` | Added `resize` config to all 7 widget types |
| `packages/react/src/canvas/widgets/widgetConfig.js` | Added `isResizable(type)` export |
| `packages/react/src/canvas/CanvasPage.jsx` | Import `isResizable`, pass `resizable` prop through `WidgetRenderer` and `ComponentWidget` |
| `packages/react/src/canvas/widgets/StickyNote.jsx` | Conditionally render `ResizeHandle` based on `resizable` prop |
| `packages/react/src/canvas/widgets/ImageWidget.jsx` | Same |
| `packages/react/src/canvas/widgets/ComponentWidget.jsx` | Same |
| `packages/react/src/canvas/widgets/PrototypeEmbed.jsx` | Conditionally render inline resize handle based on `resizable` prop |
| `packages/react/src/canvas/widgets/FigmaEmbed.jsx` | Same |
| `packages/react/src/canvas/widgets/widgetConfig.test.js` | New tests for `isResizable`, `getFeatures`, `getWidgetMeta` |
| `packages/react/src/canvas/widgets/StickyNote.test.jsx` | Updated resize tests to pass `resizable` prop |
| `packages/react/src/canvas/CanvasPage.bridge.test.jsx` | Updated widgetConfig mock with `isResizable` |
| `packages/react/src/canvas/CanvasPage.multiselect.test.jsx` | Same |

## Design Decisions

- **Resize gated on mutability too**: `resizable` is `isResizable(type) && !!onUpdate` — so even if config says enabled, read-only contexts won't show resize handles.
- **`prod: false` default**: All resize-enabled widgets have `prod: false` since resize is a dev-only editing feature currently.
- **Widget-level threading**: The `resizable` prop is passed into individual widget components rather than handled in `WidgetChrome`, because each widget has different resize logic (shared `ResizeHandle` vs inline, aspect-ratio locking, etc.).
