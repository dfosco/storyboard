# `packages/core/src/fuzzySearch.js`

<!--
source: packages/core/src/fuzzySearch.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../architecture.index.md)

## Goal

Lightweight substring + fuzzy scoring engine for the command palette. Provides tiered scoring: exact prefix (100), word-boundary match (75), consecutive substring (50), fuzzy character match (25). Each tier gets bonuses for tighter matches and penalties for character gaps.

## Composition

```js
export function scoreMatch(text, query)                    // Score single text against query (-1 = no match)
export function fuzzySearch(items, query, opts = {})        // Search array, return sorted { item, score }[]
```

Options for `fuzzySearch`: `key` (default `'label'`), `maxResults` (default `50`).

Internal helpers: `findWordBoundaryMatch(text, query)` for boundary detection, `fuzzyScore(text, query)` for ordered character matching with gap penalties.

## Dependencies

None.

## Dependents

- `paletteProviders.js` — uses `fuzzySearch` for command palette result scoring
- `fuzzySearch.test.js`

## Notes

Not exported through [`index.js`](./index.js.md) — consumed internally by palette providers only.
