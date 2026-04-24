# `packages/core/src/dotPath.test.js`

<!--
source: packages/core/src/dotPath.test.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../architecture.index.md)

## Goal

Tests the dot-notation path utilities (`getByPath`, `setByPath`, `deepClone`) used throughout the storyboard data system for accessing and mutating nested data structures.

## Composition

**getByPath** — resolves nested paths, array indices, handles null/undefined/empty/non-string inputs gracefully.

**setByPath** — sets nested values with mutation, auto-creates intermediate objects/arrays, overwrites existing values.

**deepClone** — clones plain objects, arrays, nested structures; returns primitives as-is; cloned objects are independent (no mutation propagation).

```js
expect(getByPath({ a: { b: { c: 42 } } }, 'a.b.c')).toBe(42)
setByPath(obj, 'items.0', 'first')
expect(Array.isArray(obj.items)).toBe(true)
```

## Dependencies

- `./dotPath.js` (`getByPath`, `setByPath`, `deepClone`)

## Dependents

None (test file).
