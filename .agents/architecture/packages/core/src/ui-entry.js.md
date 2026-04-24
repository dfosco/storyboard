# `packages/core/src/ui-entry.js`

<!--
source: packages/core/src/ui-entry.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../architecture.index.md)

## Goal

The compiled UI bundle entry point. This file is built into `dist/storyboard-ui.js` via Vite library build and serves as the boundary between the framework-agnostic core and the Svelte-based UI layer. Consumers never import this directly — they use `mountStoryboardCore()` or the package export `@dfosco/storyboard-core/ui-runtime`.

## Composition

**CSS imports (bundled into `storyboard-ui.css`):**
- `./styles/tailwind.css` — Tailwind utilities
- `./comments/ui/comment-layout.css`, `./comments/ui/comments.css` — comment UI styles
- `./modes.css` — design mode body classes

**Re-exports:**
- `mountDevTools`, `unmountDevTools` — from `./devtools.js` (CoreUIBar floating toolbar)
- `mountComments` — from `./comments/ui/mount.js` (comment pins/windows)
- `mountViewfinder`, `unmountViewfinder` — from `./ui/viewfinder.ts`
- `mountDesignModes` — from `./ui/design-modes.ts`

## Dependencies

- `./devtools.js` — CoreUIBar mount/unmount
- `./comments/ui/mount.js` — comments system mount
- `./ui/viewfinder.ts` — viewfinder dashboard
- `./ui/design-modes.ts` — design modes UI

## Dependents

- [`./mountStoryboardCore.js`](./mountStoryboardCore.js.md) — dynamically imports via `@dfosco/storyboard-core/ui-runtime`
- `packages/core/vite.ui.config.js` — build entry point
- `packages/core/src/svelte-plugin-ui/mount.ts` — references

## Notes

- In the source repo, Vite aliases `@dfosco/storyboard-core/ui-runtime` to this file for HMR.
- In consumer repos, the package.json `exports` map resolves to the compiled `dist/storyboard-ui.js`.
