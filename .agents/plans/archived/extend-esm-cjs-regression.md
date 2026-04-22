# Debug: `extend` ESM/CJS interop regression

## Root Cause Analysis

### The Error
```
Uncaught SyntaxError: The requested module '/branch--unified-vision/node_modules/extend/index.js'
does not provide an export named 'default'
```

### When It Was Introduced

**Beta 6** (`b6e8491a`) — specifically by commit `f4faf520`:

```
feat(markdown): use remark with GitHub Flavored Markdown
```

This commit (on branch `4.0.0--markdown-gfm`) replaced the minimal regex-based markdown renderer with `remark` + `remark-gfm`. The last working version was **beta 5**.

### The Dependency Chain

```
@dfosco/storyboard-react
  └── remark-gfm@4.0.1      (added in f4faf520)
        └── unified@11.0.5   (ESM — "type": "module")
              └── extend@3.0.2  (CJS — no type field, uses module.exports)
```

### Why It Breaks

1. `unified@11` is an ESM package that does `import extend from 'extend'` (default ESM import)
2. `extend@3.0.2` is CJS-only (uses `module.exports`, no `"type": "module"`)
3. The storyboard data-plugin **excludes** `@dfosco/storyboard-react` from Vite's `optimizeDeps` — this is needed because storyboard-react uses virtual modules
4. When storyboard-react is excluded, Vite won't auto-discover and pre-bundle its CJS deps
5. Vite serves `extend` as raw CJS → browser sees `import extend from '...'` but CJS has no ESM default export → **crash**

### This Is the Same Bug as `debug`

In beta 9/10, the identical issue was fixed for `debug` (another CJS dep in the micromark chain). The fix added `'debug'` to `optimizeDeps.include` in the data-plugin. But `extend` was missed.

Timeline:
- **beta 5**: No remark-gfm → ✅ no CJS interop issues
- **beta 6**: remark-gfm added → ❌ both `debug` and `extend` CJS issues introduced  
- **beta 9**: `debug` added to optimizeDeps.include → ❌ `extend` still broken
- **beta 10**: `debug` injection moved to data-plugin → ❌ `extend` still broken

### CJS Audit

Full audit of remark/unified/micromark dependency chain: **`extend` is the only remaining CJS package**. All others (`bail`, `is-plain-obj`, `trough`, `devlop`, `decode-named-character-reference`) are ESM.

---

## Fix Plan

### ~~Todo 1: Add `extend` to optimizeDeps.include in data-plugin~~

### Todo 1 (revised): Include remark entry points instead of individual CJS packages

**File:** `packages/react/src/vite/data-plugin.js`

**Rationale:** Listing individual CJS leaf packages (`debug`, `extend`) is whack-a-mole. Since `@dfosco/storyboard-react` is excluded from optimizeDeps (virtual module issue), Vite can't trace into its dep tree. Including the top-level remark entry points (`remark`, `remark-gfm`, `remark-html`) makes Vite pre-bundle the full chain — all transitive CJS deps get caught automatically.

Change the `config()` hook to:
```js
include: ['remark', 'remark-gfm', 'remark-html'],
```

### Todo 2: Update tests

**File:** `packages/react/src/vite/data-plugin.test.js`

Replace individual `debug`/`extend` assertions with a single test that checks for `remark`, `remark-gfm`, `remark-html`.

### Todo 3: Clean up source repo vite.config.js

**File:** `vite.config.js`

Remove `'debug'` and `'extend'` from the local `optimizeDeps.include` — the plugin now handles all remark-chain CJS deps.

### Todo 4: Run tests to verify

Run `npm run test` and `npm run lint` to confirm changes pass.

---

## Notes

- The deeper architectural issue is that `optimizeDeps.exclude: ['@dfosco/storyboard-react']` prevents Vite from auto-discovering CJS deps in the remark chain. Every new CJS transitive dep will need manual inclusion. This is an acceptable trade-off since the storyboard-react exclusion is needed for virtual module resolution, and CJS deps are increasingly rare.
- After shipping this fix as a new beta, consumers need `npm update` to pick up the data-plugin change. No manual vite.config.js changes needed on their end.
