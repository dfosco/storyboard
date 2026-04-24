# `packages/core/src/smoothCorners.js`

<!--
source: packages/core/src/smoothCorners.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../architecture.index.md)

## Goal

Registers the smooth-corners CSS Houdini paint worklet. Inlined from the `smooth-corners` package (MIT license) to avoid Vite-specific `?url` imports that break when consumed from `node_modules`. The worklet renders superellipse shapes via the `paint(smooth-corners)` CSS function, controlled by the `--sb--smooth-corners` CSS custom property.

## Composition

- `registerSmoothCorners()` — idempotent registration. Checks for `CSS.paintWorklet` support, creates a blob URL from the inlined worklet source, and adds it as a paint module.

```js
import { registerSmoothCorners } from './smoothCorners.js'
registerSmoothCorners() // safe to call multiple times
```

The worklet reads `--sb--smooth-corners` (comma-separated `nX,nY` values) and draws a superellipse path.

## Dependencies

None (uses browser `CSS.paintWorklet` API).

## Dependents

- `packages/core/src/lib/components/ui/trigger-button/trigger-button.svelte` — registers on component mount
