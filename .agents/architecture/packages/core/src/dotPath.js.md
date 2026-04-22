# `packages/core/src/dotPath.js`

<!--
source: packages/core/src/dotPath.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../architecture.index.md)

## Goal

Dot-notation path utilities for reading, writing, and cloning nested data. Used throughout the storyboard system to access flow data by paths like `'user.profile.name'` or `'projects.0'`.

## Composition

```js
export function getByPath(obj, path)         // Resolve 'a.b.c' → obj.a.b.c (returns undefined on miss)
export function setByPath(obj, path, value)  // Mutate obj at dot path (auto-creates {} or [] intermediates)
export function deepClone(val)               // Recursive clone for plain objects and arrays
```

`getByPath` splits on `.` and walks the object, returning `undefined` if any segment is missing. `setByPath` creates intermediate objects or arrays (based on whether the next segment is numeric). `deepClone` handles arrays and plain objects only — no special types.

## Dependencies

None.

## Dependents

- [`index.js`](./index.js.md) — re-exports `getByPath`, `setByPath`, `deepClone`
- `dotPath.test.js`
