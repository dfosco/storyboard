# Plan: Storyboard Core Client Architecture Overhaul

## Problem Statement

`@dfosco/storyboard-core` ships 119 Svelte components as **source code**, forcing every consumer repo to:
- Install the full Svelte build toolchain (`@sveltejs/vite-plugin-svelte`, `svelte`, `bits-ui`, `clsx`, `tailwind-merge`, `tailwind-variants`, `tailwindcss`, `@tailwindcss/vite`, etc.)
- Maintain complex Vite aliases to make source compilation work from `node_modules`
- Configure `resolve.dedupe` to avoid duplicate Svelte/bits-ui runtimes
- Clear Vite dep cache manually after `npm link`
- Risk CSS collisions between Tailwind utilities and prototype styles (Primer CSS)

The 3.1.1 and 3.1.2 releases were reactive fixes (moving deps from devDeps to deps, inlining worklets, fixing imports) rather than solving the root cause: **Svelte source should not be shipped to consumers.**

Additionally, the client integration story is fragile:
- Config files, skills, and scripts must be manually set up
- The toolbar config (`core-ui.config.json`) is baked into the core package with no client override mechanism
- There's no automated scaffolding system for new consumer repos

## Proposed Architecture

### Before (current)
```
Consumer (React app)
  ├── needs: @sveltejs/vite-plugin-svelte, svelte
  ├── needs: bits-ui, clsx, tailwind-merge, tailwind-variants
  ├── needs: tailwindcss, @tailwindcss/vite
  ├── needs: svelte.config.js
  ├── needs: 6 Vite resolve aliases for Svelte subpaths
  ├── needs: resolve.dedupe config
  ├── needs: manual Vite cache clearing after npm link
  └── compiles Svelte at consumer build time
```

### After (proposed)
```
Consumer (React app)
  ├── import { mountStoryboardCore } from '@dfosco/storyboard-core'  (single entry)
  ├── mountStoryboardCore(config, { basePath })                       (does everything)
  ├── toolbar.config.json at repo root (optional overrides)
  └── No Svelte toolchain needed.

  npm run update → scaffolds skills, scripts, configs from core
```

Consumer `src/index.jsx` becomes:
```jsx
import { mountStoryboardCore } from '@dfosco/storyboard-core'
import storyboardConfig from '../storyboard.config.json'

mountStoryboardCore(storyboardConfig, { basePath: import.meta.env.BASE_URL })
```

`mountStoryboardCore()` internally handles:
- `installHideParamListener()`
- `installHistorySync()`
- `installBodyClassSync()`
- `initCommentsConfig(config, options)`
- `mountDevTools(options)` → loads compiled UI bundle
- `mountComments()` → loaded from compiled UI bundle
- CSS injection (modes.css, comments CSS)

---

## Workstream 1: Pre-compiled Svelte UI Bundle

### Goal
Compile all Svelte UI into a self-contained JS + CSS bundle. Consumers get plain JS — zero Svelte toolchain needed.

### Approach
Use Vite library mode to build all Svelte-dependent code into `dist/storyboard-ui.js` + `dist/storyboard-ui.css`. The compiled bundle includes:
- Svelte runtime
- All CoreUIBar components (toolbar, menus, panels)
- All comments UI (AuthModal, CommentWindow, Composer, CommentsDrawer)
- Workshop panel and features
- bits-ui, @lucide/svelte, clsx, tailwind-merge, tailwind-variants, marked
- Tailwind CSS (compiled, utility classes only — no resets)

### Changes

#### 1a. Create `packages/core/src/ui-entry.js`
New entry point for the compiled bundle that exports all UI mount functions:
```js
export { mountDevTools, unmountDevTools } from './devtools-impl.js'
export { mountComments } from './comments/ui/mount.js'
```

#### 1a-2. Create `packages/core/src/mountStoryboardCore.js`
Single public entry point for consumers. Lives in the framework-agnostic layer (not compiled into the UI bundle). Uses dynamic import to load compiled UI:
```js
export async function mountStoryboardCore(config = {}, options = {}) {
  installHideParamListener()
  installHistorySync()
  installBodyClassSync()
  if (isCommentsEnabled from config) initCommentsConfig(config, options)
  await mountDevTools(options)  // dynamically imports compiled UI bundle
  if (isCommentsEnabled) mountComments()
}
```

