# Named Localhost Port Bindings for Worktrees

Map worktree names → unique ports → friendly local domains using **hotel** or **Caddy**.

**Goal:** `main` → `localhost:1234` → `storyboard.localhost`, worktree `security-ux` → `localhost:1235` → `security-ux.localhost`

**Constraint:** Fully optional — repo works without any local proxy setup.

---

## Current State

- Vite dev server is hardcoded to port `1234`
- `VITE_BASE_PATH` already supports branch-prefixed paths (used in CI for GitHub Pages)
- Worktrees live in `.worktrees/<branch-name>`, each runs its own `npm run dev`
- No reverse proxy, no `/etc/hosts` manipulation, no Docker

---

## The Dots-in-Names Problem

> "Would I need to have my worktree names without dots?"

**Short answer: yes, avoid dots for subdomain routing.**

- `3.11.0.localhost` looks like a 3-level domain — browsers treat each dot as a subdomain boundary.
- Workaround: **sanitize** dots to hyphens: `3-11-0.localhost`
- The sanitization happens in the proxy layer, preserving the original worktree directory name.

**Recommendation:** Name worktrees with kebab-case (`v3-11-0` instead of `3.11.0`) to avoid the sanitization step entirely. The ship skill already enforces kebab-case.

---

## Architecture: hotel vs Caddy

Both achieve the same goal. Choose based on your environment:

| Feature | hotel | Caddy |
|---------|-------|-------|
| Install | `npm i -g hotel` | Single binary (brew/apt) |
| DNS config | None (`.localhost` special-cased) | `/etc/hosts` entry |
| Process management | Built-in (auto-starts servers) | External (run alongside Vite) |
| Config format | CLI commands | Caddyfile |
| HTTPS | No | Yes (auto-generated certs) |

**Recommendation:** Use **hotel** for simplicity (Node.js ecosystem, zero DNS config). Use **Caddy** if you need HTTPS locally or prefer a standalone binary.

---

## Implementation Plan

### Phase 1: Auto-Port Assignment (required, zero external deps)

This is the foundation — works standalone and enables optional proxy layer.

#### 1.1 Port registry file

Create `.worktrees/ports.json` (gitignored) mapping worktree names to ports:

```json
{
  "main": 1234,
  "security-ux": 1235,
  "v3-11-0": 1236
}
```

#### 1.2 Add `scripts/worktree-port.js`

A small Node script that:
- Reads `.worktrees/ports.json`
- Assigns next available port for new worktrees (starting from 1235)
- Called by worktree skill on creation

```js
// scripts/worktree-port.js
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'

const PORTS_FILE = join(process.cwd(), '.worktrees', 'ports.json')
const BASE_PORT = 1234

export function getPort(worktreeName) {
  const ports = existsSync(PORTS_FILE) 
    ? JSON.parse(readFileSync(PORTS_FILE, 'utf8')) 
    : { main: BASE_PORT }
  
  if (!ports[worktreeName]) {
    const usedPorts = Object.values(ports)
    let nextPort = BASE_PORT + 1
    while (usedPorts.includes(nextPort)) nextPort++
    ports[worktreeName] = nextPort
    writeFileSync(PORTS_FILE, JSON.stringify(ports, null, 2))
  }
  
  return ports[worktreeName]
}

// CLI usage: node scripts/worktree-port.js <name>
if (process.argv[2]) {
  console.log(getPort(process.argv[2]))
}
```

#### 1.3 Update worktree skill

Modify `.github/skills/worktree/SKILL.md` to call the port script after creating a worktree:

```bash
# After git worktree add...
node scripts/worktree-port.js <branch-name>
```

#### 1.4 Smart `npm run dev`

Update the dev script to auto-detect worktree context and use the correct port:

```json
{
  "scripts": {
    "dev": "node scripts/dev-server.js",
    "dev:port": "vite --port"
  }
}
```

```js
// scripts/dev-server.js
import { spawn } from 'child_process'
import { basename, resolve } from 'path'
import { existsSync, readFileSync } from 'fs'

const cwd = process.cwd()
const worktreeName = basename(cwd)
const portsFile = resolve(cwd, '../../.worktrees/ports.json') // up from .worktrees/<name>

let port = 1234 // default
if (existsSync(portsFile)) {
  const ports = JSON.parse(readFileSync(portsFile, 'utf8'))
  port = ports[worktreeName] || ports.main || 1234
}

console.log(`Starting dev server on port ${port}...`)
spawn('npx', ['vite', '--port', String(port)], { stdio: 'inherit', shell: true })
```

**Fallback behavior:** If not in a worktree or no port assigned, uses default `1234`.

---

### Phase 2: hotel Integration (optional, recommended)

Users who want friendly URLs can opt-in to hotel.

#### 2.1 One-time setup (user's machine)

```bash
# Install hotel globally
npm install -g hotel

# Start hotel daemon (runs on port 2000, proxies *.localhost)
hotel start
```

#### 2.2 Register storyboard servers

Add a `npm run hotel:add` script:

