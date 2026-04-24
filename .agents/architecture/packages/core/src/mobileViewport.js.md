# `packages/core/src/mobileViewport.js`

<!--
source: packages/core/src/mobileViewport.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../architecture.index.md)

## Goal

Reactive store for mobile/compact viewport detection. Uses `window.matchMedia` for efficient, debounce-free breakpoint detection at 500px. Provides a subscribe/read API for components that need to adapt layout for narrow viewports (e.g., toolbar compacting). Also exports a `isTouchDevice()` helper for PWA install prompt targeting.

## Composition

- `isMobile()` — returns `true` when viewport is narrower than 500px
- `subscribeToMobile(callback)` — subscribe to mobile state changes; returns unsubscribe
- `isTouchDevice()` — checks for coarse pointer (touch device) via `matchMedia`

```js
import { isMobile, subscribeToMobile } from './mobileViewport.js'
const unsub = subscribeToMobile((mobile) => {
  if (mobile) compactToolbar()
})
```

Initializes automatically on module load (SSR-safe with `typeof window` guard).

## Dependencies

None (browser `window.matchMedia` only).

## Dependents

- `packages/core/src/CoreUIBar.svelte` — adapts toolbar layout for mobile
- `packages/core/src/PwaInstallBanner.svelte` — uses `isTouchDevice` for install prompt
