# Named Localhost Port Bindings for Worktrees

**Status:** Implemented on `copilot/explore-localhost-port-bindings`

**Goal:** Each worktree gets a unique, stable dev-server port. Optionally map ports to friendly local domains via hotel.

**Constraint:** Fully optional — repos work without any local proxy setup.

---

## What Was Built

### 1. Worktree Port Registry (`packages/core/src/worktree/port.js`)

A Node.js module published in `@dfosco/storyboard-core` that manages `.worktrees/ports.json` — a gitignored file mapping worktree names to unique ports.

```json
{
  "main": 1234,
  "security-ux": 1235,
  "v3-11-0": 1236
}
```

**Exports:**

| Function | Description |
|----------|-------------|
| `portsFilePath(cwd?)` | Resolves the path to `ports.json`, searching up from cwd. Works from repo root or inside `.worktrees/<name>/`. |
| `detectWorktreeName()` | Uses `git rev-parse --show-toplevel` + path analysis to detect if running inside a worktree. Returns `'main'` if not. |
| `getPort(worktreeName)` | Returns the assigned port, creating a new assignment if needed. Ports start at 1235 for non-main worktrees. |
| `resolvePort(worktreeName)` | Read-only lookup — returns assigned port or falls back to 1234 without creating new assignments. |

**Published as:** `@dfosco/storyboard-core/worktree/port`

```js
import { getPort, detectWorktreeName } from '@dfosco/storyboard-core/worktree/port'
```

---

### 2. Smart Dev Server (`packages/core/src/worktree/dev-server.js`)

A bin entry (`storyboard-dev`) that auto-detects the worktree context and starts Vite on the correct port.

```bash
npx storyboard-dev              # auto-detect worktree, use assigned port
npx storyboard-dev --port 3000  # override port
npx storyboard-dev --host       # extra args forwarded to vite
```

**Published as bin:** `storyboard-dev` in `@dfosco/storyboard-core`

**Behavior:**
1. Calls `detectWorktreeName()` to figure out if we're in a worktree
2. Calls `getPort(name)` to get/assign the port
3. Spawns `npx vite --port <N>` with any extra CLI args forwarded
4. Falls back to port 1234 if not in a worktree or no registry exists

---

### 3. Root Repo Wrappers (`scripts/`)

The source repo uses thin wrapper scripts that import directly from the local `packages/core/src/worktree/` path:

| Script | Purpose |
|--------|---------|
| `scripts/dev-server.js` | Root `npm run dev` — delegates to core port logic |
| `scripts/worktree-port.js` | CLI: `node scripts/worktree-port.js <name>` → prints assigned port |
| `scripts/hotel-register.js` | Reads `ports.json`, registers each entry with hotel for `*.localhost` routing |

**Root `package.json` scripts:**
```json
{
  "dev": "node scripts/dev-server.js",
  "dev:vite": "vite",
  "hotel:add": "node scripts/hotel-register.js"
}
```

---

### 4. Worktree Skill Updates

Both `.github/skills/worktree/SKILL.md` (source repo) and `packages/core/scaffold/skills/worktree/SKILL.md` (distributed to client repos) were updated with:

**Step 0 — Slugify branch names:** Dots, spaces, underscores → hyphens, lowercase. Required before creating worktrees to avoid subdomain routing issues.

**Step 2 — Register a dev-server port:** Calls the port script after creating the worktree to assign a unique port.

**Source repo skill** uses `node scripts/worktree-port.js <branch-name>`.

**Scaffold skill** (client repos) offers two paths:
- `node -e "import('@dfosco/storyboard-core/worktree/port').then(m => console.log(m.getPort('<name>')))"` (using the published package)
- `node scripts/worktree-port.js <name>` (if the project has a local wrapper)

---

### 5. PrototypeEmbed External URL Support

`packages/react/src/canvas/widgets/PrototypeEmbed.jsx` was updated to handle `http://` and `https://` URLs:

- **External URLs are embedded as-is** — storyboard query params (`_sb_embed`, `_sb_theme_target`, `_sb_canvas_theme`) are only appended to local prototype paths
- `isExternal` is a memoized check: `/^https?:\/\//.test(rawSrc)`
- Placeholder text updated to indicate full URLs are accepted: `"/MyPrototype/page or https://…"`

