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
  import CommandMenu from './CommandMenu.svelte'
  import { modeState } from './svelte-plugin-ui/stores/modeStore.js'
  import { initCommandActions, registerCommandAction, setDynamicActions } from './commandActions.js'
  import coreUIConfig from '../core-ui.config.json'

  interface Props { basePath?: string }
  let { basePath = '/' }: Props = $props()

  let visible = $state(true)
  let CreateMenuButton: any = $state(null)
  let createMenuFeatures: any[] = $state([])

  const commandMenuConfig = coreUIConfig.menus?.command
  const createMenuConfig = coreUIConfig.menus?.create

  function menuVisibleInMode(menu: any, mode: string): boolean {
    if (!menu?.modes) return false
    return menu.modes.includes('*') || menu.modes.includes(mode)
  }

  const showCreateMenu = $derived(
    createMenuConfig &&
    menuVisibleInMode(createMenuConfig, $modeState.mode) &&
    CreateMenuButton && createMenuFeatures.length > 0
  )

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === '.' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      visible = !visible
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

    registerCommandAction('core/reset-params', () => {
      window.location.hash = ''
    })

    // Lazy-load optional handler modules
    try {
      const loader = await import('./loader.js')
      registerCommandAction('core/show-flow-info', {
        execute: () => {
          const p = new URLSearchParams(window.location.search)
          const flowName = p.get('flow') || p.get('scene') || 'default'
          try {
            const data = loader.loadFlow(flowName)
            showFlowInfoDialog(flowName, JSON.stringify(data, null, 2), null)
          } catch (e: any) {
            showFlowInfoDialog(flowName, '', e.message)
          }
        },
      })
    } catch {}

    try {
      const hm = await import('./hideMode.js')
      registerCommandAction('core/hide-mode', {
        execute: () => {
          if (hm.isHideMode()) hm.deactivateHideMode()
          else hm.activateHideMode()
        },
        getState: () => hm.isHideMode(),
      })
    } catch {}

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

    // Register comment actions
    try {
      const { isCommentsEnabled } = await import('./comments/config.js')
      if (isCommentsEnabled()) {
        const { getCommentsMenuItems } = await import('./comments/ui/CommentOverlay.js')
        const items = getCommentsMenuItems()
        if (items.length > 0) {
          const actions = items.map((item: any, i: number) => ({
            id: `comments/${i}`,
            label: item.label,
            type: 'default' as const,
            separatorBefore: i === 0,
          }))
          const handlers: Record<string, () => void> = {}
          items.forEach((item: any, i: number) => {
            handlers[`comments/${i}`] = () => item.onClick()
          })
          setDynamicActions('comments', actions, handlers)
        }
      }
    } catch {}

    // Load create menu features
    try {
      if (createMenuConfig) {
        const { features } = await import('./workshop/features/registry.js')

        const createActions = createMenuConfig.actions?.['*'] || []
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
    {#if showCreateMenu}
      <CreateMenuButton features={createMenuFeatures} config={createMenuConfig} />
    {/if}
    <CommandMenu {basePath} bind:flowDialogOpen {flowName} {flowJson} {flowError} />
  </div>
{/if}
