---
name: migrate-4.2.0
description: "Post-scaffold migration for client repos upgrading from 4.2.0-alpha to 4.3.0. Applies manual changes that `npx storyboard update` cannot handle."
metadata:
  author: Daniel Fosco
  version: "2026.4.28"
  fromVersion: "4.2.0-alpha"
  toVersion: "4.3.0"
---

# Migrate from 4.2.0-alpha → 4.3.0

> Triggered by: "migrate from 4.2.0", "post-update migration", "apply 4.3.0 changes"
>
> **Prerequisites:** `npx storyboard update` has already run (packages updated + scaffold synced). This skill applies the manual changes that scaffold doesn't handle.

## What `storyboard update` already handled

Before running this skill, the update command has:
1. Updated all `@dfosco/storyboard-*` and `@dfosco/tiny-canvas` packages to 4.3.0
2. Run `npx storyboard-scaffold` which synced:
   - `scripts/link.sh`, `scripts/unlink.sh` (always overwritten)
   - `.github/skills/` (always overwritten)
   - `.githooks/` (always overwritten)
   - Created `storyboard.config.json`, `toolbar.config.json`, `commandpalette.config.json`, deploy/preview workflows **only if they didn't already exist** (never overwrites)

**Everything below requires manual migration.**

---

## Migration Steps

### Step 1: `storyboard.config.json` — Add missing config blocks

Read the client's `storyboard.config.json`. Add any missing top-level keys from the reference below. **Do not overwrite existing values** — only merge what's missing.

**Required new keys:**

```jsonc
{
  // Add if missing — enables the modes feature (flow switching UI)
  "modes": {
    "enabled": false
  },

  // Add if missing — devtools plugin toggle
  "plugins": {
    "devtools": true
  },

  // Add if missing inside existing "workshop" block
  // These granular toggles control which workshop creation actions are available
  "workshop": {
    "features": {
      "createPrototype": true,
      "createFlow": true,
      "createCanvas": true
    }
  },

  // Add if missing — canvas terminal and agent settings
  // See migrate SKILL.md §2 (canvas config) for full agent customization reference
  "canvas": {
    "terminal": {
      "resizable": false,
      "defaultWidth": 800,
      "defaultHeight": 450
    }
  },

  // Add if missing — customer/presentation mode
  "customerMode": {
    "enabled": false,
    "hideChrome": false,
    "hideHomepage": false,
    "protoHomepage": ""
  }
}
```

**Also fix:**
- If `toolbar.tools` exists inside `storyboard.config.json`, **remove it** — toolbar tools now live exclusively in `toolbar.config.json`. Move any tool definitions there if not already present.

**Optional (only if the client uses canvas agents):**
- Add `canvas.agents` and `hotPool` blocks — see the `migrate` skill (§2 and §3) for the full reference config with all agent properties documented.

---

### Step 2: `AGENTS.md` — Rewrite to match core template

The client's AGENTS.md is significantly behind. Replace it entirely with the core's current template, then merge back client-specific sections.

**Changes from old → new:**

| Section | Change |
|---------|--------|
| Selected Widgets format | Add `viewport` field to JSON example |
| Widget placement rule #8 | **NEW** — auto-positioning priority chain |
| General instructions | `.github/skills` → `.agents/skills` |
| General instructions | **NEW** — ship skill hard rule: "ship" → always invoke ship skill |
| General instructions | **NEW** — after changes: create branch + push, then clips task |
| Planning | `.github/plans` → `.agents/plans` |
| Skills section | All paths: `.github/skills/storyboard/X` → `.agents/skills/X/SKILL.md` |
| Skills section | **NEW** entries: canvas, release, changeset, clips, architecture-scanner, changelog, migrate |
| Build & Development | **NEW** — `storyboard dev` / `storyboard setup` CLI commands |
| Build & Development | **NEW** — Storyboard CLI command table |
| Build & Development | **NEW** — Dev URLs section (Caddy proxy + worktree URLs) |
| Dev URL session state | Updated to use proxy URLs as default |
| Architecture | `.github/architecture` → `.agents/architecture` |
| Architecture | **NEW** — Debugging section (end-to-end testing philosophy, devlog strategy) |
| Key Conventions | **NEW** — "Components must live in their own directory" |
| Key Conventions | **NEW** — "Always use the create skill" for new components |
| Key Conventions | **NEW** — Branch URL support requirement |
| Key Conventions | **NEW** — Optional/heavy dependency resilient imports |
| Anti-patterns | **REMOVED** — `_components/` git add -f warning (no longer needed if client doesn't use `_*/` ignore rule) |

**Client-specific sections to PRESERVE** (merge back after rewrite):
1. **Debugging: Hide Mode** — Keep the hide mode documentation section. The core doesn't have it.
2. **`_components/` git add -f warning** — Keep if the client's `.gitignore` still has a `_*/` rule. Check first.
3. **Client-specific skills** — If the client has custom skills (e.g. `lateral-thinking`, `primer-components-catalog`, `primer-screenshot-builder`, `primer-url-builder`, `shadow-clone`), add them to the Skills section.
4. **Client-specific prompts reference** — If `.agents/prompts/` exists with custom prompts, add a mention.

**Procedure:**

1. Read the current `AGENTS.md` — note all client-specific content
2. Read the core's `AGENTS.md` (use the version from this package's scaffold or from the core repo as reference — the canonical version is in the core monorepo root)
3. Write the new `AGENTS.md` using the core's structure, adapting:
   - Repository-specific values (owner, name, dev URL/port)
   - Client-specific skills (add after the core skills list)
   - Client-specific sections (hide mode, git warnings)
