# `packages/core/src/interceptHideParams.test.js`

<!--
source: packages/core/src/interceptHideParams.test.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../architecture.index.md)

## Goal

Tests URL query parameter interception for `?hide` and `?show` params that toggle hide mode. Ensures correct dispatch to `activateHideMode`/`deactivateHideMode`, priority when both are present, idempotency, and that unrelated params are ignored.

## Composition

**interceptHideParams** — no-ops with no params, calls `activateHideMode` on `?hide`, calls `deactivateHideMode` on `?show`, prefers `?hide` over `?show`, is idempotent, ignores unrelated params.

**installHideParamListener** — runs intercept immediately on install, adds a `popstate` listener.

```js
window.history.pushState(null, '', '?hide')
interceptHideParams()
expect(activateHideMode).toHaveBeenCalledTimes(1)
```

## Dependencies

- `./interceptHideParams.js` (`interceptHideParams`, `installHideParamListener`)
- Mocked: `./hideMode.js` (`activateHideMode`, `deactivateHideMode`)

## Dependents

None (test file).