#### 1b. Create `packages/core/vite.ui.config.js`
Vite library mode config:
- **Entry**: `src/ui-entry.js`
- **Format**: ES module
- **Externals**: None — bundle everything (Svelte runtime, bits-ui, etc.)
- **Plugins**: `@sveltejs/vite-plugin-svelte`, `@tailwindcss/vite`
- **Output**: `dist/storyboard-ui.js` + `dist/storyboard-ui.css`
- **CSS handling**: No Tailwind base/reset layer — utilities and components only. Use `@layer storyboard` wrapper for cascade isolation.

#### 1c. Refactor `devtools.js` — decouple from Svelte source
Currently `devtools.js` does:
```js
const { mount } = await import('svelte')
const { default: CoreUIBar } = await import('./CoreUIBar.svelte')
instance = mount(CoreUIBar, { target: wrapper, props: { basePath } })
```

Change to use a package self-reference that resolves to compiled output:
```js
const { mountCoreUI } = await import('@dfosco/storyboard-core/ui-runtime')
instance = mountCoreUI(wrapper, { basePath })
```

- In **source repo**: Vite alias `@dfosco/storyboard-core/ui-runtime` → `packages/core/src/ui-entry-dev.js` (source, for HMR)
- In **consumer repos**: resolves to `./dist/storyboard-ui.js` via package.json exports

#### 1d. Refactor comments barrel — separate framework-agnostic from UI
Currently `comments/index.js` statically imports and re-exports `mountComments` from `./ui/mount.js`, which statically imports from Svelte wrappers (`composer.js` → `Composer.svelte`, etc.). This forces the consumer's bundler to resolve Svelte files.

Fix: Remove `mountComments` from the `comments` barrel. It moves to the compiled UI bundle.

**Consumer change:**
```js
// Before:
import { initCommentsConfig, mountComments } from '@dfosco/storyboard-core/comments'

// After:
import { initCommentsConfig } from '@dfosco/storyboard-core/comments'
import { mountComments } from '@dfosco/storyboard-core'  // from compiled bundle
```

Or better: have `mountDevTools()` optionally mount comments too (configured via `storyboard.config.json`), so the consumer just calls one function.

#### 1e. Update `packages/core/package.json`
- Move Svelte-related deps back to `devDependencies`: `@lucide/svelte`, `bits-ui`, `clsx`, `tailwind-merge`, `tailwind-variants`, `marked`
- Add export: `"./ui-runtime": "./dist/storyboard-ui.js"`
- Add scripts:
  - `"build:ui": "vite build --config vite.ui.config.js"`
  - `"dev:ui": "vite build --config vite.ui.config.js --watch"`
- Update `files` to include `dist/`
- Remove `svelte` from `peerDependencies` (no longer needed by consumers)

#### 1f. CSS isolation strategy
The compiled `storyboard-ui.css` should NOT interfere with prototype styles:
- Wrap all compiled CSS in `@layer storyboard-ui { ... }` — this gives prototype styles (unlayered) automatic priority
- Compiled CSS includes only Tailwind utilities actually used by the components (Tailwind v4 does this by default)
- No Tailwind base/reset/preflight in the compiled output
- The existing `sb-*` custom property prefix in `base.css` already avoids variable collisions

CSS injection: `mountDevTools()` injects the CSS via a `<link>` or `<style>` tag. No separate CSS import needed by consumer.

#### 1g. Update release process
- `npm run build:ui` must run before publishing
- Add to `scripts/release.sh` or as a `prepublishOnly` script in `packages/core/package.json`
- The `dist/storyboard-ui.js` + `dist/storyboard-ui.css` are committed to the package (or built in CI)

---

## Workstream 2: File Scaffolding System

### Goal
Define a manifest of files that should be installed/updated in consumer repos. `npm run update` copies them intelligently.

### File Categories

| Category | Behavior | Examples |
|----------|----------|---------|
| **scaffold** | Only copied if file doesn't exist. Never overwrites user configs. | `storyboard.config.json`, `vite.config.js`, `eslint.config.js`, `index.html`, `.gitignore`, `tsconfig.json` |
| **updateable** | Always updated to latest version from core. | `.github/skills/*`, `scripts/link.sh`, `scripts/unlink.sh`, `AGENTS.md` |

### Changes

