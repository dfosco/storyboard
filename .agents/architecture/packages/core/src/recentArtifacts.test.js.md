# `packages/core/src/recentArtifacts.test.js`

<!--
source: packages/core/src/recentArtifacts.test.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../architecture.index.md)

## Goal

Tests the recent artifacts tracker — an in-memory MRU (most recently used) list that powers the "Recent" section of the command palette. Validates ordering, deduplication, max capacity (10), validation of inputs, and label fallback.

## Composition

Single `recentArtifacts` describe block:
- Empty array default, single entry tracking, newest-first ordering
- Deduplication by type+key (moves to top, updates label)
- Same key with different types coexist
- Capped at 10 items (oldest evicted)
- `clearRecent` empties the list
- Ignores entries with missing type or key
- Falls back to key as label when label is empty

```js
trackRecent('prototype', 'a', 'A')
trackRecent('prototype', 'b', 'B')
expect(getRecent()[0].key).toBe('b') // newest first
```

## Dependencies

- `./recentArtifacts.js` (`trackRecent`, `getRecent`, `clearRecent`)

## Dependents

None (test file).
