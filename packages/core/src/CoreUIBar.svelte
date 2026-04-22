<!--
  CoreUIBar — unified floating button bar for the storyboard devtools.

  Fixed bottom-right. Always shows the ⌘ command button (rightmost).
  Mode-specific buttons appear to its left at a smaller size.
  Hue follows the active mode's collar color via --trigger-* CSS custom
  properties set in modes.css.

  Initializes the command action registry and registers core handlers.
-->

<script lang="ts">
  import { onMount, onDestroy, untrack } from 'svelte'
  import './core-ui-colors.css'
  import CommandPalette from './CommandPalette.svelte'
  import * as Panel from './lib/components/ui/panel/index.js'
  import PwaInstallBanner from './PwaInstallBanner.svelte'
  import { TriggerButton } from './lib/components/ui/trigger-button/index.js'
  import * as Tooltip from './lib/components/ui/tooltip/index.js'
  import Icon from './svelte-plugin-ui/components/Icon.svelte'
  import { modeState } from './svelte-plugin-ui/stores/modeStore.js'
  import { sidePanelState, togglePanel } from './stores/sidePanelStore.js'
  import { initCommandActions, registerCommandAction, getActionChildren, hasChildrenProvider, isExcludedByRoute, setRoutingBasePath, setDynamicActions, clearDynamicActions } from './commandActions.js'
  import { isMobile, subscribeToMobile } from './mobileViewport.js'
  import { isMenuHidden } from './uiConfig.js'
  import { subscribeToToolbarConfig, getToolbarConfig } from './toolbarConfigStore.js'
  import { initToolbarToolStates, getToolbarToolState, isToolbarToolLocalOnly, subscribeToToolbarToolStates } from './toolStateStore.js'
  import defaultToolbarConfig from '../toolbar.config.json'

  interface Props { basePath?: string; toolbarConfig?: any; customHandlers?: Record<string, () => Promise<any>> }
  let { basePath = '/', toolbarConfig, customHandlers = {} }: Props = $props()

  // Reactive toolbar config — subscribes to the config store for prototype overrides.
  // Falls back to the prop (for backward compat) or the bundled defaults.
  let storeConfig = $state(getToolbarConfig())
  let unsubConfig: (() => void) | null = null

  $effect(() => {
    unsubConfig = subscribeToToolbarConfig((cfg: any) => { storeConfig = cfg })
    return () => { if (unsubConfig) unsubConfig() }
  })

  $effect(() => {
    const unsub = subscribeToToolbarToolStates(() => { toolStateVersion++ })
    return unsub
  })

  // Use store config if available, otherwise fall back to prop or defaults
  const config = $derived(
    (storeConfig && Object.keys(storeConfig).length > 0)
      ? storeConfig
      : (toolbarConfig || defaultToolbarConfig)
  )

  // Re-seed tool states whenever config changes (e.g. prototype override on navigation)
  $effect(() => {
    const tools = config.tools || {}
    // untrack so the synchronous _notify() → toolStateVersion++ inside
    // initToolbarToolStates doesn't get tracked as a dependency of this effect
    untrack(() => initToolbarToolStates(tools, { isLocalDev }))
  })

  let visible = $state(true)
  let peeking = $state(false)  // Temporary reveal when clicking command button while hidden
  // Hide the entire toolbar when loaded inside a prototype embed iframe
  const isEmbed = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('_sb_embed')
  let commandMenuOpen = $state(false)
  let toolComponents: Record<string, any> = $state({})
  let toolData: Record<string, any> = $state({})
  let navVersion = $state(0)
  let origPushState: typeof history.pushState
  let origReplaceState: typeof history.replaceState
  let bumpNav: () => void
  let chromeObserver: MutationObserver | null = null
  let SidePanel: any = $state(null)
  let toolbarEl: HTMLElement | null = $state(null)
  let canvasActive = $state(false)
  let activeCanvasId = $state('')
  let canvasZoom = $state(100)
  let toolStateVersion = $state(0)

  // Mobile viewport state — on narrow screens, toolbar tools move into the command menu
  let isMobileState = $state(isMobile())
  let unsubMobile: (() => void) | null = null
  let mobileActionsRegistered = false

  // Roving tabindex: only one button in the toolbar is tabbable at a time
  let activeToolbarIndex = $state(-1)

  const isLocalDev = typeof window !== 'undefined' && (window as any).__SB_LOCAL_DEV__ === true && !new URLSearchParams(window.location.search).has('prodMode')

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
        result[key] = { ...menu, _toolId: key }
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
        for (const [toolKey, tool] of Object.entries(cfg.tools as Record<string, any>)) {
          if (tool.surface !== 'command-list') continue
          if (tool.render === 'separator') {
            actions.push({ type: 'separator' })
            continue
          }
          actions.push({
            id: tool.handler || `core/${tool.label?.toLowerCase().replace(/\s+/g, '-')}`,
            label: tool.label || tool.ariaLabel,
            type: tool.render || 'default',
            url: tool.url || null,
            modes: tool.modes || ['*'],
            toolKey,
            localOnly: !tool.prod,
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
    .filter(([key]) => {
      void toolStateVersion
      return getToolbarToolState(key) !== 'disabled'
    })
    .map(([key, menu]) => ({ key, ...menu })))

  // Discover menus with sidepanel property
  const sidepanelMenus = $derived(orderedMenus.filter(menu => menu.sidepanel))

  // Canvas toolbar tools — only visible when a canvas page is active
  const canvasMenus = $derived(
    config.tools
      ? Object.entries(config.tools as Record<string, any>)
          .filter(([, tool]) => tool.surface === 'canvas-toolbar')
          .filter(([, tool]) => tool.prod || isLocalDev)
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
        void toolStateVersion
        const toolState = getToolbarToolState(menu.key)
        if (toolState === 'hidden') return false
        if (menu.render === 'separator') return true
        if (!menuVisibleInMode(menu, $modeState.mode)) return false
        if (menu.render === 'sidepanel') return true
        // For tools with components, check if loaded
        if (!toolComponents[menu.key]) return false
        // For action-menu tools (those with a getChildren handler), hide when empty.
        // Custom-component menus (e.g. ThemeMenuButton) render their own content.
        const actionId = menu.handler || menu.action
        if (actionId && menu.render === 'menu' && hasChildrenProvider(actionId)) {
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

  // Peek mode — temporarily reveal toolbars when clicking command button while hidden.
  // Clicking outside the toolbar exits peek mode (re-hides).
  function enterPeekMode() {
    visible = true
    peeking = true
    document.documentElement.classList.remove('storyboard-chrome-hidden')
    // Defer so the current click doesn't immediately trigger the outside listener
    requestAnimationFrame(() => {
      window.addEventListener('pointerdown', peekOutsideHandler, { capture: true })
    })
  }

  function exitPeekMode() {
    peeking = false
    visible = false
    document.documentElement.classList.add('storyboard-chrome-hidden')
    window.removeEventListener('pointerdown', peekOutsideHandler, { capture: true })
  }

  function peekOutsideHandler(e: PointerEvent) {
    const bar = document.querySelector('[data-core-ui-bar]')
    const canvasToolbar = document.querySelector('[aria-label="Canvas toolbar"]')
    if (bar?.contains(e.target as Node) || canvasToolbar?.contains(e.target as Node)) return
    exitPeekMode()
  }

  function handleKeydown(e: KeyboardEvent) {
    const hideKey = shortcutsConfig.hideChrome?.key || '.'
    const openKey = shortcutsConfig.openCommandMenu?.key

    if (e.key === hideKey && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      if (peeking) exitPeekMode()
      else {
        visible = !visible
        document.documentElement.classList.toggle('storyboard-chrome-hidden', !visible)
      }
    }
    // Configurable shortcut to open the command menu (works even when hidden)
    if (openKey && e.key === openKey && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      document.dispatchEvent(new CustomEvent('storyboard:toggle-palette'))
    }
    // Config-driven tool shortcuts (e.g. Cmd+D for docs, Cmd+I for inspector)
    for (const menu of cleanedMenus) {
      const shortcut = menu.shortcut
      if (!shortcut?.key) continue
      if (e.key === shortcut.key && (e.metaKey || e.ctrlKey) && !e.shiftKey) {
        const toolState = getToolbarToolState(menu.key)
        // Inactive and disabled tools don't respond to shortcuts
        if (toolState === 'inactive' || toolState === 'disabled') break
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

    // Sync visible state when storyboard-chrome-hidden is toggled externally
    // (e.g. from command palette or other UI)
    chromeObserver = new MutationObserver(() => {
      const hidden = document.documentElement.classList.contains('storyboard-chrome-hidden')
      if (visible === !hidden) return
      visible = !hidden
    })
    chromeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })

    // Re-evaluate action menus and prototype toolbar config on SPA navigation
    const { getPrototypeMetadata } = await import('./loader.js')
    const { setPrototypeToolbarConfig, clearPrototypeToolbarConfig } = await import('./toolbarConfigStore.js')
    const { setOverrides, clearOverrides } = await import('./configStore.js')

    function syncPrototypeToolbar() {
      let pathname = window.location.pathname
      const base = basePath.replace(/\/+$/, '')
      if (base && pathname.startsWith(base)) pathname = pathname.slice(base.length)
      const firstSegment = pathname.replace(/^\//, '').split('/')[0] || null
      if (firstSegment) {
        const meta = getPrototypeMetadata(firstSegment)

        // Toolbar overrides (legacy store + unified store)
        if (meta?.toolbarConfig) {
          setPrototypeToolbarConfig(meta.toolbarConfig)
          setOverrides('toolbar', meta.toolbarConfig)
        } else {
          clearPrototypeToolbarConfig()
          clearOverrides('toolbar')
        }

        // Other domain overrides (unified store only)
        const domainMap = [
          ['commandPaletteConfig', 'commandPalette'],
          ['widgetsConfig', 'widgets'],
          ['pasteConfig', 'paste'],
        ]
        for (const [metaKey, domain] of domainMap) {
          if (meta?.[metaKey]) {
            setOverrides(domain, meta[metaKey])
          } else {
            clearOverrides(domain)
          }
        }
      } else {
        clearPrototypeToolbarConfig()
        clearOverrides('toolbar')
        clearOverrides('commandPalette')
        clearOverrides('widgets')
        clearOverrides('paste')
      }
    }

    bumpNav = () => { navVersion++; syncPrototypeToolbar(); syncMobileActions() }
    window.addEventListener('popstate', bumpNav)
    origPushState = history.pushState.bind(history)
    history.pushState = (...args: any[]) => { origPushState(...args); bumpNav() }
    origReplaceState = history.replaceState.bind(history)
    history.replaceState = (...args: any[]) => { origReplaceState(...args); bumpNav() }

    // Apply prototype toolbar config for the initial route
    syncPrototypeToolbar()

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

      // Skip disabled tools — don't load their modules at all
      if (getToolbarToolState(toolId) === 'disabled') continue

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
          const component = await mod.component(toolConfig.render)
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
    document.addEventListener('storyboard:canvas:status', handleCanvasMounted)
    syncCanvasBridgeState()

    // Subscribe to mobile viewport changes and sync mobile command actions
    syncMobileActions()
    unsubMobile = subscribeToMobile((mobile: boolean) => {
      isMobileState = mobile
      syncMobileActions()
    })
  })

  onDestroy(() => {
    window.removeEventListener('keydown', handleKeydown)
    if (bumpNav) window.removeEventListener('popstate', bumpNav)
    if (origPushState) history.pushState = origPushState
    if (origReplaceState) history.replaceState = origReplaceState
    if (unsubMobile) unsubMobile()
    clearDynamicActions('mobile-toolbar')
    chromeObserver?.disconnect()
    window.removeEventListener('pointerdown', peekOutsideHandler, { capture: true })
    document.removeEventListener('storyboard:canvas:mounted', handleCanvasMounted)
    document.removeEventListener('storyboard:canvas:unmounted', handleCanvasUnmounted)
    document.removeEventListener('storyboard:canvas:zoom-changed', handleZoomChanged)
    document.removeEventListener('storyboard:canvas:status', handleCanvasMounted)
  })

  function handleCanvasMounted(e: Event) {
    canvasActive = true
    const detail = (e as CustomEvent).detail
    activeCanvasId = detail?.canvasId || detail?.name || ''
    canvasZoom = detail?.zoom ?? 100
    syncMobileActions()
  }

  function handleCanvasUnmounted() {
    canvasActive = false
    activeCanvasId = ''
    canvasZoom = 100
    syncMobileActions()
  }

  function handleZoomChanged(e: Event) {
    if (!canvasActive) canvasActive = true
    canvasZoom = (e as CustomEvent).detail?.zoom ?? canvasZoom
  }

  function syncCanvasBridgeState() {
    if (typeof window === 'undefined') return
    const state = (window as any).__storyboardCanvasBridgeState
    if (state && typeof state === 'object') {
      canvasActive = state.active === true
      activeCanvasId = state.canvasId || state.name || ''
      canvasZoom = typeof state.zoom === 'number' ? state.zoom : 100
    }
    if (!canvasActive) {
      document.dispatchEvent(new CustomEvent('storyboard:canvas:status-request'))
    }
  }

  /**
   * Sync mobile command actions — when in mobile viewport, toolbar tools
   * become dynamic command actions in the ⌘ menu.
   */
  async function syncMobileActions() {
    if (!isMobileState) {
      if (mobileActionsRegistered) {
        clearDynamicActions('mobile-toolbar')
        mobileActionsRegistered = false
      }
      return
    }

    const actions: any[] = []
    const handlers: Record<string, any> = {}
    const toolConfigs = config.tools || {}

    // Main-toolbar tools → command actions
    actions.push({ type: 'header', label: 'Tools', id: '_mobile_header' })

    for (const [key, tool] of Object.entries(toolConfigs as Record<string, any>)) {
      if (tool.surface !== 'main-toolbar') continue
      if (tool.render === 'separator') continue
      if (!tool.prod && !isLocalDev) continue
      if (getToolbarToolState(key) === 'disabled') continue
      if (isExcludedByRoute(tool)) continue

      // Always use mobile:-prefixed ids to avoid clobbering shared desktop handlers
      const mobileId = `mobile:${key}`
      const desktopActionId = tool.handler || `core:${key}`

      // Menu tools with getChildren → submenu (delegate to existing desktop handler)
      if (tool.render === 'menu' && hasChildrenProvider(desktopActionId)) {
        actions.push({
          id: mobileId,
          label: tool.label || tool.ariaLabel,
          type: 'submenu',
          modes: tool.modes || ['*'],
          excludeRoutes: tool.excludeRoutes,
          toolKey: key,
          localOnly: !tool.prod,
        })
        handlers[mobileId] = {
          getChildren: () => getActionChildren(desktopActionId),
        }
      }
      // Sidepanel tools → default action (toggle panel)
      else if (tool.render === 'sidepanel') {
        actions.push({
          id: mobileId,
          label: tool.ariaLabel || tool.label || key,
          type: 'default',
          modes: tool.modes || ['*'],
          excludeRoutes: tool.excludeRoutes,
          toolKey: key,
          localOnly: !tool.prod,
        })
        handlers[mobileId] = () => { togglePanel(tool.sidepanel) }
      }
      // Button tools (e.g. comments) — only if the desktop guard passed (component loaded)
      else if (tool.render === 'button' && toolComponents[key]) {
        try {
          if (key === 'comments') {
            const { toggleCommentMode, isCommentModeActive } = await import('./comments/commentMode.js')
            const { isAuthenticated } = await import('./comments/auth.js')
            const { openAuthModal } = await import('./comments/ui/authModal.js')
            actions.push({
              id: mobileId,
              label: tool.ariaLabel || 'Comments',
              type: 'toggle',
              modes: tool.modes || ['*'],
              excludeRoutes: tool.excludeRoutes,
              toolKey: key,
              localOnly: !tool.prod,
            })
            handlers[mobileId] = {
              execute: async () => {
                if (!isAuthenticated()) {
                  const user = await openAuthModal()
                  if (!user) return
                }
                toggleCommentMode()
              },
              getState: () => isCommentModeActive(),
            }
          }
        } catch { /* comments module not available */ }
      }
    }

    // Theme tool — special handling (component-only, no handler in registry)
    if (toolConfigs.theme && toolComponents.theme) {
      // Only add if not already handled above (theme has no getChildren in registry)
      if (!actions.some(a => a.id === 'mobile:theme')) {
        try {
          const { themeState, setTheme, THEMES } = await import('./stores/themeStore.js')
          actions.push({
            id: 'mobile:theme',
            label: 'Theme',
            type: 'submenu',
            modes: ['*'],
            toolKey: 'theme',
            localOnly: !toolConfigs.theme.prod,
          })
          handlers['mobile:theme'] = {
            getChildren: () => {
              const current = themeState.theme
              return THEMES.map((t: any) => ({
                id: `theme:${t.value}`,
                label: t.label,
                type: 'toggle' as const,
                active: current === t.value,
                execute: () => setTheme(t.value),
              }))
            },
          }
        } catch { /* theme store not available */ }
      }
    }

    // Canvas toolbar stays visible on mobile — no need to duplicate canvas tools here

    setDynamicActions('mobile-toolbar', actions, handlers)
    mobileActionsRegistered = true
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
          {@const CanvasToolComponent = toolComponents[canvasTool.key]}
          {#if canvasTool.render === 'menu'}
            <Tooltip.Root>
              <Tooltip.Trigger>
                <span data-local-only={isToolbarToolLocalOnly(canvasTool.key) || undefined}>
                  <CanvasToolComponent
                    config={canvasTool}
                    data={toolData[canvasTool.key]}
                    canvasName={activeCanvasId}
                    zoom={canvasZoom}
                    tabindex={0}
                  />
                </span>
              </Tooltip.Trigger>
              <Tooltip.Content side="top">{canvasTool.ariaLabel || canvasTool.key}</Tooltip.Content>
            </Tooltip.Root>
          {:else}
            <CanvasToolComponent
              config={canvasTool}
              data={toolData[canvasTool.key]}
              canvasName={activeCanvasId}
              zoom={canvasZoom}
              tabindex={0}
            />
          {/if}
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
    {#if visible && !isMobileState}
      {#each cleanedMenus as menu, i (menu.key)}
        {#if menu.render === 'separator'}
          <div class="toolbar-separator" aria-hidden="true"></div>
        {:else}
          <Tooltip.Root>
            <Tooltip.Trigger>
              {#if menu.render === 'sidepanel'}
                {@const toolState = getToolbarToolState(menu.key)}
                <TriggerButton
                  active={$sidePanelState.open && $sidePanelState.activeTab === menu.sidepanel}
                  inactive={toolState === 'inactive'}
                  dimmed={toolState === 'dimmed'}
                  localOnly={isToolbarToolLocalOnly(menu.key)}
                  size="icon-xl"
                  aria-label={menu.ariaLabel || menu.key}
                  tabindex={getTabindex(i)}
                  onfocus={() => { activeToolbarIndex = i }}
                  onclick={() => togglePanel(menu.sidepanel)}
                >
                  <Icon name={menu.icon || menu.key} size={16} {...(menu.meta || {})} />
                </TriggerButton>
              {:else if toolComponents[menu.key]}
                {@const toolState = getToolbarToolState(menu.key)}
                {@const ToolComponent = toolComponents[menu.key]}
                <span
                  data-tool-state={toolState}
                  data-local-only={isToolbarToolLocalOnly(menu.key) || undefined}
                  class={toolState === 'inactive' ? 'tool-inactive' : toolState === 'dimmed' ? 'tool-dimmed' : ''}
                >
                  <ToolComponent
                    config={menu}
                    data={toolData[menu.key]}
                    tabindex={getTabindex(i)}
                    localOnly={isToolbarToolLocalOnly(menu.key)}
                    {basePath}
                  />
                </span>
              {/if}
            </Tooltip.Trigger>
            <Tooltip.Content side="top">{menu.ariaLabel || menu.key}</Tooltip.Content>
          </Tooltip.Root>
        {/if}
      {/each}
    {/if}
    {#if commandMenuConfig}
      <div class={visible ? '' : 'default-button-dimmed'}>
        <Tooltip.Root>
          <Tooltip.Trigger>
            <CommandPalette tabindex={getTabindex(commandMenuIndex)} icon={commandMenuConfig.icon} iconMeta={commandMenuConfig.meta} oninterceptclick={!visible ? enterPeekMode : undefined} />
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

{#if !isEmbed}
  <PwaInstallBanner />
{/if}

<!-- Flow info panel (previously inside CommandMenu) -->
<Panel.Root bind:open={flowDialogOpen}>
  <Panel.Content>
    <Panel.Header>
      <Panel.Title>Flow: {flowName}</Panel.Title>
      <Panel.Close />
    </Panel.Header>
    <Panel.Body>
      {#if flowError}
        <span class="text-destructive text-sm">{flowError}</span>
      {:else}
        <pre class="m-0 bg-transparent text-sm font-mono leading-relaxed whitespace-pre-wrap break-words">{flowJson}</pre>
      {/if}
    </Panel.Body>
  </Panel.Content>
</Panel.Root>

<style>
  .toolbar-separator {
    width: 1px;
    height: 20px;
    background: var(--sb--trigger-border, var(--color-slate-400));
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

  .tool-inactive {
    opacity: 0.45;
    pointer-events: none;
  }
  .tool-dimmed {
    opacity: 0.3;
    transition: opacity 200ms;
  }
  .tool-dimmed:hover,
  .tool-dimmed:focus-within {
    opacity: 1;
  }
  [data-local-only] {
    position: relative;
  }
  [data-local-only]::after {
    content: '';
    position: absolute;
    top: -1px;
    right: -1px;
    width: 8px;
    height: 8px;
    background: hsl(212, 92%, 45%);
    border-radius: 50%;
    border: 2px solid var(--sb--sc-border-color, transparent);
    box-sizing: content-box;
    pointer-events: none;
    z-index: 1;
  }
</style>
