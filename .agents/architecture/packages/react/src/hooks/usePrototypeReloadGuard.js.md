# `packages/react/src/hooks/usePrototypeReloadGuard.js`

<!--
source: packages/react/src/hooks/usePrototypeReloadGuard.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

React hook that suppresses Vite HMR full-reloads for non-canvas pages when the user has opted out of automatic prototype reloading. Controlled by the `prototype-auto-reload` feature flag (default: `true`). When the flag is `false`, sends heartbeat messages to the Vite dev server which suppress `full-reload` and `update` HMR payloads for the connected client. Custom storyboard events (canvas file changes, story changes, etc.) always pass through.

## Composition

**Default export:** `usePrototypeReloadGuard()`

```js
import { useEffect } from 'react'
import { getFlag, subscribeToStorage } from '@dfosco/storyboard-core'

const FLAG_KEY = 'prototype-auto-reload'
const HEARTBEAT_MS = 3000

export default function usePrototypeReloadGuard() {
  useEffect(() => {
    if (!import.meta.hot) return
    // ... heartbeat logic
  }, [])
}
```

**Internal helpers:**
- `start()` — begins sending `storyboard:prototype-reload-guard` heartbeat messages (`{ active: true }`) to the Vite dev server every 3 seconds via `import.meta.hot.send()`
- `stop()` — clears the heartbeat interval and sends a final `{ active: false }` message
- `sync()` — reads the current flag value via `getFlag(FLAG_KEY)` and calls `start()` or `stop()` accordingly

**Heartbeat protocol:** Messages are sent as `storyboard:prototype-reload-guard` custom HMR events. The server-side handler auto-expires guards after 5 seconds of no heartbeat, so closed tabs never leave the guard stuck.

**Storage subscription:** Listens for changes to `flag.prototype-auto-reload` in localStorage via `subscribeToStorage()`, re-syncing the guard state when the flag is toggled (e.g. from devtools or settings UI).

## Dependencies

- `react` — `useEffect`
- `@dfosco/storyboard-core` — `getFlag` (reads feature flag from localStorage), `subscribeToStorage` (cross-tab storage event listener)

## Dependents

- [`packages/react/src/context.jsx`](../context.jsx.md) — calls `usePrototypeReloadGuard()` at the top level of `StoryboardProvider`

## Notes

The hook is a no-op in production builds (`import.meta.hot` is `undefined`). The effect has an empty dependency array — it runs once on mount and cleans up on unmount (stops heartbeat + unsubscribes from storage). The 3-second heartbeat / 5-second server-side expiry ensures a closed browser tab automatically releases the reload guard without requiring an explicit disconnect event.
