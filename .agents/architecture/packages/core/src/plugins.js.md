# `packages/core/src/plugins.js`

<!--
source: packages/core/src/plugins.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../architecture.index.md)

## Goal

Simple plugin enable/disable configuration. Reads the `"plugins"` key from `storyboard.config.json` and provides a boolean check for whether a given plugin (e.g. `"devtools"`, `"comments"`) is enabled. Plugins default to enabled if not explicitly configured.

## Composition

- `initPlugins(config)` — seeds the config from the Vite virtual module
- `isPluginEnabled(name)` — returns `true` unless explicitly set to `false`
- `getPluginsConfig()` — returns a copy of the full config object

```js
import { isPluginEnabled } from './plugins.js'
if (isPluginEnabled('comments')) mountComments()
```

## Dependencies

None.

## Dependents

- [`./mountStoryboardCore.js`](./mountStoryboardCore.js.md) — calls `initPlugins` at startup
- `packages/react/src/vite/data-plugin.js` — seeds plugin config
- `packages/core/src/index.js` — re-exports
- `packages/core/src/svelte-plugin-ui/index.ts` — checks plugin flags
