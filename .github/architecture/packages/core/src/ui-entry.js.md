# `packages/core/src/ui-entry.js`

<!--
source: packages/core/src/ui-entry.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

`ui-entry.js` is the build entry point for the pre-compiled Svelte UI bundle (`dist/storyboard-ui.js`). It aggregates all Svelte-dependent UI mount functions and CSS imports into a single entry that Vite compiles into a library bundle. Consumer repos never import this file directly — they access it through the `@dfosco/storyboard-core/ui-runtime` package export, which resolves to the compiled `dist/storyboard-ui.js` in production or to this source file during local development.

This boundary is architecturally important because it isolates Svelte as a build-time dependency of the core package. Consumer repos (which may use React or other frameworks) only interact with the pre-compiled output, avoiding any Svelte dependency in their own build.

## Composition

**CSS imports** — Bundles all UI-related stylesheets into `storyboard-ui.css`:

```js
import './styles/tailwind.css'
import './comments/ui/comment-layout.css'
import './comments/ui/comments.css'
import './modes.css'
```

**Mount function re-exports** — Each UI subsystem exposes a mount/unmount pair:

```js
export { mountDevTools, unmountDevTools } from './devtools.js'
export { mountComments } from './comments/ui/mount.js'
export { mountViewfinder, unmountViewfinder } from './ui/viewfinder.ts'
export { mountDesignModesUI as mountDesignModes } from './ui/design-modes.ts'
```

The `mountDesignModesUI` function is re-exported as `mountDesignModes` for a cleaner public API.

## Dependencies

- [`packages/core/src/devtools.js`](./devtools.js.md) — CoreUIBar (floating toolbar) mount/unmount
- `packages/core/src/comments/ui/mount.js` — Comments UI (Svelte-based comment pins, windows, drawers)
- `packages/core/src/ui/viewfinder.ts` — Viewfinder dashboard (Svelte component)
- `packages/core/src/ui/design-modes.ts` — Design modes UI (Svelte component)
- `packages/core/src/styles/tailwind.css` — Tailwind utility + component CSS
- `packages/core/src/comments/ui/comment-layout.css` — Comments layout styles
- `packages/core/src/comments/ui/comments.css` — Comments component styles
- `packages/core/src/modes.css` — Design mode body classes

## Dependents

- `vite.config.js` — Aliases `@dfosco/storyboard-core/ui-runtime` to this file during local dev:
  ```js
  '@dfosco/storyboard-core/ui-runtime': path.resolve(__dirname, 'packages/core/src/ui-entry.js')
  ```
- `packages/core/package.json` — Maps the `./ui-runtime` export to `dist/storyboard-ui.js` (compiled from this entry)
- Consumer repos — Import from `@dfosco/storyboard-core/ui-runtime` to mount Svelte UI components

## Notes

- This file itself contains no logic — it is purely an aggregation point for the Vite library build.
- The corresponding CSS bundle (`storyboard-ui.css`) is generated automatically by Vite from the CSS imports in this file.
- The split between `ui-entry.js` (Svelte UI) and `index.js` (framework-agnostic core) is fundamental to the core/react architecture separation.
