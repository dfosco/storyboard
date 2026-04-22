# `packages/react/src/hooks/useLocalStorage.test.js`

<!--
source: packages/react/src/hooks/useLocalStorage.test.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

Tests for [`useLocalStorage`](./useLocalStorage.js.md). Verifies read priority (hash > localStorage > flow default), write/clear operations, and provider requirement.

## Composition

- Returns `[value, setValue, clearValue]` tuple
- Falls back to flow default when no override exists
- Reads from localStorage when present
- Hash override takes priority over localStorage
- `setValue` writes to localStorage
- `clearValue` removes from localStorage
- Throws outside `<StoryboardProvider>`

## Dependencies

- [`useLocalStorage.js`](./useLocalStorage.js.md), test-utils

## Dependents

None (test file).
