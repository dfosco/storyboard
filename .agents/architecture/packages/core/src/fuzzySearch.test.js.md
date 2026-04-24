# `packages/core/src/fuzzySearch.test.js`

<!--
source: packages/core/src/fuzzySearch.test.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../architecture.index.md)

## Goal

Tests the fuzzy search scoring and filtering used by the command palette. Validates the ranking hierarchy (prefix > word-boundary > substring > fuzzy), case-insensitivity, gap penalties, and the `fuzzySearch` list filtering with `maxResults`, custom keys, and deterministic ranking.

## Composition

**scoreMatch** — exact prefix scores highest, word-boundary beats substring, substring beats fuzzy, returns -1 on miss, penalizes large gaps, case-insensitive.

**fuzzySearch** — returns all items for empty query, filters/ranks by score, respects `maxResults`, supports custom `key`, deterministic ranking for equal scores, skips items with missing labels.

```js
const results = fuzzySearch(items, 'dash')
expect(results[0].item.label).toBe('Dashboard')
```

## Dependencies

- `./fuzzySearch.js` (`scoreMatch`, `fuzzySearch`)

## Dependents

None (test file).
