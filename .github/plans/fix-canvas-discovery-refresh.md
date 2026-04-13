# Fix: Canvas Discovery Refresh

## Problem

1. **Canvas add/remove not reflected on page refresh** — Adding/removing `.canvas.jsonl` files doesn't update the viewfinder until the dev server restarts.
2. **Canvas name edits not reflected in viewfinder** — Editing a canvas title on the canvas page doesn't propagate to the viewfinder.

## Root Cause

The Vite data plugin builds a virtual module at dev start. For canvas files, the watcher sends custom HMR events but **never invalidates the cached virtual module** (`buildResult`) — so page refreshes still serve stale data.

## Approach

### Layer 1: Fix page refresh (both bugs)

Add a `softInvalidate()` helper that clears `buildResult` and invalidates the virtual module in Vite's module graph WITHOUT sending `full-reload`. Call it from:
- `invalidate()` for canvas content changes
- `invalidateOnAddRemove()` for canvas add/remove (including deferred unlink)

### Layer 2: Fix SPA navigation (bug #2)

- Read fresh canvas metadata when sending HMR events
- Add HMR listener in the generated virtual module that patches the in-memory `canvases` object and re-calls `init()` so `dataIndex` stays fresh
- Remove duplicate event emission from `handleHotUpdate` (let `invalidate` be the single source)

## Files to Change

- `packages/react/src/vite/data-plugin.js` — Soft invalidation + enriched HMR events + virtual module HMR listener

## Edge Cases

- Canvas content changes happen frequently (widget moves) — `softInvalidate()` is cheap (just resets a variable + marks module stale); rebuild only happens on actual page load
- Deferred unlink timer (1500ms) for atomic saves — invalidation goes inside the timeout callback
- Duplicate events from `invalidate()` + `handleHotUpdate()` — removed from `handleHotUpdate`
