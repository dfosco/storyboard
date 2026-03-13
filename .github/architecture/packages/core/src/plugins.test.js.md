# `packages/core/src/plugins.test.js`

<!--
source: packages/core/src/plugins.test.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../architecture.index.md)

## Goal

Tests for [`packages/core/src/plugins.js`](./plugins.js.md). Validates `isPluginEnabled` (default true for unconfigured, false when disabled, true when explicitly enabled, independent per-plugin), `getPluginsConfig` (empty default, returns copy not reference), and `initPlugins` (replaces previous config, does not mutate passed object).

## Composition

Three `describe` blocks. Resets to empty config via `initPlugins({})` in `beforeEach`.

## Dependencies

- [`packages/core/src/plugins.js`](./plugins.js.md) — Module under test

## Dependents

None — test file.
