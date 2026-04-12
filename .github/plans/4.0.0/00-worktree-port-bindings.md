# 00 — Named Localhost Port Bindings for Worktrees

**Clips:** `#g087` (step 0 — prerequisite for all other 4.0 work)

**Goal:** Each worktree gets a unique, stable dev-server port. Optionally map ports to friendly local domains via hotel.

**Constraint:** Fully optional — repos work without any local proxy setup.

**Status:** Implemented on `copilot/explore-localhost-port-bindings` — needs merge/cherry-pick into 4.0 branch.

---

## What Gets Built

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
| `portsFilePath(cwd?)` | Resolves the path to `ports.json`, searching up from cwd |
| `detectWorktreeName()` | Uses `git rev-parse --show-toplevel` + path analysis |
| `getPort(worktreeName)` | Returns assigned port, creating assignment if needed (starts at 1235) |
| `resolvePort(worktreeName)` | Read-only lookup — falls back to 1234 without creating assignments |

**Published as:** `@dfosco/storyboard-core/worktree/port`

### 2. Smart Dev Server (`packages/core/src/worktree/dev-server.js`)

A bin entry (`storyboard-dev`) that auto-detects the worktree context and starts Vite on the correct port.

```bash
npx storyboard-dev              # auto-detect worktree, use assigned port
npx storyboard-dev --port 3000  # override port
npx storyboard-dev --host       # extra args forwarded to vite
```

### 3. Root Repo Wrappers (`scripts/`)

| Script | Purpose |
|--------|---------|
| `scripts/dev-server.js` | Root `npm run dev` — delegates to core port logic |
| `scripts/worktree-port.js` | CLI: prints assigned port for a worktree name |
| `scripts/hotel-register.js` | Reads `ports.json`, registers with hotel for `*.localhost` routing |

### 4. Worktree Skill Updates

Both source repo and scaffold skills updated with:
- **Step 0 — Slugify branch names:** dots/spaces/underscores → hyphens, lowercase
- **Step 2 — Register dev-server port** after creating worktree

### 5. PrototypeEmbed External URL Support

External `http://` and `https://` URLs embedded as-is in PrototypeEmbed widgets. Storyboard query params only appended to local paths. Enables embedding worktree dev servers on different ports.

---

## User Experience

### Without proxy (default)
```bash
npm run dev              # main → localhost:1234
cd .worktrees/fix-bug
npm run dev              # → localhost:1235 (auto-assigned, stable)
```

### Client repos
```json
{ "dev": "storyboard-dev" }
```

### With hotel (opt-in)
```bash
npm i -g hotel && hotel start
npm run hotel:add
# → http://storyboard-main.localhost
# → http://storyboard-fix-bug.localhost
```

---

## File Changes

| File | Published |
|------|-----------|
| `packages/core/src/worktree/port.js` | ✅ npm |
| `packages/core/src/worktree/dev-server.js` | ✅ npm (bin) |
| `packages/core/package.json` (bin + export) | ✅ npm |
| `packages/core/scaffold/skills/worktree/SKILL.md` | ✅ scaffold |
| `scripts/dev-server.js` | ❌ local |
| `scripts/worktree-port.js` | ❌ local |
| `scripts/hotel-register.js` | ❌ local |
| `packages/react/src/canvas/widgets/PrototypeEmbed.jsx` | ✅ npm |
