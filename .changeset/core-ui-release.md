---
"@dfosco/storyboard-core": major
"@dfosco/storyboard-react": major
---

# Core UI Release — v3.0.0

## ✨ New Features

### Config-Driven Menu System
- **Command menu with structured action types** — actions support `toggle`, `link`, `separator`, `header`, and `footer` types with per-action mode visibility.
- **Config-driven menus** — all CoreUIBar menu buttons are declared in `core-ui.config.json` under the `menus` key, supporting sidepanel buttons and custom Svelte components.
- **Create Menu** — replaces the old Workshop menu with config-driven items and icon/character support.
- **Flow Switcher button** — new CoreUIBar button that lists all flows for the current prototype and allows switching between them.
- **Devtools submenu** — inspector deep-links, mode locking, and `ui.hide` config support.
- **Link action type** — URL-based menu items that navigate via `window.location.href`.

### Panel Component
- **New `Panel` UI component** — anchored side panel replacing modal dialogs, with proper portal handling so nested `DropdownMenu` components work correctly.
- **SidePanel system** — `sidePanelStore` manages panel state; panels for docs and inspector are included.
- **Inspector Panel** — component inspector with fiber walker and mouse-mode selection.
- **Doc Panel** — embedded documentation viewer via `docs-handler.js`.

### Icon System
- **Multi-source icon system** — supports Primer Octicons, Iconoir, and custom SVG icons through a unified `Icon` component.
- **Icon `meta` config** — menu config supports `meta` object for `strokeWeight`, `scale`, `rotate` props.
- **Iconoir support** — fill-based and stroke-based Iconoir icons registered as sources.

### Storyboard React
- **`useFlows()` hook** — lists all flows for the current prototype with `switchFlow()` navigation. Exported from `@dfosco/storyboard-react`.
- **`getFlowsForPrototype()` and `getFlowMeta()`** — new core loader utilities for flow discovery.

### Other
- **Ioskeley Mono font** — custom monospace font for core UI menus and mode selector.
- **Comment draft persistence** — composer saves drafts, repositions correctly, and autofocuses.
- **Mode hue colors** — modes now support a `hue` property for theming.
- **`ui.hide` config** — hide CoreUIBar and mode switcher via `storyboard.config.json`.
- **Toggle mode switcher with `Cmd+.`** alongside CoreUIBar.
- **`excludeRoutes` base path stripping** — route exclusion patterns are now portable across different base paths.

## 🐛 Bug Fixes

- Template dropdown placeholder is no longer a selectable option
- DropdownMenu z-index raised above Panel (`z-50` → `z-[10000]`)
- Panel no longer dismisses when clicking portaled children
- Focus trap disabled on Panel so nested portaled menus work
- Toggle actions execute correctly while keeping menu open
- Workshop features detected from registry, not DOM attribute
- Action menu visibility re-evaluated on SPA navigation
- `menuWidth` config properly applied to ActionMenuButton dropdown
- Button `wrapperVariants` and wrapper-aware sizing restored
- Viewfinder template errors repaired

## 📝 Documentation

- Renamed `scene` → `flow` across README and AGENTS.md
- Added storyboard-core skill for CoreUIBar menu buttons
- Documented new features (flow switcher, config-driven menus, panel system)
