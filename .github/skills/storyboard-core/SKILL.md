# Storyboard Core — CoreUIBar & Menu Buttons

Guide for adding new menu buttons to the storyboard CoreUIBar — the floating toolbar at the bottom-right of every prototype page.

## Overview

The CoreUIBar is a config-driven floating toolbar rendered by `packages/core/src/CoreUIBar.svelte`. All buttons are defined in `packages/core/core-ui.config.json` under the `menus` key. The toolbar reads this config at startup, filters menus by the current mode, and renders buttons in JSON key order (reversed, so top = rightmost after the command menu).

## Architecture

```
core-ui.config.json          ← Menu declarations (icon, modes, behavior)
    ↓
CoreUIBar.svelte              ← Reads config, renders buttons via {#each}
    ↓
├── TriggerButton + Icon      ← Sidepanel buttons (docs, inspector)
├── FlowSwitcherButton.svelte ← Custom Svelte component
├── CreateMenuButton.svelte   ← Custom Svelte component
├── CommentsMenuButton.svelte ← Custom Svelte component
└── CommandMenu.svelte        ← Always rightmost, special handling
```

## Adding a New Menu Button

### Step 1: Add config entry

Add an entry to `packages/core/core-ui.config.json` under `menus`. The key order determines position (top = leftmost, bottom = rightmost before command menu).

#### Minimal entry (sidepanel-style button)

```json
{
  "menus": {
    "my-feature": {
      "ariaLabel": "My Feature",
      "icon": "primer/gear",
      "modes": ["*"],
      "sidepanel": "my-feature"
    }
  }
}
```

Sidepanel buttons are the simplest — CoreUIBar auto-renders a `TriggerButton` + `Icon` that toggles the side panel. No custom Svelte component needed.

#### Custom component entry

```json
{
  "menus": {
    "my-feature": {
      "ariaLabel": "My Feature",
      "icon": "feather/fast-forward",
      "modes": ["*"]
    }
  }
}
```

Buttons without `sidepanel` require a dedicated Svelte component wired into CoreUIBar.

### Config field reference

| Field | Required | Description |
|-------|----------|-------------|
| `ariaLabel` | yes | Accessible label, also shown in tooltip |
| `icon` | yes | Namespaced icon name (see Icon section) |
| `modes` | yes | Array of mode names or `["*"]` for all modes |
| `meta` | no | Passed as props to `<Icon>` (e.g. `{ "strokeWeight": 2, "scale": 1.1 }`) |
| `sidepanel` | no | If set, button toggles this side panel tab (no custom component needed) |
| `trigger` | no | `"button"` or `"command"` — used for command menu special handling |
| `label` | no | Display label (used in dropdown headers) |
| `menuWidth` | no | CSS width for dropdown content (e.g. `"260px"`) |
| `actions` | no | Array of action items for dropdown menus |
| `excludeRoutes` | no | Array of route patterns where this menu is hidden |

### Step 2: Create the Svelte component (if not a sidepanel button)

Create `packages/core/src/MyFeatureButton.svelte` following this template:

```svelte
<script lang="ts">
  import { onMount } from 'svelte'
  import { TriggerButton } from '$lib/components/ui/trigger-button/index.js'
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js'
  import Icon from './svelte-plugin-ui/components/Icon.svelte'

  interface Props {
    config?: { ariaLabel?: string; icon?: string; meta?: Record<string, any> }
    basePath?: string
    tabindex?: number
  }

  let { config = {}, basePath = '/', tabindex = -1 }: Props = $props()
  let menuOpen = $state(false)

  // ... your logic here
</script>

<DropdownMenu.Root bind:open={menuOpen}>
  <DropdownMenu.Trigger>
    {#snippet child({ props })}
      <TriggerButton
        active={menuOpen}
        size="icon-xl"
        aria-label={config.ariaLabel || 'My Feature'}
        {tabindex}
        {...props}
      >
        <Icon name={config.icon || 'primer/gear'} size={16} {...(config.meta || {})} />
      </TriggerButton>
    {/snippet}
  </DropdownMenu.Trigger>

  <DropdownMenu.Content side="top" align="end" sideOffset={16} class="min-w-[200px]">
    <DropdownMenu.Label>My Feature</DropdownMenu.Label>
    <!-- menu items here -->
  </DropdownMenu.Content>
</DropdownMenu.Root>
```

