# `packages/core/src/devtools.js`

<!--
source: packages/core/src/devtools.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../architecture.index.md)

## Goal

Mounts the CoreUIBar Svelte component into the DOM — the floating toolbar with the command menu and mode-specific buttons. This is the source-repo version that directly imports Svelte. Consumer repos use [`devtools-consumer.js`](./devtools-consumer.js.md) which delegates to the compiled UI bundle instead.

## Composition

```js
export async function mountDevTools(options = {})  // Mount CoreUIBar (no-ops on double-call)
export async function unmountDevTools()             // Remove CoreUIBar from DOM
export function mountFlowDebug(options)             // Deprecated alias
export function mountSceneDebug(options)            // Deprecated alias
```

Options: `container` (default `document.body`), `basePath`, `toolbarConfig`, `customHandlers`.

On mount, creates an accessibility skip-link as `<body>`'s first child for keyboard navigation, then mounts the Svelte `CoreUIBar` component. Skips mounting inside `_sb_embed` iframes.

## Dependencies

- `svelte` — `mount`, `unmount`
- `CoreUIBar.svelte` — the toolbar component

## Dependents

No direct imports within `packages/core/src/` (the entry point uses [`devtools-consumer.js`](./devtools-consumer.js.md) instead). This file is compiled into the `ui-runtime` bundle.

## Notes

The skip-link is fully self-contained with inline styles — no external CSS framework required. Focus/blur handlers toggle visibility for screen readers.
