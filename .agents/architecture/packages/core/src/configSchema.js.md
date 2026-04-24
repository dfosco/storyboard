# `packages/core/src/configSchema.js`

<!--
source: packages/core/src/configSchema.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../architecture.index.md)

## Goal

Defines the canonical shape, JSDoc typedefs, and default values for `storyboard.config.json`. Every consumer of the config should use `getConfig(raw)` to get a fully defaulted, validated config object. New keys added here are safe for existing projects because they always have defaults.

## Composition

```js
export const builtinPasteRules  // Default paste rules (Figma embeds)
export const configDefaults     // Full default config tree

export function getConfig(raw = {})       // Deep-merge user config over defaults
export function getConfigDefaults()       // Return bare defaults copy
```

**JSDoc typedefs:** `PasteRule`, `CanvasTerminalConfig`, `CanvasConfig`, `CommandPaletteConfig`, `CommandPaletteSection`, `CommandPaletteSectionItem`, `CommandPaletteOption`, `CustomerModeConfig`, `StoryboardConfig`.

Internal helper: `mergeConfig(defaults, overrides)` — deep-merges with array replacement (not concatenation).

**Key defaults:**
- `modes.enabled: false`
- `canvas.pasteRules`: Figma embed rule
- `commandPalette.ranking: 'frecency'`
- `customerMode.enabled: false`

## Dependencies

None.

## Dependents

- `configSchema.test.js`

## Notes

The `mergeConfig` helper replaces arrays rather than concatenating them — if a user provides `pasteRules`, it completely overrides the builtin rules. This is intentional for config predictability.