#### Key patterns

- **Props**: always accept `config`, `basePath`, and `tabindex`
- **TriggerButton**: use `size="icon-xl"`, pass `{tabindex}` and `{...props}` from the snippet
- **Icon**: use `config.icon` with a fallback, spread `config.meta` for icon customization
- **DropdownMenu.Content**: always use `side="top"` (menus open upward), `align="end"`, `sideOffset={16}`
- **Conditional rendering**: if the button should hide when irrelevant, wrap the entire template in `{#if condition}...{/if}`

#### Available DropdownMenu item types

| Component | Use case |
|-----------|----------|
| `DropdownMenu.Item` | Basic clickable item |
| `DropdownMenu.CheckboxItem` | Toggle item with checkmark |
| `DropdownMenu.RadioGroup` + `DropdownMenu.RadioItem` | Single-select group with check indicator |
| `DropdownMenu.Label` | Section header |
| `DropdownMenu.Separator` | Visual divider |
| `DropdownMenu.Sub` + `DropdownMenu.SubTrigger` + `DropdownMenu.SubContent` | Nested submenu |

### Step 3: Wire into CoreUIBar.svelte

Three changes needed in `packages/core/src/CoreUIBar.svelte`:

**1. Add state variable for the dynamically imported component:**

```ts
let MyFeatureButton: any = $state(null)
```

**2. Add visibility filter in `visibleMenus`:**

```ts
if (menu.key === 'my-feature') return !!MyFeatureButton
```

**3. Add dynamic import in `onMount`:**

```ts
try {
  const mod = await import('./MyFeatureButton.svelte')
  MyFeatureButton = mod.default
} catch {}
```

**4. Add rendering branch in the template `{#each}` block:**

```svelte
{:else if menu.key === 'my-feature'}
  <MyFeatureButton config={menu} {basePath} tabindex={getTabindex(i)} />
```

### Important: Data index timing

The storyboard data index (`virtual:storyboard-data-index`) is seeded by the React app, which initializes *after* the Svelte CoreUIBar mounts. If your component reads from the data index (flows, objects, records), **do not call data functions at component creation time**. Use `onMount` with a retry:

```ts
onMount(() => {
  refreshData()
  if (needsRetry()) {
    const timer = setTimeout(refreshData, 500)
    return () => clearTimeout(timer)
  }
})
```

Also refresh data in `onOpenChange` so the dropdown always shows current state.

## Icon namespaces

The `Icon.svelte` component supports multiple icon sources via namespaced names:

| Prefix | Source | Style | Example |
|--------|--------|-------|---------|
| `primer/` | Primer Octicons | fill | `primer/repo`, `primer/gear`, `primer/comment` |
| `feather/` | Feather Icons | stroke | `feather/fast-forward`, `feather/tablet` |
| `iconoir/` | Iconoir (registered) | stroke | `iconoir/plus-circle`, `iconoir/square-dashed` |
| *(none)* | Custom overrides | fill | `folder`, `folder-open` |

Icon meta props: `strokeWeight`, `scale`, `rotate`, `flipX`, `offsetX`, `offsetY`.

## Menu visibility

Menus can be hidden via:

- **Mode filtering**: `"modes": ["inspect"]` — only visible in inspect mode
- **Route exclusion**: `"excludeRoutes": ["/viewfinder"]` — hidden on specific routes
- **UI config**: `storyboard.config.json` → `ui.hide.menus: ["my-feature"]`
- **Conditional logic**: custom visibility checks in the `visibleMenus` derived block

## Existing menu buttons for reference

| Key | Component | Behavior |
|-----|-----------|----------|
| `command` | `CommandMenu.svelte` | Always rightmost, special handling, opens command palette |
| `create` | `CreateMenuButton.svelte` | Workshop feature launcher, opens overlay panels |
| `flows` | `FlowSwitcherButton.svelte` | Lists prototype flows, switches via RadioGroup |
| `comments` | `CommentsMenuButton.svelte` | Auth-aware, toggle comments mode |
| `docs` | *(sidepanel)* | Toggles docs side panel |
| `inspector` | *(sidepanel)* | Toggles inspector side panel |
