# Implementation Report — 4.0.0 Step 0: Storyboard CLI + Caddy Proxy

**Branch:** `4.0.0`  
**Clips:** `#g087#t16` (closed)  
**Plan:** `.github/plans/4.0.0/00-worktree-port-bindings.md`

---

## What Was Built

Step 0 of the 4.0.0 plan — a `storyboard` CLI with Caddy reverse proxy for clean dev URLs.

### URL Scheme

| Context | URL |
|---------|-----|
| Main | `http://storyboard.localhost/storyboard/` |
| Branch `4.0.0` | `http://storyboard.localhost/4.0.0/storyboard/` |
| Direct (no proxy) | `http://localhost:<port>/storyboard/` |

### CLI Commands

| Command | Description |
|---------|-------------|
| `storyboard dev` | Start Vite + update Caddy proxy |
| `storyboard setup` | Install deps, Caddy, start proxy |
| `storyboard proxy` | Generate Caddyfile + start/reload Caddy |
| `storyboard update:version [version]` | Update storyboard packages to latest |

### New Files

| File | Purpose | Published |
|------|---------|-----------|
| `packages/core/src/cli/index.js` | CLI entry, subcommand dispatch | ✅ npm (`storyboard`, `sb` bins) |
| `packages/core/src/cli/dev.js` | Dev server with correct `VITE_BASE_PATH` | ✅ npm |
| `packages/core/src/cli/proxy.js` | Caddyfile generation + Caddy management | ✅ npm |
| `packages/core/src/cli/setup.js` | One-time environment setup | ✅ npm |
| `packages/core/src/cli/updateFlag.js` | Feature flag updates | ✅ npm |
| `packages/core/src/worktree/port.js` | Port registry (from initial commit) | ✅ npm |
| `packages/core/src/worktree/port.test.js` | 17 tests | ❌ local |
| `scripts/setup.js` | Root `npm run setup` wrapper | ❌ local |
| `scripts/worktree-port.js` | CLI port lookup | ❌ local |

### Removed Files (replaced by CLI)

| File | Replaced by |
|------|-------------|
| `scripts/dev-server.js` | `storyboard dev` (CLI) |
| `scripts/hotel-register.js` | `storyboard proxy` (Caddy) |
| `packages/core/src/worktree/dev-server.js` | `storyboard dev` (CLI) |

### Modified Files

| File | Change |
|------|--------|
| `packages/core/package.json` | `storyboard` + `sb` bins, keep `./worktree/port` export |
| `package.json` | `dev` → `storyboard dev`, added `setup`, `hotel:add` → `storyboard proxy` |
| `PrototypeEmbed.jsx` | External URLs embedded without storyboard query params |
| `.github/skills/worktree/SKILL.md` | Slugify step + port registration |
| `packages/core/scaffold/skills/worktree/SKILL.md` | Same for client repos |
| `AGENTS.md` | CLI docs, proxy URLs, dev URL session state |
| `.github/plans/4.0.0/00-worktree-port-bindings.md` | Updated to reflect CLI + Caddy approach |

---

## Architecture

```
storyboard dev
  ├─ detectWorktreeName() → "4.0.0"
  ├─ getPort("4.0.0") → 1235
  ├─ VITE_BASE_PATH=/4.0.0/storyboard/
  ├─ spawn vite --port 1235
  └─ caddy reload (updates proxy routes)

Caddy (port 80)
  http://storyboard.localhost
    /4.0.0/*  → localhost:1235
    /*        → localhost:1234 (main)
```

## Key Design Decisions

1. **Caddy over hotel** — hotel does subdomain routing only; Caddy supports path-based routing with clean URLs on port 80
2. **`VITE_BASE_PATH` prepending** — branch base path is `/<branchname>/storyboard/`, main stays `/storyboard/`. Production parity maintained.
3. **`storyboard.localhost`** — resolves to 127.0.0.1 natively per RFC 6761, no `/etc/hosts` changes needed
4. **Sudo only on first start** — Caddy needs sudo for port 80 binding, but subsequent reloads use the admin API (no sudo)
5. **Graceful degradation** — if Caddy isn't running, `storyboard dev` still starts Vite with direct port URLs

---

## Verification

- **Build:** ✅ `npm run build` succeeds
- **Port tests:** ✅ 17/17 pass
- **Existing tests:** ✅ 723 pass (4 pre-existing failures unrelated)
