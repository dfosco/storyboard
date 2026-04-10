# Named Localhost Port Bindings for Worktrees

Exploration of approaches to map worktree names → unique ports → friendly local domains.

**Goal:** `main` → `localhost:1234` → `storyboard.local`, worktree `security-ux` → `localhost:1235` → `security-ux.storyboard.local`

---

## Current State

- Vite dev server is hardcoded to port `1234`
- `VITE_BASE_PATH` already supports branch-prefixed paths (used in CI for GitHub Pages)
- Worktrees live in `.worktrees/<branch-name>`, each runs its own `npm run dev`
- No reverse proxy, no `/etc/hosts` manipulation, no Docker

---

## The Dots-in-Names Problem

> "Would I need to have my worktree names without dots?"

**Short answer: yes, avoid dots in worktree/branch names for subdomain routing.**

- `3.11.0.storyboard.local` looks like a 4-level domain — browsers and TLS treat each dot as a subdomain boundary.
- Some browsers refuse to set cookies or apply HSTS for multi-dot `.local` names.
- Workaround: **sanitize** dots to hyphens for the domain label: `3-11-0.storyboard.local`.
- For **path-based routing** (`storyboard.local/3.11.0`), dots are fine in the path segment — no ambiguity.

**Recommendation:** Use path-based routing (`storyboard.local/branch-name/`) since it mirrors the existing `VITE_BASE_PATH` pattern and avoids dot issues entirely.

---

## Approach A — Path-Based with a Single Reverse Proxy (Recommended)

One proxy on `storyboard.local:80` dispatches to per-worktree Vite instances by path prefix.

```
storyboard.local/             →  localhost:1234  (main)
storyboard.local/security-ux/ →  localhost:1235  (worktree)
storyboard.local/3.11.0/      →  localhost:1236  (worktree)
```

### How it works

1. **Port registry** — a JSON file (`.worktrees/ports.json`) mapping worktree names to ports:
   ```json
   {
     "main": 1234,
     "security-ux": 1235,
     "3.11.0": 1236
   }
   ```

2. **Auto-assign ports** — the worktree skill (or a small `dev:worktree` script) picks the next free port starting from `1234` (main) + incrementing. Writes to `ports.json`.

3. **Start Vite with matching port + base path**:
   ```bash
   VITE_BASE_PATH=/security-ux/ vite --port 1235
   ```
   This already works — `vite.config.js` reads `VITE_BASE_PATH` from env.

4. **Reverse proxy** — a lightweight local proxy routes by path prefix:
   - **Caddy** (simplest, auto-HTTPS not needed for `.local`):
     ```
     storyboard.local {
       handle_path /security-ux/* {
         reverse_proxy localhost:1235
       }
       handle_path /3.11.0/* {
         reverse_proxy localhost:1236
       }
       reverse_proxy localhost:1234
     }
     ```
   - **Alternatives:** nginx, Traefik, or a tiny Node proxy.

5. **DNS** — add a single line to `/etc/hosts`:
   ```
   127.0.0.1  storyboard.local
   ```
   Only needed once (not per worktree, since path-based routing uses one domain).

### Pros
- Mirrors the existing `VITE_BASE_PATH` pattern used in GitHub Pages branch deploys
- No dot ambiguity — branch name is a path segment
- Single `/etc/hosts` entry
- No wildcard DNS needed

### Cons
- Requires a running reverse proxy process
- Need to regenerate proxy config when worktrees are added/removed

---

## Approach B — Subdomain-Based with Wildcard DNS

Each worktree gets its own subdomain.

```
storyboard.local       →  localhost:1234  (main)
security-ux.storyboard.local  →  localhost:1235
v3-11-0.storyboard.local      →  localhost:1236
```

### How it works

