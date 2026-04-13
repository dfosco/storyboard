# Canvas ComponentWidget Iframe Isolation

## Problem
Canvas pages render `.canvas.jsx` component exports directly via `<Component />` in `ComponentWidget`. If a component has a broken dependency (e.g. `HighchartsMore is not a function` at module evaluation time), it crashes the entire canvas page. The `PrototypeEmbed` widget already uses iframes for prototype pages — component widgets need the same isolation.

## Approach
Render each `.canvas.jsx` component export inside its own `<iframe>` instead of directly in the parent page. A Vite middleware serves a minimal HTML isolate page that imports the component module and renders it. If the component fails to load or render, the error is contained inside the iframe — the canvas remains functional.

Additionally, add a React Error Boundary as defense-in-depth for cases where the iframe approach isn't active (production builds or fallback).

## Files to Change

### New Files
1. **`packages/react/src/canvas/componentIsolate.jsx`** — Iframe entry point. Reads `module` and `export` from URL params, dynamically imports the module, renders the specified export. Error handling shows a fallback card inside the iframe.

2. **`packages/react/src/canvas/ComponentErrorBoundary.jsx`** — React Error Boundary for defense-in-depth. Wraps ComponentWidget to catch render-time errors in both dev and production.

### Modified Files
3. **`packages/react/src/vite/data-plugin.js`** — In `configureServer()`, add middleware for `/_storyboard/canvas/isolate` that serves HTML referencing the isolate entry point. Uses `server.transformIndexHtml()` for HMR support.

4. **`packages/react/src/canvas/widgets/ComponentWidget.jsx`** — Replace direct `<Component />` rendering with an iframe. Accept `jsxModule` and `exportName` props. Keep interactive overlay and resize support.

5. **`packages/react/src/canvas/CanvasPage.jsx`** — Pass `canvas._jsxModule` and `exportName` to ComponentWidget. When `jsxExports` is null (module import failed), fall back to `canvas.sources` for export names so iframe widgets still render.

6. **`packages/react/src/canvas/useCanvas.js`** — Expose `jsxError` state so CanvasPage can detect import failures and use the sources fallback. Expose `jsxModule` path for convenience.

7. **`packages/react/src/canvas/widgets/ComponentWidget.module.css`** — Update styles for iframe rendering (replace overflow container with iframe sizing).

## Key Design Decisions
- **Dev uses iframes, production uses error boundary** — The isolate middleware only runs in dev. ComponentWidget checks `isLocalDev` prop — dev renders iframes, prod renders direct `<Component />` wrapped in ErrorBoundary. Module eval errors in prod are caught by useCanvas `.catch()`.
- **Sources fallback** — When module import fails in useCanvas, the `sources` array from `.canvas.jsonl` provides export names. Each iframe independently tries to import the module — if broken, each shows its own error card.
- **Theme propagation** — Pass canvas theme to iframe via query param (like PrototypeEmbed does with `_sb_canvas_theme`). Isolate entry applies theme to document root.
- **ErrorBoundary inside iframe** — The isolate entry wraps the component in a React ErrorBoundary to catch render-time errors (try/catch only catches import errors, not React render failures).
- **Centralized export names** — Derive one `componentEntries` list in CanvasPage used for render, bounds computation, and widget targeting. When jsxExports is null, fall back to sources.
- **Module path validation** — Isolate entry validates module path ends in `.canvas.jsx` before importing.
- **`transformIndexHtml`** — Processes the isolate HTML through Vite's pipeline for HMR client injection and module resolution.
- **`/@fs/` path** — References the isolate entry via absolute filesystem path so Vite serves it correctly from the package source directory.
- **Base-path handling** — Reuse `resolveCanvasModuleImport()` in the isolate entry for branch deploy compatibility.

## Todos
- [ ] Create `componentIsolate.jsx` entry point
- [ ] Create `ComponentErrorBoundary.jsx`
- [ ] Add isolate middleware to data-plugin.js
- [ ] Update ComponentWidget for iframe rendering
- [ ] Update CanvasPage to pass module info and handle sources fallback
- [ ] Update useCanvas to expose error state
- [ ] Update CSS for iframe layout
- [ ] Test with `npm run build` and existing tests
