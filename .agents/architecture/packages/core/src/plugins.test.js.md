# `packages/core/src/plugins.test.js`

<!--
source: packages/core/src/plugins.test.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../architecture.index.md)

## Goal

Tests the plugin configuration system that allows enabling/disabling storyboard plugins (devtools, comments, etc.) via a simple boolean config map.

## Composition

**isPluginEnabled** — returns true by default for unconfigured plugins, false when explicitly disabled, handles multiple plugins independently.

**getPluginsConfig** — returns empty object by default, returns a defensive copy (mutations don't affect internal state).

**initPlugins** — replaces previous config on re-init, does not mutate passed config object.

```js
initPlugins({ devtools: false, comments: true })
expect(isPluginEnabled('devtools')).toBe(false)
expect(isPluginEnabled('comments')).toBe(true)
```

## Dependencies

- `./plugins.js` (`initPlugins`, `isPluginEnabled`, `getPluginsConfig`)

## Dependents

None (test file).
