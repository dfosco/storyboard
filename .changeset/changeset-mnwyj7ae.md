---
"@dfosco/storyboard-core": major
---

Storyboard 4.0 — canvas system overhaul, CLI tooling, and production mode

- **Canvas undo/redo** — full undo/redo queue for widget moves, resizes, copies, and deletes
- **Canvas snap-to-grid** — toggle snap for widget positions and resize with configurable grid size
- **Canvas multi-select & drag** — shift+click multi-select, group drag with preview
- **Canvas widgets** — Figma embed, image paste, copy widget, expand modal, open-in-new-tab, config-driven dropdown menus and tools
- **Canvas zoom** — zoom-to-fit, persistent viewport across sessions
- **Canvas prototype embed** — persisted navigation with undo/redo, hash change tracking
- **Autosync** — scope modes (canvas/prototype), branch worktree isolation, automatic commit/push, stash external edits during sync
- **Storyboard CLI** — new `storyboard` CLI with Caddy proxy for clean dev URLs, worktree port registry, polished output with `@clack/prompts`, `storyboard exit` command
- **Production mode** — `prodMode` URL param, devtools toggle, read-only canvas, local editing indicators
- **Setup experience** — friendly welcome with mascot and getting started guide, turn-key setup (auto-install brew, caddy, gh)
- **Default base URL** changed from `/storyboard/` to `/`
- **Config-driven toolbar** — restructured `toolbar.config.json` with surfaces, tool entries, and widget configs
- **Branch preview** — `branch--<name>` prefix for worktree URLs matching deploy convention
