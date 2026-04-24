# `packages/core/src/configSchema.test.js`

<!--
source: packages/core/src/configSchema.test.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../architecture.index.md)

## Goal

Tests the storyboard configuration schema — the `getConfig` merge logic and `getConfigDefaults` factory. Ensures user config merges correctly over defaults, arrays replace rather than concatenate, extra keys are preserved, and the internal `configDefaults` object is never mutated.

## Composition

**getConfigDefaults** — returns a full defaults object; each call returns a fresh copy.

**getConfig** — core merge behavior:
- Returns full defaults for empty/undefined input
- Deep-merges user config over defaults (source wins)
- Replaces arrays (e.g. `pasteRules`) instead of concatenating
- Preserves extra keys not in defaults
- Does not mutate `configDefaults`

```js
const c = getConfig({ canvas: { github: { ghGuard: 'link' } } })
expect(c.canvas.github.ghGuard).toBe('link')
expect(c.canvas.github.embedBehavior).toBe('link-preview') // default preserved
```

## Dependencies

- `./configSchema.js` (`getConfig`, `getConfigDefaults`, `configDefaults`, `builtinPasteRules`)

## Dependents

None (test file).
