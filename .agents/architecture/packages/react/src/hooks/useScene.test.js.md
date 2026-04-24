# `packages/react/src/hooks/useScene.test.js`

<!--
source: packages/react/src/hooks/useScene.test.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

Tests for [`useFlow`](./useScene.js.md) and the deprecated `useScene` alias. Verifies return shape, flow name from context, and provider requirement.

## Composition

- `useFlow` returns `{ flowName, switchFlow }`, reads flowName from context, throws outside provider
- `useScene` (deprecated) returns `{ sceneName, switchScene }`, mirrors `useFlow` behavior

## Dependencies

- [`useScene.js`](./useScene.js.md), test-utils

## Dependents

None (test file).
