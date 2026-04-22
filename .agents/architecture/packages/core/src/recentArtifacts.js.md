# `packages/core/src/recentArtifacts.js`

<!--
source: packages/core/src/recentArtifacts.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../architecture.index.md)

## Goal

localStorage-backed recent artifacts tracker for the command palette. Stores artifact identity (`type + key + label`) rather than routes, so routes can be derived at read time from the live data index — keeping them correct across branch/basePath changes.

## Composition

- `trackRecent(type, key, label)` — pushes to top, deduplicates by `type+key`, trims to 10
- `getRecent()` — returns entries newest-first
- `clearRecent()` — removes all entries (for testing)

Storage key: `storyboard:recent-artifacts`, max 10 items.

```js
import { trackRecent, getRecent } from './recentArtifacts.js'
trackRecent('prototype', 'Dashboard', 'Dashboard')
const recent = getRecent() // [{ type: 'prototype', key: 'Dashboard', label: 'Dashboard' }]
```

## Dependencies

None (uses browser `localStorage` directly, not the `./localStorage.js` wrapper).

## Dependents

- [`./paletteProviders.js`](./paletteProviders.js.md) — `getRecent`, `trackRecent` for recent items and navigation tracking
- `packages/core/src/index.js` — re-exports