#### 2a. Create `packages/core/scaffold/manifest.json`
```json
{
  "files": [
    {
      "source": "scaffold/storyboard.config.json",
      "target": "storyboard.config.json",
      "mode": "scaffold"
    },
    {
      "source": "scaffold/vite.config.js",
      "target": "vite.config.js",
      "mode": "scaffold"
    },
    {
      "source": "scaffold/eslint.config.js",
      "target": "eslint.config.js",
      "mode": "scaffold"
    },
    {
      "source": "scaffold/index.html",
      "target": "index.html",
      "mode": "scaffold"
    },
    {
      "source": "scaffold/tsconfig.json",
      "target": "tsconfig.json",
      "mode": "scaffold"
    },
    {
      "source": "scaffold/toolbar.config.json",
      "target": "toolbar.config.json",
      "mode": "scaffold"
    },
    {
      "source": "scaffold/scripts/link.sh",
      "target": "scripts/link.sh",
      "mode": "updateable"
    },
    {
      "source": "scaffold/scripts/unlink.sh",
      "target": "scripts/unlink.sh",
      "mode": "updateable"
    },
    {
      "source": "scaffold/skills/",
      "target": ".github/skills/",
      "mode": "updateable",
      "directory": true
    }
  ]
}
```

#### 2b. Create `packages/core/scaffold/` directory
Contains template versions of consumer files. These are the "golden" defaults:
- `storyboard.config.json` — minimal default config
- `vite.config.js` — simplified consumer vite config (no Svelte, no Svelte aliases)
- `toolbar.config.json` — empty/minimal client toolbar overrides
- `scripts/link.sh`, `scripts/unlink.sh`
- `skills/` — all agent skills that should be synced

#### 2c. Create `packages/core/src/scaffold.js`
A Node.js script (CLI) that reads `manifest.json` and copies files:
```
npx storyboard-scaffold
# or
node node_modules/@dfosco/storyboard-core/src/scaffold.js
```

Logic:
- For `mode: "scaffold"`: skip if target exists, copy if missing
- For `mode: "updateable"`: always overwrite with latest
- For `directory: true`: recursively copy/update all files in the directory
- Print clear output: `✔ Created storyboard.config.json (scaffold)`, `✔ Updated .github/skills/ (sync)`

#### 2d. Add package.json export + bin
```json
{
  "bin": {
    "storyboard-scaffold": "./src/scaffold.js"
  },
  "exports": {
    "./scaffold": "./src/scaffold.js"
  }
}
```

#### 2e. Update consumer's `npm run update`
Currently the update script only bumps package versions. Extend it to also run the scaffold:
```bash
# After npm install, run scaffold
npx storyboard-scaffold
```

---

## Workstream 3: Toolbar Config Rename + Client Override

### Goal
Rename `core-ui.config.json` → `toolbar.config.json`. Enable client repos to provide their own `toolbar.config.json` that extends/overrides the core defaults.

### Changes

#### 3a. Rename in source
- `packages/core/core-ui.config.json` → `packages/core/toolbar.config.json`
- Update all references in:
  - `packages/core/package.json` (exports, files)
  - `packages/core/src/CoreUIBar.svelte` (config import)
  - `packages/core/src/vite/server-plugin.js` (watcher)
  - Any other files referencing `core-ui.config.json`

#### 3b. Config merge system
The Vite server plugin or the CoreUIBar mount reads two configs:
1. **Core default**: `@dfosco/storyboard-core/toolbar.config.json` (from package)
2. **Client override**: `./toolbar.config.json` (at consumer repo root, optional)

Merge strategy (deep merge with client winning):
- Client can add new menus
- Client can override existing menu properties
- Client can disable menus by setting `"enabled": false`
- Client can add toolbar actions/features

Example client `toolbar.config.json`:
```json
{
  "menus": {
    "theme": { "enabled": false },
    "custom-tool": {
      "label": "My Tool",
      "ariaLabel": "My Custom Tool",
      "icon": "primer/gear",
      "modes": ["*"]
    }
  }
}
```

#### 3c. Config loading in devtools
`mountDevTools()` receives the merged config and passes it to CoreUIBar:
```js
// In the Vite server plugin or at mount time:
const coreConfig = await import('@dfosco/storyboard-core/toolbar.config.json')
const clientConfig = await loadClientConfig('toolbar.config.json') // optional
const mergedConfig = deepMerge(coreConfig, clientConfig)
```

#### 3d. Scaffold the client config
Add `toolbar.config.json` to the scaffold manifest (mode: scaffold) with an empty/commented template showing available override options.

---

## Workstream 4: Consumer Repo Cleanup

### Goal
Simplify the consumer repo setup after the core changes land.

### Changes in consumer `storyboard` repo

#### 4a. Remove from `devDependencies`
- `@sveltejs/vite-plugin-svelte`
- `svelte`
- `bits-ui`
- `clsx`
- `tailwind-merge`
- `tailwind-variants`
- `tailwindcss`
- `@tailwindcss/vite`
- `feather-icons`
- `iconoir`

