---
"@dfosco/storyboard-core": minor
---

TMUX session management, terminal widget UX, interact gate system, and canvas page ordering.

- Terminal sessions scoped by branch/canvas with persistent registry, friendly names (color-bird), and graceful orphan handling
- `storyboard terminal` CLI: session browser, welcome prompt, close/open/remove subcommands
- Widget interact gate system: configurable "Click to interact" overlay in WidgetChrome, double-Escape to exit
- Terminal widget: title bar, zzz sleep animation, selection border radius, default size 800×450
- Canvas folder page ordering via .meta.json with drag-and-drop persistence
- Command palette focus fix (removed duplicate mount)
- Viewfinder page order fix
- Connector arrow endpoints (circle, arrow-in, arrow-out, none)
