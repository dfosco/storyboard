# `packages/core/src/sceneDebug.js`

<!--
source: packages/core/src/sceneDebug.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../architecture.index.md)

## Goal

A vanilla JS debug panel that renders loaded flow data as formatted JSON. Framework-agnostic — creates DOM elements directly, no React/Svelte needed. Useful for inspecting what data a flow provides without wiring up components.

## Composition

- `mountFlowDebug(container?, flowName?)` — mounts a debug panel showing the loaded flow data as pretty-printed JSON. Uses `?flow=` or `?scene=` URL param, falls back to `"default"`.
- `mountSceneDebug` — deprecated alias for `mountFlowDebug`

```js
import { mountFlowDebug } from './sceneDebug.js'
mountFlowDebug(document.getElementById('debug'), 'dashboard')
```

Injects its own `<style>` element once (dark theme, monospace code block).

## Dependencies

- `./loader.js` — `loadFlow`

## Dependents

- `packages/core/src/index.js` — re-exports `mountFlowDebug` and `mountSceneDebug`
