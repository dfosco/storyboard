# `packages/react/src/hooks/useOverride.test.js`

<!--
source: packages/react/src/hooks/useOverride.test.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

Tests for [`useOverride`](./useOverride.js.md). Verifies the `[value, setValue, clearValue]` tuple, flow default fallback, hash override reading, write/clear operations, and standalone usage without a provider.

## Composition

- Returns `[value, setValue, clearValue]` tuple
- Falls back to flow default when no hash override
- Reads from hash override when present
- `setValue` writes to hash
- `clearValue` removes hash param
- Works without `<StoryboardProvider>` for object overrides
- Returns undefined without provider when no override exists

## Dependencies

- [`useOverride.js`](./useOverride.js.md), test-utils

## Dependents

None (test file).
