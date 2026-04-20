---
"@dfosco/storyboard-core": minor
---

Performance mode, terminal agents, live canvas updates, and terminal expand

**Performance mode** — per-canvas setting that controls embed iframe lifecycle:
- Embeds don't render until clicked ("Click to refresh")
- >7 visible embeds: none render until user zooms in
- Embeds deactivate 5s after leaving viewport
- Persisted to canvas JSONL, works in dev and prod

**Terminal agents** — contextual AI agents in terminal widgets:
- Terminal config with connected widget data for zero-latency agent context
- Canvas update CLI (`npx storyboard canvas update`) and PATCH /widget API
- Auto-launch Copilot with terminal-agent custom agent
- Server registry for dev server management
- Scaffold .storyboard/terminals/ and .github/agents/ in setup

**Live canvas updates** — API/CLI writes push to browser instantly:
- Canvas server sends HMR events after every write endpoint
- Fixed useCanvas HMR handler (was silently dropping all events)

**Terminal expand** — fullscreen terminal view:
- Expand button opens true fullscreen (no padding/overlay)
- Split view when a prototype or story is connected to the terminal
- Terminal state machine: dormant → connecting → live (gated ↔ interactive) → ended

**Other fixes:**
- Deterministic server URL from httpServer.address()
- Catch pty.spawn errors (no more server crashes)
- Connector anchor snap zone improvements
