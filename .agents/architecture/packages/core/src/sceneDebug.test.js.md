# `packages/core/src/sceneDebug.test.js`

<!--
source: packages/core/src/sceneDebug.test.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../architecture.index.md)

## Goal

Tests the flow debug panel — a DOM-based inspector that mounts a `<pre>` element showing the resolved JSON data for a flow. Used during development to visualize flow state without React DevTools.

## Composition

**mountFlowDebug** — injects styles on first call, creates `.sb-scene-debug` element, appends to body or custom container, renders flow name in title (defaults to "default"), renders JSON in `<pre>`, shows error UI when `loadFlow` throws, reads `?scene=` query param, allows multiple panels.

**mountSceneDebug (deprecated alias)** — confirms `mountSceneDebug === mountFlowDebug`.

```js
const el = mountFlowDebug(undefined, 'my-flow')
const pre = document.body.querySelector('.sb-scene-debug-code')
expect(JSON.parse(pre.textContent)).toEqual({ hello: 'world', count: 42 })
```

## Dependencies

- `./sceneDebug.js` (`mountFlowDebug`, `mountSceneDebug`)
- Mocked: `./loader.js` (`loadFlow`)

## Dependents

None (test file).
