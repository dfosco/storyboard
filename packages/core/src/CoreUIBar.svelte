<!--
  CoreUIBar — unified floating button bar for the storyboard devtools.

  Fixed bottom-right. Always shows the ⌘ command button (rightmost).
  Mode-specific buttons appear to its left at a smaller size.
  Hue follows the active mode's collar color via --trigger-* CSS custom
  properties set in modes.css.

  Initializes the command action registry and registers core handlers.
-->

<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import './core-ui-colors.css'
  import CommandMenu from './CommandMenu.svelte'
  import { TriggerButton } from './lib/components/ui/trigger-button/index.js'
  import * as Tooltip from './lib/components/ui/tooltip/index.js'
  import Icon from './svelte-plugin-ui/components/Icon.svelte'
  import { modeState } from './svelte-plugin-ui/stores/modeStore.js'
  import { sidePanelState, togglePanel } from './stores/sidePanelStore.js'
  import { initCommandActions, registerCommandAction, getActionChildren, isExcludedByRoute, setRoutingBasePath } from './commandActions.js'
  import { isMenuHidden } from './uiConfig.js'
  import defaultToolbarConfig from '../toolbar.config.json'

  interface Props { basePath?: string; toolbarConfig?: any; customHandlers?: Record<string, () => Promise<any>> }
  let { basePath = '/', toolbarConfig, customHandlers = {} }: Props = $props()

  // Use provided config (merged by mountStoryboardCore) or fall back to defaults
  const config = $derived(toolbarConfig || defaultToolbarConfig)

  let visible = $state(true)
  // Hide the entire toolbar when loaded inside a prototype embed iframe
  const isEmbed = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('_sb_embed')
  let commandMenuOpen = $state(false)
  let toolComponents: Record<string, any> = $state({})
  let toolData: Record<string, any> = $state({})
  let navVersion = $state(0)
  let origPushState: typeof history.pushState
  let origReplaceState: typeof history.replaceState
  let bumpNav: () => void
  let SidePanel: any = $state(null)
  let toolbarEl: HTMLElement | null = $state(null)
  let canvasActive = $state(false)
  let activeCanvasName = $state('')
  let canvasZoom = $state(100)

  // Roving tabindex: only one button in the toolbar is tabbable at a time
  let activeToolbarIndex = $state(-1)

  const isLocalDev = typeof window !== 'undefined' && (window as any).__SB_LOCAL_DEV__ === true

  /**
   * Resolve a handler reference to a module loader function.
   * Format: "core:name" → core registry, "custom:name" → client handlers
   */
  function resolveHandlerModule(
    ref: string,
    coreModules: Record<string, Function>,
    custom: Record<string, () => Promise<any>>
  ): Function | null {
    const colonIdx = ref.indexOf(':')
    if (colonIdx === -1) return coreModules[ref] || null
    const prefix = ref.slice(0, colonIdx)
    const name = ref.slice(colonIdx + 1)
    if (prefix === 'core') return coreModules[name] || null
    if (prefix === 'custom') return custom[name] || null
    return null
  }

  // Resolve tools → menus compatibility layer.
  // New config uses `tools` (flat map with toolbar target); legacy uses `menus`.
  // When `tools` exists, derive the menus-compatible structures from it.
  function resolveMenus(cfg: any): Record<string, any> {
    if (cfg.tools) {
      const result: Record<string, any> = {}
      for (const [key, tool] of Object.entries(cfg.tools as Record<string, any>)) {
        if (tool.surface === 'command-list' || tool.surface === 'canvas-toolbar') continue
        // Map new render/toolbar fields to legacy menu fields for rendering compat
        const menu: any = { ...tool }
        if (tool.render === 'menu' && tool.handler) {
          menu.action = tool.handler
        }
        result[key] = menu
      }
      return result
    }
    return cfg.menus || {}
  }

  function resolveCommandConfig(cfg: any): any {
    if (cfg.command) {
      // Build command menu config from new schema
      const actions: any[] = []
      actions.push({ type: 'header', label: 'Command Menu' })

      // Add command-list tools as actions
      if (cfg.tools) {
        for (const [, tool] of Object.entries(cfg.tools as Record<string, any>)) {
          if (tool.surface !== 'command-list') continue
          actions.push({
            id: tool.handler || `core/${tool.label?.toLowerCase().replace(/\s+/g, '-')}`,
            label: tool.label,
            type: tool.render || 'default',
            url: tool.url || null,
            modes: tool.modes || ['*'],
          })
        }
      }

      return {
        ariaLabel: 'Command Menu',
        trigger: 'command',
        icon: cfg.command.icon,
        meta: cfg.command.meta,
        default: true,
        modes: ['*'],
        actions,
      }
    }
    return cfg.menus?.command || null
  }

  const commandMenuConfig = $derived(
    isMenuHidden('command') ? null : resolveCommandConfig(config)
  )
  const shortcutsConfig = $derived({
    ...((config as any).shortcuts || {}),
    ...(config.command?.shortcut ? { openCommandMenu: config.command.shortcut } : {}),
  })

  // Build ordered menu list from JSON key order (excluding command, which is always rightmost)
  const allMenus = $derived(resolveMenus(config))
  const orderedMenus = $derived(Object.entries(allMenus)
    .filter(([key]) => key !== 'command')
    .filter(([key]) => !isMenuHidden(key))
    .filter(([, menu]) => !menu.localOnly || isLocalDev)
    .map(([key, menu]) => ({ key, ...menu })))

  // Discover menus with sidepanel property
  const sidepanelMenus = $derived(orderedMenus.filter(menu => menu.sidepanel))

  // Canvas toolbar tools — only visible when a canvas page is active
  const canvasMenus = $derived(
    config.tools
      ? Object.entries(config.tools as Record<string, any>)
          .filter(([, tool]) => tool.surface === 'canvas-toolbar')
          .filter(([, tool]) => !tool.localOnly || isLocalDev)
          .map(([key, tool]) => ({ key, ...tool }))
      : []
  )

  function menuVisibleInMode(menu: any, mode: string): boolean {
    if (!menu?.modes) return false
    if (isExcludedByRoute(menu)) return false
    return menu.modes.includes('*') || menu.modes.includes(mode)
  }

  // Menus that are visible in the current mode, reversed so JSON top→bottom = right→left
  const visibleMenus = $derived(
    orderedMenus
      .filter(menu => {
        void navVersion
        if (menu.render === 'separator') return true
        if (!menuVisibleInMode(menu, $modeState.mode)) return false
        if (menu.render === 'sidepanel') return true
        // For tools with components, check if loaded
        if (!toolComponents[menu.key]) return false
        // For action-menu tools, check if there are children
        const actionId = menu.handler || menu.action
        if (actionId && menu.render === 'menu') {
          return getActionChildren(actionId).length > 0
        }
        return true
      })
      .reverse()
  )

  // Clean separators: remove leading, trailing, and consecutive
  const cleanedMenus = $derived.by(() => {
    const result: typeof visibleMenus = []
    for (const item of visibleMenus) {
      if (item.render === 'separator') {
        // Skip if first item or previous was also a separator
        if (result.length === 0 || result[result.length - 1].render === 'separator') continue
        result.push(item)
      } else {
        result.push(item)
      }
    }
    // Remove trailing separator
    while (result.length > 0 && result[result.length - 1].render === 'separator') result.pop()
    return result
  })

  // Total toolbar item count (visible menus + command menu if present)
  const toolbarItemCount = $derived(
    cleanedMenus.filter(m => m.render !== 'separator').length + (commandMenuConfig ? 1 : 0)
  )

  // Command menu is always the last item (rightmost)
  const commandMenuIndex = $derived(
    commandMenuConfig ? cleanedMenus.filter(m => m.render !== 'separator').length : -1
  )

  function getTabindex(index: number): number {
    if (activeToolbarIndex < 0) {
      // No item focused yet — make the last item (command menu) tabbable as default
      return index === toolbarItemCount - 1 ? 0 : -1
    }
    return index === activeToolbarIndex ? 0 : -1
  }

  function focusToolbarItem(index: number) {
    activeToolbarIndex = index
    if (!toolbarEl) return
    const buttons = toolbarEl.querySelectorAll<HTMLElement>('[data-slot="button"]')
    buttons[index]?.focus()
  }

  function handleToolbarKeydown(e: KeyboardEvent) {
    if (toolbarItemCount === 0) return
    const current = activeToolbarIndex < 0 ? toolbarItemCount - 1 : activeToolbarIndex

    if (e.key === 'ArrowRight') {
      e.preventDefault()
      focusToolbarItem((current + 1) % toolbarItemCount)
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      focusToolbarItem((current - 1 + toolbarItemCount) % toolbarItemCount)
    } else if (e.key === 'Home') {
      e.preventDefault()
      focusToolbarItem(0)
    } else if (e.key === 'End') {
      e.preventDefault()
      focusToolbarItem(toolbarItemCount - 1)
    } else if (e.key === 'ArrowDown') {
      // Menus open upward — block Bits UI's default ArrowDown-to-open
      e.preventDefault()
      e.stopPropagation()
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      // If a menu is already open, focus its last item
      const openContent = document.querySelector<HTMLElement>('[data-slot="dropdown-menu-content"]')
      if (openContent) {
        const items = openContent.querySelectorAll<HTMLElement>('[role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"]')
        if (items.length > 0) items[items.length - 1].focus()
        return
      }
      // Otherwise, open the focused button's dropdown (if it has one)
      const focusedBtn = toolbarEl?.querySelector<HTMLElement>('[data-slot="button"]:focus')
      if (focusedBtn?.getAttribute('aria-haspopup')) {
        focusedBtn.click()
        // After menu renders, focus its last item
        requestAnimationFrame(() => {
          const content = document.querySelector<HTMLElement>('[data-slot="dropdown-menu-content"]')
          if (content) {
            const items = content.querySelectorAll<HTMLElement>('[role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"]')
            if (items.length > 0) items[items.length - 1].focus()
          }
        })
      }
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    const hideKey = shortcutsConfig.hideChrome?.key || '.'
    const openKey = shortcutsConfig.openCommandMenu?.key

    if (e.key === hideKey && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      visible = !visible
      document.documentElement.classList.toggle('storyboard-chrome-hidden', !visible)
    }
    // Configurable shortcut to open the command menu (works even when hidden)
    if (openKey && e.key === openKey && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      commandMenuOpen = !commandMenuOpen
    }
    // Config-driven tool shortcuts (e.g. Cmd+D for docs, Cmd+I for inspector)
    for (const menu of cleanedMenus) {
      const shortcut = menu.shortcut
      if (!shortcut?.key) continue
      if (e.key === shortcut.key && (e.metaKey || e.ctrlKey) && !e.shiftKey) {
        if (menu.sidepanel) {
          e.preventDefault()
          togglePanel(menu.sidepanel)
        }
        break
      }
    }
  }

  onMount(async () => {
    window.addEventListener('keydown', handleKeydown)
    setRoutingBasePath(basePath)

    // Re-evaluate action menus on SPA navigation
    bumpNav = () => { navVersion++ }
    window.addEventListener('popstate', bumpNav)
    origPushState = history.pushState.bind(history)
    history.pushState = (...args: any[]) => { origPushState(...args); bumpNav() }
    origReplaceState = history.replaceState.bind(history)
    history.replaceState = (...args: any[]) => { origReplaceState(...args); bumpNav() }

    // Seed the command action registry from config
    if (commandMenuConfig) {
      initCommandActions(commandMenuConfig)
    }

    // Register sidepanel toggle actions
    for (const menu of sidepanelMenus) {
      registerCommandAction(`core:${menu.key}`, () => {
        togglePanel(menu.sidepanel)
      })
    }

    // Load all tool modules from the registry
    const { coreHandlers } = await import('./tools/registry.js')
    const toolConfigs = config.tools || {}
    const ctx = { basePath, showFlowInfoDialog }

    for (const [toolId, toolConfig] of Object.entries(toolConfigs as Record<string, any>)) {
      // Skip non-tool entries (separators have no handler)
      if (toolConfig.render === 'separator') continue

      // Resolve handler module via core:/custom: prefix
      const handlerRef = toolConfig.handler || `core:${toolId}`
      const loadModule = resolveHandlerModule(handlerRef, coreHandlers, customHandlers)
      if (!loadModule) continue

      try {
        const mod = await loadModule()
        const toolCtx = { ...ctx, config: toolConfig }

        // Run guard — skip if guard returns false
        if (mod.guard) {
          const ok = await mod.guard(toolCtx)
          if (!ok) continue
        }

        // Run setup
        if (mod.setup) {
          const setupResult = await mod.setup(toolCtx)
          if (setupResult) {
            toolData[toolId] = setupResult
          }
        }

        // Register handler as command action
        if (mod.handler) {
          const handlerResult = await mod.handler(toolCtx)
          const actionId = toolConfig.handler || `core:${toolId}`
          // Store handler result in toolData for component access
          if (handlerResult && !handlerResult.getChildren) {
            toolData[toolId] = { ...(toolData[toolId] || {}), ...handlerResult }
          }
          registerCommandAction(actionId, handlerResult)
        }

        // Load component
        if (mod.component) {
          const component = await mod.component()
          toolComponents[toolId] = component
        }
      } catch { /* tool failed to load — skip gracefully */ }
    }

    // Load side panel component
    try {
      if (sidepanelMenus.length > 0) {
        const mod = await import('./SidePanel.svelte')
        SidePanel = mod.default
      }
    } catch {}

    // Listen for canvas mount/unmount events (React↔Svelte bridge)
    document.addEventListener('storyboard:canvas:mounted', handleCanvasMounted)
    document.addEventListener('storyboard:canvas:unmounted', handleCanvasUnmounted)
    document.addEventListener('storyboard:canvas:zoom-changed', handleZoomChanged)
  })

  onDestroy(() => {
    window.removeEventListener('keydown', handleKeydown)
    if (bumpNav) window.removeEventListener('popstate', bumpNav)
    if (origPushState) history.pushState = origPushState
    if (origReplaceState) history.replaceState = origReplaceState
    document.removeEventListener('storyboard:canvas:mounted', handleCanvasMounted)
    document.removeEventListener('storyboard:canvas:unmounted', handleCanvasUnmounted)
    document.removeEventListener('storyboard:canvas:zoom-changed', handleZoomChanged)
  })

  function handleCanvasMounted(e: Event) {
    canvasActive = true
    const detail = (e as CustomEvent).detail
    activeCanvasName = detail?.name || ''
    canvasZoom = detail?.zoom ?? 100
  }

  function handleCanvasUnmounted() {
    canvasActive = false
    activeCanvasName = ''
    canvasZoom = 100
  }

  function handleZoomChanged(e: Event) {
    canvasZoom = (e as CustomEvent).detail?.zoom ?? canvasZoom
  }

  // Flow info dialog state — driven by core/show-flow-info action
  let flowDialogOpen = $state(false)
  let flowName = $state('default')
  let flowJson = $state('')
  let flowError: string | null = $state(null)

  function showFlowInfoDialog(name: string, json: string, error: string | null) {
    flowName = name
    flowJson = json
    flowError = error
    flowDialogOpen = true
  }
</script>

{#if !isEmbed}
  {#if visible && canvasActive && canvasMenus.length > 0}
    <div
      class="fixed bottom-6 left-6 z-[9999] font-sans flex items-center gap-3"
      role="toolbar"
      aria-label="Canvas toolbar"
    >
      {#each canvasMenus as canvasTool (canvasTool.key)}
        {#if toolComponents[canvasTool.key]}
          <Tooltip.Root>
            <Tooltip.Trigger>
              <svelte:component
                this={toolComponents[canvasTool.key]}
                config={canvasTool}
                data={toolData[canvasTool.key]}
                canvasName={activeCanvasName}
                zoom={canvasZoom}
                tabindex={0}
              />
            </Tooltip.Trigger>
            <Tooltip.Content side="top">{canvasTool.ariaLabel || canvasTool.key}</Tooltip.Content>
          </Tooltip.Root>
        {/if}
      {/each}
    </div>
  {/if}
  <div
    id="storyboard-controls"
    class="fixed bottom-6 right-6 z-[9999] font-sans flex items-end gap-3"
    data-core-ui-bar
    role="toolbar"
    tabindex="0"
    aria-label="Storyboard controls"
    onkeydown={handleToolbarKeydown}
    bind:this={toolbarEl}
  >
    {#if visible}
      {#each cleanedMenus as menu, i (menu.key)}
        {#if menu.render === 'separator'}
          <div class="toolbar-separator" aria-hidden="true"></div>
        {:else}
          <Tooltip.Root>
            <Tooltip.Trigger>
              {#if menu.render === 'sidepanel'}
                <TriggerButton
                  active={$sidePanelState.open && $sidePanelState.activeTab === menu.sidepanel}
                  size="icon-xl"
                  aria-label={menu.ariaLabel || menu.key}
                  tabindex={getTabindex(i)}
                  onfocus={() => { activeToolbarIndex = i }}
                  onclick={() => togglePanel(menu.sidepanel)}
                >
                  <Icon name={menu.icon || menu.key} size={16} {...(menu.meta || {})} />
                </TriggerButton>
              {:else if toolComponents[menu.key]}
                <svelte:component
                  this={toolComponents[menu.key]}
                  config={menu}
                  data={toolData[menu.key]}
                  tabindex={getTabindex(i)}
                />
              {/if}
            </Tooltip.Trigger>
            <Tooltip.Content side="top">{menu.ariaLabel || menu.key}</Tooltip.Content>
          </Tooltip.Root>
        {/if}
      {/each}
    {/if}
    {#if commandMenuConfig}
      <div class={visible || commandMenuOpen ? '' : 'default-button-dimmed'}>
        <Tooltip.Root>
          <Tooltip.Trigger>
            <CommandMenu {basePath} bind:open={commandMenuOpen} bind:flowDialogOpen {flowName} {flowJson} {flowError} shortcuts={shortcutsConfig} tabindex={getTabindex(commandMenuIndex)} icon={commandMenuConfig.icon} iconMeta={commandMenuConfig.meta} />
          </Tooltip.Trigger>
          <Tooltip.Content side="top">Command Menu</Tooltip.Content>
        </Tooltip.Root>
      </div>
    {/if}
  </div>
{/if}

{#if !isEmbed && SidePanel}
  <SidePanel onClose={() => focusToolbarItem(activeToolbarIndex < 0 ? toolbarItemCount - 1 : activeToolbarIndex)} />
{/if}

<style>
  .toolbar-separator {
    width: 1px;
    height: 20px;
    background: var(--trigger-border, var(--color-slate-400));
    opacity: 0.4;
    flex-shrink: 0;
  }

  .default-button-dimmed {
    opacity: 0.3;
    transition: opacity 200ms;
  }

  .default-button-dimmed:hover,
  .default-button-dimmed:focus-within {
    opacity: 1;
  }
</style>

