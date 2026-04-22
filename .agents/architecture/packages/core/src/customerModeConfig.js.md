# `packages/core/src/customerModeConfig.js`

<!--
source: packages/core/src/customerModeConfig.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../architecture.index.md)

## Goal

Runtime store for the `customerMode` section of `storyboard.config.json`. Customer mode hides chrome (toolbars, command palette, branchbar) and optionally replaces the homepage with a prototype, turning a storyboard project into a polished demo or customer-facing app.

## Composition

```js
export function initCustomerModeConfig(config)  // Seed from storyboard.config.json customerMode key
export function getCustomerModeConfig()          // Get full config object
export function isCustomerMode()                 // Check if customer mode is enabled
```

Config shape: `{ enabled, hideChrome, hideHomepage, protoHomepage }`.

## Dependencies

None.

## Dependents

- [`index.js`](./index.js.md) — re-exports all public APIs
- `mountStoryboardCore.js` — calls `initCustomerModeConfig()` at startup
