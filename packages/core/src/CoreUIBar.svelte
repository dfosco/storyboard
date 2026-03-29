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
  import Octicon from './svelte-plugin-ui/components/Octicon.svelte'
  import { modeState } from './svelte-plugin-ui/stores/modeStore.js'
  import { sidePanelState, togglePanel } from './stores/sidePanelStore.js'
  import { initCommandActions, registerCommandAction, isExcludedByRoute } from './commandActions.js'
  import { isMenuHidden } from './uiConfig.js'
  import coreUIConfig from '../core-ui.config.json'

  interface Props { basePath?: string }
  let { basePath = '/' }: Props = $props()

  let visible = $state(true)
  let CreateMenuButton: any = $state(null)
  let createMenuFeatures: any[] = $state([])
  let CommentsMenuButton: any = $state(null)
  let commentsEnabled = $state(false)
  let SidePanel: any = $state(null)

  const commandMenuConfig = isMenuHidden('command') ? null : coreUIConfig.menus?.command

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
        if (!menuVisibleInMode(menu, $modeState.mode)) return false
        if (menu.key === 'create') return CreateMenuButton && createMenuFeatures.length > 0
        if (menu.key === 'comments') return CommentsMenuButton && commentsEnabled
        return true
      })
      .reverse()
  )

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === '.' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      visible = !visible
      document.documentElement.classList.toggle('storyboard-chrome-hidden', !visible)
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

    // Register devtools submenu (show flow info, reset params, hide mode)
    {
      let loader: any = null
      let hm: any = null
      try { loader = await import('./loader.js') } catch {}
      try { hm = await import('./hideMode.js') } catch {}

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
  })

  onDestroy(() => {
    window.removeEventListener('keydown', handleKeydown)
  })

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

{#if visible}
  <div class="fixed bottom-6 right-6 z-[9999] font-sans flex items-end gap-3" data-core-ui-bar>
    {#each visibleMenus as menu (menu.key)}
      <Tooltip.Root>
        <Tooltip.Trigger>
          {#if menu.sidepanel}
            <TriggerButton
              active={$sidePanelState.open && $sidePanelState.activeTab === menu.sidepanel}
              size="icon-xl"
              aria-label={menu.ariaLabel || menu.key}
              onclick={() => togglePanel(menu.sidepanel)}
            >
              <Octicon name={menu.icon || menu.key} size={16} />
            </TriggerButton>
          {:else if menu.key === 'create'}
            <CreateMenuButton features={createMenuFeatures} config={menu} />
          {:else if menu.key === 'comments'}
            <CommentsMenuButton config={menu} />
          {/if}
        </Tooltip.Trigger>
        <Tooltip.Content side="top">{menu.ariaLabel || menu.key}</Tooltip.Content>
      </Tooltip.Root>
    {/each}
    {#if commandMenuConfig}
      <Tooltip.Root>
        <Tooltip.Trigger>
          <CommandMenu {basePath} bind:flowDialogOpen {flowName} {flowJson} {flowError} />
        </Tooltip.Trigger>
        <Tooltip.Content side="top">Command Menu</Tooltip.Content>
      </Tooltip.Root>
    {/if}
  </div>
{/if}

{#if SidePanel}
  <SidePanel />
{/if}
