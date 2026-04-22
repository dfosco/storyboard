# `packages/core/src/mobileViewport.test.js`

<!--
source: packages/core/src/mobileViewport.test.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../architecture.index.md)

## Goal

Tests the mobile viewport detection module that wraps `matchMedia` to provide reactive `isMobile()` and `isTouchDevice()` checks with a subscription model. Uses stubbed `matchMedia` to simulate viewport changes.

## Composition

**isMobile** — returns false for wide viewports, true for narrow viewports (based on `matchMedia` matches).

**subscribeToMobile** — notifies callback on media query change, unsubscribe stops notifications.

**isTouchDevice** — checks `pointer: coarse` media query.

Uses `vi.stubGlobal('matchMedia', ...)` and `vi.resetModules()` with dynamic imports per test for fresh module state.

```js
matchMediaMatches = true
const { isMobile } = await import('./mobileViewport.js')
expect(isMobile()).toBe(true)
```

## Dependencies

- `./mobileViewport.js` (`isMobile`, `subscribeToMobile`, `isTouchDevice`)

## Dependents

None (test file).
