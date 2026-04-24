# `packages/core/src/interceptHideParams.js`

<!--
source: packages/core/src/interceptHideParams.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../architecture.index.md)

## Goal

Intercepts the `?hide` and `?show` URL search params to trigger hide-mode transitions. Called at app startup and on every `popstate` event (browser back/forward). This bridges the URL-based trigger (`?hide` / `?show`) to the hide-mode system in [`hideMode.js`](./hideMode.js.md).

## Composition

- `interceptHideParams()` — checks current URL for `?hide` or `?show`, calls `activateHideMode()` or `deactivateHideMode()` respectively. Idempotent.
- `installHideParamListener()` — calls `interceptHideParams()` once, then installs a `popstate` listener for ongoing detection.

```js
import { installHideParamListener } from './interceptHideParams.js'
installHideParamListener() // called once at app startup
```

## Dependencies

- [`./hideMode.js`](./hideMode.js.md) — `activateHideMode`, `deactivateHideMode`

## Dependents

- [`./mountStoryboardCore.js`](./mountStoryboardCore.js.md) — calls `installHideParamListener` at startup
- `packages/react/src/hashPreserver.js` — imports for navigation integration
- `packages/core/src/index.js` — re-exports
