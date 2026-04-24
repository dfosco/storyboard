# `packages/react/src/hooks/useRecord.js`

<!--
source: packages/react/src/hooks/useRecord.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

Loads record collections and individual entries matched by URL route params. Supports hash overrides for modifying existing entries and creating new ones entirely from the URL. Handles prototype-scoped record name resolution and hide-mode shadow overrides.

## Composition

**Exports:**

```js
export function useRecord(recordName, paramName = 'id') → object|null
export function useRecords(recordName) → Array
```

**Internal helper:**
```js
function applyRecordOverrides(baseRecords, resolvedName, plainName) → Array
```

- `useRecord` reads a URL param (via `useParams`) and finds the matching entry
- `useRecords` returns all entries with overrides applied
- `applyRecordOverrides` deep-clones the array, groups override params by entry ID, merges fields into existing entries or creates new ones
- Override convention: `record.{name}.{entryId}.{field}=value`
- Both scoped and unscoped prefixes are checked (fixes bug where prototype-scoped overrides were silently dropped)

## Dependencies

- `react` (useContext, useMemo, useSyncExternalStore), `react-router-dom` (useParams)
- `@dfosco/storyboard-core` — loadRecord, resolveRecordName, deepClone, setByPath, getAllParams, isHideMode, getAllShadows, subscribeToHash/Storage
- [`StoryboardContext`](../StoryboardContext.js.md)

## Dependents

- [`packages/react/src/index.js`](../index.js.md) — re-exports