4. Remove references to `.github/skills/`, `.github/plans/`, `.github/architecture/` — replace with `.agents/skills/`, `.agents/plans/`, `.agents/architecture/`

---

### Step 3: `.agents/` directory — Restructure and add missing files

#### 3a. Agent definition files

Check if these files exist. If missing, create them from scaffold:

- **`.agents/prompt-agent.agent.md`** — Single-shot canvas prompt agent definition. If missing, copy from the scaffold or create with the standard prompt-agent content.
- **`.agents/terminal-agent.agent.md`** — Canvas-aware terminal agent. If it exists at `.agents/agents/terminal-agent.agent.md` (nested `agents/` subdir), move it to `.agents/terminal-agent.agent.md` (root of `.agents/`).

```bash
# Move if in wrong location
if [ -f ".agents/agents/terminal-agent.agent.md" ] && [ ! -f ".agents/terminal-agent.agent.md" ]; then
  mv .agents/agents/terminal-agent.agent.md .agents/terminal-agent.agent.md
fi

# Clean up empty agents/ subdir
rmdir .agents/agents/ 2>/dev/null
```

#### 3b. Missing skills

The scaffold syncs skills to `.github/skills/` (updateable). The client should also have them at `.agents/skills/`. If the client has skills in `.agents/skills/` that are outdated or missing, sync them.

**Skills that should exist in `.agents/skills/`:**

| Skill | Present in 4.2.0-alpha? | Action |
|-------|------------------------|--------|
| agent-browser | ✅ | Update if outdated |
| architecture-scanner | ❌ | Copy from scaffold |
| canvas | ✅ | Update if outdated |
| changelog | ❌ | Copy from scaffold |
| changeset | ❌ | Copy from scaffold |
| clips | ❌ | Copy from scaffold |
| create | ✅ | Update if outdated |
| migrate | ❌ | Copy from scaffold |
| release | ❌ | Copy from scaffold |
| ship | ✅ | Update if outdated |
| storyboard | ✅ | Update if outdated |
| storyboard-core | ❌ | Copy from scaffold |
| tools | ✅ | Update if outdated |
| vitest | ✅ | Update if outdated |
| web-perf | ❌ | Copy from scaffold |
| worktree | ✅ | Update if outdated |

**Client-specific skills to preserve (do not overwrite):**
- `lateral-thinking/`
- `primer-components-catalog/`
- `primer-screenshot-builder/`
- `primer-url-builder/`
- `shadow-clone/`
- `update-storyboard/` — **consider removing**: the core now handles updates via CLI (`npx storyboard update`). This legacy skill may cause confusion.

#### 3c. Plans and architecture directories

```bash
# Ensure .agents/plans/ exists
mkdir -p .agents/plans

# Ensure .agents/architecture/ exists  
mkdir -p .agents/architecture
```

If plans or architecture docs exist under `.github/plans/` or `.github/architecture/`, move them:

```bash
# Move plans if they exist in old location
if [ -d ".github/plans" ] && [ "$(ls -A .github/plans 2>/dev/null)" ]; then
  cp -rn .github/plans/* .agents/plans/ 2>/dev/null
fi

# Move architecture docs if they exist in old location
if [ -d ".github/architecture" ] && [ "$(ls -A .github/architecture 2>/dev/null)" ]; then
  cp -rn .github/architecture/* .agents/architecture/ 2>/dev/null
fi
```

---

### Step 4: `vite.config.js` — Add React deduplication

Add `resolve.dedupe` to prevent duplicate React instances that cause hook errors (common when npm hoists multiple React copies):

```js
resolve: {
    alias: {
        '@': path.resolve(__dirname, './src'),
    },
    dedupe: ['react', 'react-dom'],
},
```

**Also update `optimizeDeps.include`** — add sync external store shims if not present:

```js
optimizeDeps: {
    include: [
        'reshaped',
        '@primer/react',
        '@primer/octicons-react',
        'prop-types',
        'use-sync-external-store/shim',
        'use-sync-external-store/shim/with-selector',
    ],
},
```

---

### Step 5: `src/index.jsx` — Add canvas creation redirect

