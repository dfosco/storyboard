---
"@dfosco/storyboard-core": minor
---

Terminal agents: context awareness, auto-launch copilot, canvas update CLI

- Terminal agents with context awareness, signal bus, and action widgets
- Auto-launch copilot with agent instructions on new terminal sessions
- Canvas update CLI command and PATCH /widget API endpoint
- Inline full widget data in terminal config for zero-latency context
- Fix: prevent accidental canvas wipes from PUT /update endpoint
- Fix: reliable env var passing to terminal agents
- Several fixes for copilot launch flow (pre-type, agent flag, env vars)
