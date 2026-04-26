# `packages/core/src/devtools.js`

<!--
source: packages/core/src/devtools.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../architecture.index.md)

## Goal

Mounts the CoreUIBar React component into the DOM — the floating toolbar with the command menu and mode-specific buttons. This is the source-repo version that directly imports React. Consumer repos use [`devtools-consumer.js`](./devtools-consumer.js.md) which delegates to the compiled UI bundle instead.

## Composition

```js
export async function mountDevTools(options = {})  // Mount CoreUIBar (no-ops on double-call)
export async function unmountDevTools()             // Remove CoreUIBar from DOM
export function mountFlowDebug(options)             // Deprecated alias
export function mountSceneDebug(options)            // Deprecated alias
```

Options: `container` (default `document.body`), `basePath`, `toolbarConfig`, `customHandlers`.

Internal state: `root` (React root), `wrapper` (DOM element), `skipLink` (accessibility element).

On mount, creates an accessibility skip-link as `<body>`'s first child for keyboard navigation, then uses `createRoot` to render the React `CoreUIBar` component. Skips mounting inside `_sb_embed` iframes. On unmount, calls `root.unmount()` and removes DOM elements.

## Dependencies

- `react` — `createElement` (dynamic import)
- `react-dom/client` — `createRoot` (dynamic import)
- `CoreUIBar.jsx` — the toolbar component (dynamic import)

## Dependents

No direct imports within `packages/core/src/` (the entry point uses [`devtools-consumer.js`](./devtools-consumer.js.md) instead). This file is compiled into the `ui-runtime` bundle.

## Notes

The skip-link is fully self-contained with inline styles — no external CSS framework required. Focus/blur handlers toggle visibility for screen readers.
