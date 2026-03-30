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
  import { TriggerButton } from '$lib/components/ui/trigger-button/index.js'
  import * as Tooltip from '$lib/components/ui/tooltip/index.js'
  import Icon from './svelte-plugin-ui/components/Icon.svelte'
  import { modeState } from './svelte-plugin-ui/stores/modeStore.js'
  import { sidePanelState, togglePanel } from './stores/sidePanelStore.js'
  import { initCommandActions, registerCommandAction, getActionChildren, isExcludedByRoute, setRoutingBasePath } from './commandActions.js'
  import { isMenuHidden } from './uiConfig.js'
  import coreUIConfig from '../core-ui.config.json'

  interface Props { basePath?: string }
  let { basePath = '/' }: Props = $props()

  let visible = $state(true)
  // Hide the entire toolbar when loaded inside a prototype embed iframe
  const isEmbed = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('_sb_embed')
  let commandMenuOpen = $state(false)
  let ActionMenuButton: any = $state(null)
  let navVersion = $state(0)
  let origPushState: typeof history.pushState
  let origReplaceState: typeof history.replaceState
  let bumpNav: () => void
  let CreateMenuButton: any = $state(null)
  let createMenuFeatures: any[] = $state([])
  let CommentsMenuButton: any = $state(null)
  let commentsEnabled = $state(false)
  let SidePanel: any = $state(null)
  let toolbarEl: HTMLElement | null = $state(null)
  let CanvasCreateMenu: any = $state(null)
  let canvasActive = $state(false)
  let activeCanvasName = $state('')
  let canvasZoom = $state(100)
  const canvasToolbarConfig = (coreUIConfig as any).canvasToolbar || {}

  const ZOOM_STEP = 10
  const ZOOM_MIN = 25
  const ZOOM_MAX = 200

  // Roving tabindex: only one button in the toolbar is tabbable at a time
  let activeToolbarIndex = $state(-1)

  const commandMenuConfig = isMenuHidden('command') ? null : coreUIConfig.menus?.command
  const shortcutsConfig = (coreUIConfig as any).shortcuts || {}

  // Build ordered menu list from JSON key order (excluding command, which is always rightmost)
  const allMenus = (coreUIConfig.menus || {}) as Record<string, any>
  const orderedMenus = Object.entries(allMenus)
    .filter(([key]) => key !== 'command')
    .filter(([key]) => !isMenuHidden(key))
    .map(([key, menu]) => ({ key, ...menu }))

  // Discover menus with sidepanel property
  const sidepanelMenus = orderedMenus.filter(menu => menu.sidepanel)

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
        if (!menuVisibleInMode(menu, $modeState.mode)) return false
        if (menu.action) return ActionMenuButton && getActionChildren(menu.action).length > 0
        if (menu.key === 'create') return CreateMenuButton && createMenuFeatures.length > 0
        if (menu.key === 'comments') return CommentsMenuButton && commentsEnabled
        return true
      })
      .reverse()
  )

  // Total toolbar item count (visible menus + command menu if present)
  const toolbarItemCount = $derived(visibleMenus.length + (commandMenuConfig ? 1 : 0))

  // Command menu is always the last item (rightmost)
  const commandMenuIndex = $derived(commandMenuConfig ? visibleMenus.length : -1)

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
    // Cmd+D — toggle documentation panel
    if (e.key === 'd' && (e.metaKey || e.ctrlKey) && !e.shiftKey) {
      const docsMenu = visibleMenus.find(m => m.sidepanel === 'docs')
      if (docsMenu) {
        e.preventDefault()
        togglePanel('docs')
      }
    }
    // Cmd+I — toggle inspector panel
    if (e.key === 'i' && (e.metaKey || e.ctrlKey) && !e.shiftKey) {
      const inspectorMenu = visibleMenus.find(m => m.sidepanel === 'inspector')
      if (inspectorMenu) {
        e.preventDefault()
        togglePanel('inspector')
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

    // Register core action handlers
    registerCommandAction('core/viewfinder', () => {
      window.location.href = basePath + 'viewfinder'
    })

    // Register sidepanel toggle actions
    for (const menu of sidepanelMenus) {
      registerCommandAction(`core/${menu.key}`, () => {
        togglePanel(menu.sidepanel)
      })
    }

    // Register devtools submenu (show flow info, reset params, hide mode, logout)
    {
      let loader: any = null
      let hm: any = null
      let commentsAuth: any = null
      try { loader = await import('./loader.js') } catch {}
      try { hm = await import('./hideMode.js') } catch {}
      try { commentsAuth = await import('./comments/auth.js') } catch {}

      registerCommandAction('core/devtools', {
        getChildren: () => {
          const children: any[] = []
          if (loader) {
            children.push({
              id: 'core/show-flow-info',
              label: 'Show flow info',
              type: 'default',
              execute: () => {
                const p = new URLSearchParams(window.location.search)
                const name = p.get('flow') || p.get('scene') || 'default'
                try {
                  const data = loader.loadFlow(name)
                  showFlowInfoDialog(name, JSON.stringify(data, null, 2), null)
                } catch (e: any) {
                  showFlowInfoDialog(name, '', e.message)
                }
              },
            })
          }
          children.push({
            id: 'core/reset-params',
            label: 'Reset all params',
            type: 'default',
            execute: () => { window.location.hash = '' },
          })
          if (hm) {
            children.push({
              id: 'core/hide-mode',
              label: 'Hide mode',
              type: 'toggle',
              active: hm.isHideMode(),
              execute: () => {
                if (hm.isHideMode()) hm.deactivateHideMode()
                else hm.activateHideMode()
              },
            })
          }
          if (commentsAuth?.isAuthenticated()) {
            children.push({
              id: 'core/logout',
              label: 'Logout (remove token)',
              type: 'default',
              execute: () => {
                commentsAuth.clearToken()
                console.log('[storyboard] Token removed')
              },
            })
          }
          return children
        },
      })
    }

    try {
      const ff = await import('./featureFlags.js')
      registerCommandAction('core/feature-flags', {
        getChildren: () =>
          ff.getFlagKeys().map((key: string) => ({
            id: `flags/${key}`,
            label: key,
            type: 'toggle' as const,
            active: ff.getFlag(key),
            execute: () => ff.toggleFlag(key),
          })),
      })
    } catch {}

    // Register flow switcher action (dynamic — reads current prototype from URL)
    try {
      const loader = await import('./loader.js')
      const vf = await import('./viewfinder.js')

      registerCommandAction('core/flows', {
        getChildren: () => {
          let path = window.location.pathname
          const base = basePath.replace(/\/+$/, '')
          if (base && path.startsWith(base)) path = path.slice(base.length)
          path = path.replace(/\/+$/, '') || '/'
          const segments = path.split('/').filter(Boolean)
          const proto = segments[0] || null
          if (!proto) return []

          // Detect active flow
          const params = new URLSearchParams(window.location.search)
          const explicit = params.get('flow') || params.get('scene')
          let active: string
          if (explicit) {
            active = loader.resolveFlowName(proto, explicit)
          } else {
            const pageFlow = path === '/' ? 'index' : (path.split('/').pop() || 'index')
            const scoped = loader.resolveFlowName(proto, pageFlow)
            if (loader.flowExists(scoped)) active = scoped
            else {
              const protoFlow = loader.resolveFlowName(proto, proto)
              active = loader.flowExists(protoFlow) ? protoFlow : 'default'
            }
          }

          return loader.getFlowsForPrototype(proto).map((f: any) => {
            const meta = vf.getFlowMeta(f.key)
            return {
              id: f.key,
              label: meta?.title || f.name,
              type: 'radio' as const,
              active: f.key === active,
              execute: () => { window.location.href = vf.resolveFlowRoute(f.key) },
            }
          })
        },
      })
    } catch {}

    // Load action menu button (used for any menu with an "action" reference)
    try {
      const mod = await import('./ActionMenuButton.svelte')
      ActionMenuButton = mod.default
    } catch {}

    // Load comments menu button
    try {
      const { isCommentsEnabled } = await import('./comments/config.js')
      if (isCommentsEnabled()) {
        commentsEnabled = true
        const mod = await import('./CommentsMenuButton.svelte')
        CommentsMenuButton = mod.default
      }
    } catch {}

    // Load create menu features
    const createMenuConfig = allMenus.create
    try {
      if (createMenuConfig) {
        const { features } = await import('./workshop/features/registry.js')

        const createActions = Array.isArray(createMenuConfig.actions) ? createMenuConfig.actions : []
        createMenuFeatures = createActions
          .filter((a: any) => a.feature)
          .map((a: any) => {
            const feat = (features as Record<string, any>)[a.feature]
            if (!feat || !feat.overlayId || !feat.overlay) return null
            return {
              name: feat.name,
              label: a.label || feat.label,
              overlayId: feat.overlayId,
              overlay: feat.overlay,
            }
          })
          .filter(Boolean)

        if (createMenuFeatures.length > 0) {
          const mod = await import('./CreateMenuButton.svelte')
          CreateMenuButton = mod.default
        }
      }
    } catch {}

    // Load side panel component
    try {
      if (sidepanelMenus.length > 0) {
        const mod = await import('./SidePanel.svelte')
        SidePanel = mod.default
      }
    } catch {}

    // Load canvas create menu
    try {
      const mod = await import('./CanvasCreateMenu.svelte')
      CanvasCreateMenu = mod.default
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

  function canvasZoomIn() {
    const next = Math.min(ZOOM_MAX, canvasZoom + ZOOM_STEP)
    document.dispatchEvent(new CustomEvent('storyboard:canvas:set-zoom', { detail: { zoom: next } }))
  }

  function canvasZoomOut() {
    const next = Math.max(ZOOM_MIN, canvasZoom - ZOOM_STEP)
    document.dispatchEvent(new CustomEvent('storyboard:canvas:set-zoom', { detail: { zoom: next } }))
  }

  function canvasZoomReset() {
    document.dispatchEvent(new CustomEvent('storyboard:canvas:set-zoom', { detail: { zoom: 100 } }))
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
  {#if visible && canvasActive && CanvasCreateMenu}
    <div
      class="fixed bottom-6 left-6 z-[9999] font-sans flex items-center gap-3"
      role="toolbar"
      aria-label="Canvas toolbar"
    >
      <Tooltip.Root>
        <Tooltip.Trigger>
          <CanvasCreateMenu config={canvasToolbarConfig} canvasName={activeCanvasName} tabindex={0} />
        </Tooltip.Trigger>
        <Tooltip.Content side="top">Add widget to canvas</Tooltip.Content>
      </Tooltip.Root>

      <div class="canvas-zoom-bar">
        <button
          class="canvas-zoom-btn"
          onclick={canvasZoomOut}
          disabled={canvasZoom <= ZOOM_MIN}
          aria-label="Zoom out"
          title="Zoom out"
        >−</button>
        <button
          class="canvas-zoom-label"
          onclick={canvasZoomReset}
          aria-label="Reset zoom to 100%"
          title="Reset to 100%"
        >{canvasZoom}%</button>
        <button
          class="canvas-zoom-btn"
          onclick={canvasZoomIn}
          disabled={canvasZoom >= ZOOM_MAX}
          aria-label="Zoom in"
          title="Zoom in"
        >+</button>
      </div>
    </div>
  {/if}
  <div
    id="storyboard-controls"
    class="fixed bottom-6 right-6 z-[9999] font-sans flex items-end gap-3"
    data-core-ui-bar
    role="toolbar"
    aria-label="Storyboard controls"
    onkeydown={handleToolbarKeydown}
    bind:this={toolbarEl}
  >
    {#if visible}
      {#each visibleMenus as menu, i (menu.key)}
        <Tooltip.Root>
          <Tooltip.Trigger>
            {#if menu.sidepanel}
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
            {:else if menu.action}
              <ActionMenuButton config={menu} tabindex={getTabindex(i)} />
            {:else if menu.key === 'create'}
              <CreateMenuButton features={createMenuFeatures} config={menu} tabindex={getTabindex(i)} />
            {:else if menu.key === 'comments'}
              <CommentsMenuButton config={menu} tabindex={getTabindex(i)} />
            {/if}
          </Tooltip.Trigger>
          <Tooltip.Content side="top">{menu.ariaLabel || menu.key}</Tooltip.Content>
        </Tooltip.Root>
      {/each}
    {/if}
    {#if commandMenuConfig}
      <div class={visible ? '' : 'default-button-dimmed'}>
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

{#if SidePanel}
  <SidePanel onClose={() => focusToolbarItem(activeToolbarIndex < 0 ? toolbarItemCount - 1 : activeToolbarIndex)} />
{/if}

<style>
  .canvas-zoom-bar {
    display: flex;
    align-items: center;
    border-radius: 10px;
    border: 1.5px solid var(--trigger-border, var(--color-slate-400));
    background: var(--trigger-bg, var(--color-slate-100));
    overflow: hidden;
  }

  .canvas-zoom-btn {
    all: unset;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 32px;
    font-size: 16px;
    font-weight: 600;
    color: var(--trigger-text, var(--color-slate-600));
    transition: background 120ms;
  }

  .canvas-zoom-btn:hover:not(:disabled) {
    background: var(--trigger-bg-hover, var(--color-slate-300));
  }

  .canvas-zoom-btn:disabled {
    opacity: 0.3;
    cursor: default;
  }

  .canvas-zoom-label {
    all: unset;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 48px;
    height: 32px;
    padding: 0 4px;
    font-size: 11px;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    color: var(--trigger-text, var(--color-slate-600));
    border-left: 1.5px solid var(--trigger-border, var(--color-slate-400));
    border-right: 1.5px solid var(--trigger-border, var(--color-slate-400));
    transition: background 120ms;
  }

  .canvas-zoom-label:hover {
    background: var(--trigger-bg-hover, var(--color-slate-300));
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