This enables embedding worktree dev servers running on different ports (e.g. `http://localhost:1235/MyPrototype`) in canvas prototype embed widgets.

---

### 6. Gitignore & Config

| Change | File |
|--------|------|
| Added `Caddyfile.local` to `.gitignore` | `.gitignore` |
| `storyboard-dev` bin added | `packages/core/package.json` |
| `./worktree/port` export added | `packages/core/package.json` |

---

## How It Works — User Experience

### Without proxy (default)

```bash
# Main checkout
npm run dev           # → localhost:1234

# Inside a worktree
cd .worktrees/fix-bug
npm run dev           # → localhost:1235 (auto-assigned, stable)
```

Ports are tracked in `.worktrees/ports.json` and persist across restarts.

### Client repos (install the npm package)

```bash
# In package.json
{ "dev": "storyboard-dev" }

# Or run directly
npx storyboard-dev
```

The `storyboard-dev` bin handles everything — detect worktree, assign port, launch vite.

### With hotel (opt-in)

```bash
npm i -g hotel && hotel start   # one-time setup
npm run hotel:add               # register all worktrees

# Now available at:
# http://storyboard-main.localhost
# http://storyboard-fix-bug.localhost
```

---

## Architecture: Source Repo vs Client Repos

```
Source repo (dfosco/storyboard)
├── scripts/dev-server.js          ← thin wrapper, imports from local packages/core
├── scripts/worktree-port.js       ← thin wrapper
├── scripts/hotel-register.js      ← hotel integration
└── packages/core/src/worktree/
    ├── port.js                    ← canonical logic (published in npm)
    └── dev-server.js              ← storyboard-dev bin (published in npm)

Client repos (install @dfosco/storyboard-core)
├── node_modules/@dfosco/storyboard-core/src/worktree/
│   ├── port.js                    ← available via import
│   └── dev-server.js              ← available via npx storyboard-dev
└── .worktrees/
    └── ports.json                 ← auto-created, gitignored
```

---

## File Changes Summary

| File | Change | Published |
|------|--------|-----------|
| `packages/core/src/worktree/port.js` | New — port registry logic | ✅ npm |
| `packages/core/src/worktree/dev-server.js` | New — smart dev launcher bin | ✅ npm |
| `packages/core/package.json` | Add bin + export | ✅ npm |
| `packages/core/scaffold/skills/worktree/SKILL.md` | Update with slugify + port steps | ✅ scaffold |
| `scripts/dev-server.js` | New — root repo wrapper | ❌ local only |
| `scripts/worktree-port.js` | New — root repo wrapper | ❌ local only |
| `scripts/hotel-register.js` | New — optional hotel integration | ❌ local only |
| `package.json` | Add dev/dev:vite/hotel:add scripts | ❌ local only |
| `.github/skills/worktree/SKILL.md` | Update with slugify + port steps | ❌ local only |
| `.gitignore` | Add `Caddyfile.local` | ❌ local only |
| `packages/react/src/canvas/widgets/PrototypeEmbed.jsx` | External URL support in embeds | ✅ npm |

---

## Worktree Naming Convention

For maximum compatibility, use **kebab-case branch names without dots**:
- `v3-11-0` instead of `3.11.0`
- `feature-dark-mode` instead of `feature/dark-mode`

The worktree skill enforces this via Step 0 (slugification). The hotel integration sanitizes dots to hyphens automatically, so `3.11.0` becomes `storyboard-3-11-0.localhost` — but it's cleaner to avoid dots from the start.

---

## Not Implemented (Future / Optional)

- **Caddy integration** — Plan included a `scripts/caddy-generate.js` for generating `Caddyfile.local`. Not built; hotel is simpler for the target use case.
- **README documentation** — The plan called for a "Local Domain Names" section in README. Deferred until the feature is battle-tested.
- **Automatic hotel registration** — Could auto-register on `npm run dev` instead of requiring a separate `npm run hotel:add` step.
