---
"@dfosco/storyboard-core": minor
---

Fully config-driven command palette, tool visibility controls, and Primer theming

- feat: command palette sections fully declarative via commandPalette.sections config
- feat: source types — tools, recent, create, commands, prototypes, canvases, stories, tool-subpages
- feat: tool sub-pages with react-cmdk Page navigation (Escape/Backspace to return)
- feat: declarative theme options in toolbar.config.json
- feat: hideInCommandPalette property for route-aware tool visibility
- feat: menu tools close palette and click toolbar button to open native menu
- feat: separator sections, tool-subpages auto-discovery, route-excluded tools shown as disabled
- feat: hide-toolbars inline action (toggle chrome, same as Cmd+.)
- fix: Cmd+K double-toggle between Svelte and React handlers
- fix: canvas tools hidden from palette on non-canvas routes
- fix: Primer CSS variable theming for Viewfinder, cards, and dark mode
- fix: repository tool URL dynamically injected from config
