# `packages/core/src/viewfinder.test.js`

<!--
source: packages/core/src/viewfinder.test.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../architecture.index.md)

## Goal

Tests for [`packages/core/src/viewfinder.js`](./viewfinder.js.md). Validates `hash` (returns number, deterministic, different for different strings, non-negative), `resolveFlowRoute` (exact case match, case-insensitive, explicit `route` key, absolute route, fallback to root, empty/missing routes, URL encoding, `flowMeta.route` support, priority of top-level `route` over `flowMeta.route`, `_route` inferred from Vite plugin, explicit route wins over `_route`, `meta.default: true` omits `?flow=` param), `getFlowMeta` (with/without `flowMeta`, array authors, missing), deprecated aliases (`resolveSceneRoute`, `getSceneMeta`), and `buildPrototypeIndex` (`hideFlows` support from `meta` and top-level, defaults, folder grouping with metadata, implicit folders, ungrouped prototypes, `lastModified` passthrough).

## Composition

Six `describe` blocks. Seeds the data index via `init()` in `beforeEach` with a test index containing flows with various route, metadata, and `_route` configurations. `buildPrototypeIndex` tests re-initialize the index with prototype metadata, folder metadata, and scoped flows to validate grouping, sorting, and folder behavior.

## Dependencies

- [`packages/core/src/viewfinder.js`](./viewfinder.js.md) — Module under test
- [`packages/core/src/loader.js`](./loader.js.md) — `init` for seeding test data

## Dependents

None — test file.