Add the redirect handler **before** the router is created. This enables the workshop's "create canvas" flow to redirect properly after creation:

```js
// Canvas creation redirect — must run before React mounts
const redirectParam = new URLSearchParams(window.location.search).get('redirect')
if (redirectParam) {
    const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '')
    window.location.replace(base + redirectParam)
}
```

Insert this block after the imports and before `const router = createBrowserRouter(...)`.

**Also add** the comment layout CSS import if the client uses the comments feature:

```js
import '@dfosco/storyboard-core/comments/ui/comment-layout.css'
```

---

### Step 6: `index.html` — Theme pre-flash script and viewport

#### 6a. Theme pre-flash

Add this script in `<head>` to prevent a flash of wrong theme on load. Insert it after the `<title>` tag:

```html
<script>
  // Prevent theme flash — apply saved theme before first paint
  ;(function() {
    try {
      var t = localStorage.getItem('sb-color-mode')
      if (t) document.documentElement.setAttribute('data-sb-theme', t)
    } catch(e) {}
  })()
</script>
```

#### 6b. Viewport meta

Update the viewport meta tag to prevent pinch zoom on canvas (prevents accidental zoom while interacting with canvas widgets):

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
```

#### 6c. Overscroll behavior

Add to the `<body>` tag or via inline style to prevent pull-to-refresh on mobile:

```html
<body style="overscroll-behavior-y: contain;">
```

---

### Step 7: `package.json` — Update scripts

Replace the legacy shell-based update scripts with the CLI:

```json
{
  "scripts": {
    "update": "npx storyboard update",
    "update:beta": "npx storyboard update beta",
    "update:alpha": "npx storyboard update alpha"
  }
}
```

The old scripts (`bash .github/skills/update-storyboard/update-storyboard-packages.sh`) don't run scaffold sync. The new CLI does both package update + scaffold.

**Optional:** Update `"dev"` to use the storyboard CLI for Caddy proxy integration:

```json
{
  "scripts": {
    "dev": "storyboard dev"
  }
}
```

This enables automatic Caddy proxy setup for worktree dev URLs. If the client doesn't use worktrees or Caddy, keeping `"dev": "vite"` is fine.

---

### Step 8: `eslint.config.js` — Minor improvements

#### 8a. Suppress prop-types warnings

Add `'react/prop-types': 'off'` to rules — the project uses runtime type checking, not prop-types:

```js
rules: {
    // ... existing rules
    'react/prop-types': 'off',
},
```

#### 8b. Update React version detection

If `settings.react.version` is set to `'18.3'`, update to `'detect'` or the actual version:

```js
settings: { react: { version: 'detect' } },
```

#### 8c. Add `.worktrees` to ignores

```js
{ ignores: ['dist', '.worktrees'] },
```

---

### Step 9: `src/prototypes/_app.jsx` — Add tiny-canvas styles

If the client uses canvas pages, add the tiny-canvas CSS import:

```js
import '@dfosco/tiny-canvas/style.css'
```

Add this alongside the other imports at the top of the file. Without it, canvas widgets may render without proper styling.

---

### Step 10: `src/routes.jsx` — Add eslint disable comments

Add eslint disable comments to suppress `react-refresh/only-export-components` warnings on the route helper components:

```js
// eslint-disable-next-line react-refresh/only-export-components
const Modals_ = () => { ... }

// eslint-disable-next-line react-refresh/only-export-components
const Layout = () => ( ... )

// eslint-disable-next-line react-refresh/only-export-components
const App = () => ...
```

This is cosmetic but prevents noisy lint output.

---

## Execution Procedure

### Before starting

1. Confirm `npx storyboard update` has already run
2. Confirm packages are at 4.3.0 (check `package.json`)
3. Create a feature branch: `git checkout -b migrate/4.3.0`

### Apply changes

Run steps 1–10 in order. Each step is idempotent — safe to run again if interrupted.

For each step:
1. Check if the change is already applied (skip if so)
2. Apply the change
3. Verify no syntax errors were introduced

### After all steps

1. Run `npm run build` to verify the build passes
2. Run `npm run lint` to check for lint errors (fix any new ones from the migration)
3. Start the dev server (`npm run dev`) and verify the app loads
4. Commit all changes: `git add -A && git commit -m "chore: migrate to storyboard 4.3.0"`
5. Push the branch and create a PR

---

## Priority Guide

If you can't apply all steps at once, prioritize in this order:

1. **Step 1** (config) — Core code may crash reading missing keys
2. **Step 2** (AGENTS.md) — Agents won't find skills at old paths
3. **Step 3** (`.agents/` dir) — Agent definitions needed for canvas agents
4. **Step 4** (vite dedupe) — Prevents React hook errors
5. **Step 5** (redirect) — Needed for canvas creation workflow
6. **Steps 6–10** — Quality of life improvements, lower urgency
