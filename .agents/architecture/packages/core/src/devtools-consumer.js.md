# `packages/core/src/devtools-consumer.js`

<!--
source: packages/core/src/devtools-consumer.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../architecture.index.md)

## Goal

Consumer-safe proxy for `mountDevTools`. Delegates to the compiled UI bundle (`@dfosco/storyboard-core/ui-runtime`) via dynamic import so consumers don't need Svelte installed. The real `mountDevTools` in [`devtools.js`](./devtools.js.md) imports Svelte directly and is only usable in the source repo or via the compiled bundle.

## Composition

```js
export async function mountDevTools(options = {})   // Lazy-load ui-runtime and mount
export async function unmountDevTools()              // Lazy-load ui-runtime and unmount
export function mountFlowDebug(options)              // Deprecated alias
export function mountSceneDebug(options)             // Deprecated alias
```

## Dependencies

- `@dfosco/storyboard-core/ui-runtime` (dynamic import)

## Dependents

- [`index.js`](./index.js.md) — re-exports `mountDevTools`