```json
{
  "scripts": {
    "hotel:add": "node scripts/hotel-register.js"
  }
}
```

```js
// scripts/hotel-register.js
import { execSync } from 'child_process'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

const PORTS_FILE = join(process.cwd(), '.worktrees', 'ports.json')

if (!existsSync(PORTS_FILE)) {
  console.log('No ports.json found. Run `npm run dev` first in each worktree.')
  process.exit(0)
}

const ports = JSON.parse(readFileSync(PORTS_FILE, 'utf8'))

for (const [name, port] of Object.entries(ports)) {
  const slug = name.replace(/\./g, '-') // sanitize dots
  try {
    execSync(`hotel add http://localhost:${port} --name storyboard-${slug}`, { stdio: 'inherit' })
    console.log(`✓ storyboard-${slug}.localhost → localhost:${port}`)
  } catch (e) {
    console.error(`✗ Failed to register ${name}`)
  }
}
```

**Result:** After running `npm run hotel:add`, you get:
- `http://storyboard-main.localhost` → `localhost:1234`
- `http://storyboard-security-ux.localhost` → `localhost:1235`
- `http://storyboard-v3-11-0.localhost` → `localhost:1236`

#### 2.3 Document in README

Add an optional section to README:

```markdown
## Local Domain Names (optional)

For friendly URLs like `http://storyboard-main.localhost`:

1. Install [hotel](https://github.com/typicode/hotel): `npm i -g hotel`
2. Start hotel: `hotel start`
3. Register worktrees: `npm run hotel:add`

Your worktrees will be available at `http://storyboard-{name}.localhost`.
```

---

### Phase 3: Caddy Alternative (optional)

For users who prefer Caddy or need HTTPS.

#### 3.1 One-time setup

```bash
# macOS
brew install caddy

# Add to /etc/hosts (one time)
echo "127.0.0.1 storyboard.localhost" | sudo tee -a /etc/hosts
```

#### 3.2 Generate Caddyfile from ports.json

Add `npm run caddy:generate`:

```js
// scripts/caddy-generate.js
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'

const PORTS_FILE = join(process.cwd(), '.worktrees', 'ports.json')

if (!existsSync(PORTS_FILE)) {
  console.log('No ports.json found.')
  process.exit(0)
}

const ports = JSON.parse(readFileSync(PORTS_FILE, 'utf8'))

let caddyfile = `# Auto-generated from .worktrees/ports.json
# Run: caddy run --config Caddyfile.local

storyboard.localhost {
`

// Add path-based routes for each worktree
for (const [name, port] of Object.entries(ports)) {
  if (name === 'main') continue
  caddyfile += `  handle_path /${name}/* {
    reverse_proxy localhost:${port}
  }
`
}

// Default route to main
caddyfile += `  reverse_proxy localhost:${ports.main || 1234}
}
`

writeFileSync('Caddyfile.local', caddyfile)
console.log('Generated Caddyfile.local')
console.log('Run: caddy run --config Caddyfile.local')
```

**Result:**
- `http://storyboard.localhost/` → main
- `http://storyboard.localhost/security-ux/` → worktree
- `http://storyboard.localhost/v3-11-0/` → worktree

#### 3.3 Gitignore the generated file

```gitignore
Caddyfile.local
```

---

## File Changes Summary

| File | Change |
|------|--------|
| `scripts/worktree-port.js` | New — port registry management |
| `scripts/dev-server.js` | New — smart dev server with port detection |
| `scripts/hotel-register.js` | New — optional hotel integration |
| `scripts/caddy-generate.js` | New — optional Caddy config generator |
| `package.json` | Add scripts: `dev`, `hotel:add`, `caddy:generate` |
| `.gitignore` | Add `.worktrees/ports.json`, `Caddyfile.local` |
| `.github/skills/worktree/SKILL.md` | Update to call port script |
| `README.md` | Add optional "Local Domain Names" section |

---

## User Experience

### Without proxy (default)

```bash
npm run dev           # → localhost:1234 (main)
cd .worktrees/fix-bug
npm run dev           # → localhost:1235 (auto-assigned)
```

Ports are stable and tracked in `.worktrees/ports.json`.

### With hotel (opt-in)

```bash
npm i -g hotel && hotel start  # one-time
npm run hotel:add              # register all worktrees

# Now available at:
# http://storyboard-main.localhost
# http://storyboard-fix-bug.localhost
```

### With Caddy (opt-in)

```bash
brew install caddy                    # one-time
npm run caddy:generate                # regenerate when worktrees change
caddy run --config Caddyfile.local    # start proxy

# Now available at:
# http://storyboard.localhost/
# http://storyboard.localhost/fix-bug/
```

---

## On Worktree Naming

For maximum compatibility, **use kebab-case branch names without dots**:
- `v3-11-0` instead of `3.11.0`
- `feature-dark-mode` instead of `feature/dark-mode`

This is already the convention in the ship skill. The hotel/Caddy integration sanitizes dots to hyphens automatically, so `3.11.0` becomes `storyboard-3-11-0.localhost` — but it's cleaner to avoid dots from the start.