#### 4b. Delete `svelte.config.js`

#### 4c. Simplify `vite.config.js`
Remove:
- `import { svelte } from '@sveltejs/vite-plugin-svelte'`
- `import tailwindcss from '@tailwindcss/vite'`
- All `@dfosco/storyboard-core/svelte-plugin-ui*` aliases
- `resolve.dedupe` for Svelte packages
- `svelte()` and `tailwindcss()` from plugins array

#### 4d. Update `src/index.jsx`
```jsx
// Before (6 imports, 6 function calls):
import { installHideParamListener, installHistorySync, installBodyClassSync, mountDevTools } from '@dfosco/storyboard-core'
import { initCommentsConfig, mountComments } from '@dfosco/storyboard-core/comments'
import '@dfosco/storyboard-core/comments/ui/comments.css'
import '@dfosco/storyboard-core/modes.css'

// After (1 import, 1 function call):
import { mountStoryboardCore } from '@dfosco/storyboard-core'
import storyboardConfig from '../storyboard.config.json'
mountStoryboardCore(storyboardConfig, { basePath: import.meta.env.BASE_URL })
```

#### 4e. Simplify `scripts/link.sh`
Remove Vite cache clearing (no longer needed since consumer doesn't compile Svelte):
```bash
# Before:
if [ -d "node_modules/.vite/deps" ]; then
  rm -rf node_modules/.vite/deps
fi

# After: just npm link, no cache clearing needed
```

---

## Workstream 5: npm link Workflow

### Goal
`npm link` should work cleanly without Svelte toolchain in the consumer.

### Development workflow

**In storyboard-core (source repo):**
```bash
npm run dev:ui     # Watch build — recompiles UI bundle on Svelte source changes
npm run link       # Register packages globally
```

**In storyboard (consumer repo):**
```bash
npm run link       # Symlink packages from global
npm run dev        # Start dev server — picks up compiled bundle from linked source
```

When you edit Svelte components in storyboard-core:
1. `dev:ui` watcher recompiles `dist/storyboard-ui.js`
2. Consumer's Vite detects the file change
3. Page reloads with updated UI

For development within the source repo itself (editing prototypes + UI simultaneously):
- The Vite config aliases override the compiled bundle with source imports
- Svelte plugin provides HMR for UI components
- No change from current workflow

---

## Dependency Changes Summary

### `@dfosco/storyboard-core` package.json

**Move to devDependencies** (only needed at build time):
- `@lucide/svelte`
- `bits-ui`
- `clsx`
- `tailwind-merge`
- `tailwind-variants`
- `marked`
- `svelte` (remove from peerDependencies)

**Keep in dependencies** (framework-agnostic, needed at runtime):
- `@primer/octicons`
- `feather-icons`
- `iconoir`
- `jsonc-parser`

**Keep in devDependencies** (build tooling):
- `@tailwindcss/cli`
- `@tailwindcss/vite`
- `@sveltejs/vite-plugin-svelte`
- `shadcn-svelte`
- `tailwindcss`

### Consumer `storyboard` package.json

**Remove entirely:**
- `@sveltejs/vite-plugin-svelte`
- `svelte`
- `bits-ui`
- `clsx`
- `tailwind-merge`
- `tailwind-variants`
- `tailwindcss`
- `@tailwindcss/vite`
- `feather-icons`
- `iconoir`
- `smooth-corners`

---

## Out of Scope
- Theme switcher (ThemeMenuButton) — separate feature
- Changing the public API surface beyond what's documented above
- Refactoring the comments system internals
- Canvas/tiny-canvas changes

---

## Risks & Open Questions

1. **Bundle size**: The compiled UI bundle will include Svelte runtime + bits-ui + all components. Estimate ~80-150KB gzipped. Acceptable for devtools chrome since it's lazily loaded.

2. **CoreUIBar dynamic imports**: CoreUIBar lazily loads menu button components based on `toolbar.config.json`. These dynamic imports need to be resolved at bundle build time. May need to convert to static imports or use `import.meta.glob` in the entry.

3. **Workshop server plugin injection**: The server plugin currently injects `mount.ts` via `transformIndexHtml`. This path needs to point to the compiled bundle or be refactored to go through `mountDevTools()`.

4. **Tailwind v4 build**: Need to verify that Vite library mode + Tailwind v4 plugin generates correct utility CSS when scanning Svelte component sources.

5. **Existing prototype Tailwind usage**: If any prototypes use Tailwind classes that happen to match storyboard UI classes, the `@layer` approach prevents conflicts. Need to verify.
