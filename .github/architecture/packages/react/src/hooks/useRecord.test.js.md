# `packages/react/src/hooks/useRecord.test.js`

<!--
source: packages/react/src/hooks/useRecord.test.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

Tests for [`packages/react/src/hooks/useRecord.js`](./useRecord.js.md). Validates both `useRecord` (single entry lookup by URL param, missing param, default `id` param, nonexistent collection) and `useRecords` (all entries, empty on missing collection, hash overrides on existing entries, new entry creation from hash). Also tests hide mode support (shadow overrides for both single and all entries, reactive shadow updates) and scoped (prototype) records (overrides with plain and scoped prefixes, merging across both).

## Composition

Mocks `react-router-dom`'s `useParams` to control URL param values. Uses `seedTestData()` and `TEST_RECORDS` from test utilities. Includes dedicated test sections for hide mode (using `activateHideMode`/`setShadow`) and scoped records (using a `StoryboardContext.Provider` wrapper with `prototypeName`). Scoped record tests verify that overrides written with plain names (e.g. `record.rules.…`) are correctly applied to prototype-scoped records (e.g. `security/rules`).

## Dependencies

- [`packages/react/src/hooks/useRecord.js`](./useRecord.js.md) — Module under test
- `@testing-library/react` — `renderHook`, `act`
- `@dfosco/storyboard-core` — `activateHideMode`, `setShadow`, `init` for hide mode and scoped record tests
- [`packages/react/src/StoryboardContext.js`](../StoryboardContext.js.md) — Used to provide `prototypeName` in scoped tests
- `react-router-dom` — Mocked `useParams`

## Dependents

None — test file.
