# `packages/core/src/viewfinder.test.js`

<!--
source: packages/core/src/viewfinder.test.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../architecture.index.md)

## Goal

Tests the viewfinder module — responsible for resolving flow names to URL routes, reading flow metadata, and building the prototype index used by the viewfinder navigation UI. Covers route resolution priority (explicit > flowMeta > _route > fallback), `meta.default` flag, folder grouping, and deprecated aliases.

## Composition

**hash** — deterministic, non-negative numeric hash for strings.

**resolveFlowRoute** — matches flow name to route (case-insensitive), uses `route` key, `flowMeta.route`, or `_route` as fallbacks, falls back to `/?flow=` for unmatched, encodes special characters, omits `?flow=` when `meta.default` is true, prefers explicit route over `_route`.

**getFlowMeta** — returns `flowMeta` object or null.

**Deprecated aliases** — `resolveSceneRoute === resolveFlowRoute`, `getSceneMeta === getFlowMeta`.

**buildPrototypeIndex** — passes `hideFlows` from metadata (defaults to true), groups prototypes into folders, keeps ungrouped prototypes separate, creates implicit folders, uses directory name as display name fallback, passes through `lastModified`.

```js
expect(resolveFlowRoute('Dashboard', routes)).toBe('/Dashboard')
expect(resolveFlowRoute('inferred-default', routes)).toBe('/Settings') // no ?flow=
```

## Dependencies

- `./viewfinder.js` (`hash`, `resolveFlowRoute`, `getFlowMeta`, `resolveSceneRoute`, `getSceneMeta`, `buildPrototypeIndex`)
- `./loader.js` (`init`)

## Dependents

None (test file).