1. Same port registry as Approach A.
2. Start Vite with `VITE_BASE_PATH=/` (each instance is at root).
3. **Wildcard DNS** — resolve `*.storyboard.local` to `127.0.0.1`:
   - **dnsmasq** (macOS): `echo "address=/storyboard.local/127.0.0.1" > /etc/dnsmasq.d/storyboard.conf`
   - **systemd-resolved** (Linux): similar config
   - **Alternative:** Use [`hotel`](https://github.com/typicode/hotel) or [`local-ssl-proxy`](https://github.com/cameronhunter/local-ssl-proxy)
4. **Reverse proxy** routes by `Host` header instead of path.

### Sanitization rule
Branch names → subdomain labels: replace dots with hyphens, strip leading/trailing hyphens.
- `3.11.0` → `v3-11-0` (prefix `v` if starts with digit)
- `feature/dark-mode` → `feature-dark-mode`

### Pros
- Cleaner URLs — each worktree feels like its own site
- `VITE_BASE_PATH` stays `/` — no path prefix needed

### Cons
- Requires wildcard DNS (dnsmasq / systemd-resolved / third-party tool)
- Dots in branch names must be sanitized → potential name collisions
- More moving parts to configure initially

---

## Approach C — Port-Only (No Custom Domain)

Skip the `.local` domain entirely. Just auto-assign unique ports per worktree.

```
localhost:1234  (main)
localhost:1235  (security-ux)
localhost:1236  (3.11.0)
```

### How it works

1. Port registry file (`.worktrees/ports.json`).
2. Modify the worktree skill to auto-assign a port on creation.
3. A new `dev:worktree` script reads the port for the current worktree and starts Vite:
   ```bash
   vite --port $(jq -r '."'"$(basename $(pwd))"'"' ../../.worktrees/ports.json)
   ```
4. Update `AGENTS.md` dev URL tracking to save the correct port per worktree.

### Pros
- Zero external dependencies (no proxy, no DNS config)
- Works immediately on any OS
- Can be a stepping stone — add the proxy/domain layer later

### Cons
- No friendly domain names
- Need to remember which port is which (mitigated by the port registry)

---

## Approach D — Use an Existing Tool (hotel, local-ssl-proxy, Valet)

### [`hotel`](https://github.com/typicode/hotel) (Node.js)
- Registers local dev servers by name
- Provides `http://my-app.localhost` subdomains automatically
- Zero DNS config needed (`.localhost` is special-cased by browsers)
- Run: `hotel add 'npm run dev' --name storyboard-main --port 1234`

### [`Caddy`](https://caddyserver.com/) with Caddyfile
- Single binary, auto-generates config
- Can watch a directory and auto-reload

### [`local-ssl-proxy`](https://github.com/cameronhunter/local-ssl-proxy)
- Provides HTTPS wrapper around localhost
- Useful if you need HTTPS for testing

---

## Implementation Recommendation

**Start with Approach C (port-only), then layer on Approach A (path-based proxy) when needed.**

### Phase 1: Auto-Port Assignment (low effort, high value)

1. Add port auto-assignment to the worktree skill
2. Create `.worktrees/ports.json` as the registry
3. Modify `npm run dev` or add `npm run dev:worktree` to read port from registry
4. Update agent `devURL` tracking to use the correct port

### Phase 2: Local Domain (optional, when you want nicer URLs)

1. Add a `Caddyfile` (or `scripts/local-proxy.js`) that reads `.worktrees/ports.json` and generates routes
2. Add `storyboard.local` to `/etc/hosts`
3. Add a `npm run proxy` script to start the proxy
4. Document the one-time DNS setup in README

### On Worktree Naming

For maximum compatibility, **use kebab-case branch names without dots**:
- `v3-11-0` instead of `3.11.0`
- `feature-dark-mode` instead of `feature/dark-mode`

This is already the convention in the ship skill (which derives kebab-case branch names). If you need to support existing dotted tags/versions as worktrees, the port registry and proxy config can use a sanitized slug for the domain while preserving the original name for the worktree directory.
