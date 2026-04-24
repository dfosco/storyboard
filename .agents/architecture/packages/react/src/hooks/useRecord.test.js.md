# `packages/react/src/hooks/useRecord.test.js`

<!--
source: packages/react/src/hooks/useRecord.test.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

Tests for [`useRecord`](./useRecord.js.md) and `useRecords`. Covers URL param matching, hash overrides (modify existing / create new entries), hide-mode shadows, and prototype-scoped record name resolution.

## Composition

- `useRecord`: returns null with no param, matching entry with param, null for nonexistent, defaults paramName to `id`
- `useRecords`: returns all entries, applies hash overrides, creates new entries from hash
- Hide mode: reads/applies shadow overrides, reactively updates
- Scoped records: applies overrides with plain (unscoped) and resolved (scoped) prefixes, merges both

## Dependencies

- [`useRecord.js`](./useRecord.js.md), [`StoryboardContext`](../StoryboardContext.js.md), test-utils, `@dfosco/storyboard-core`, mocked `react-router-dom`

## Dependents

None (test file).
