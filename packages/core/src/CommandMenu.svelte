<!--
  CommandMenu — floating ⌘ trigger + dropdown menu + overlay panels.
  Uses shadcn DropdownMenu for the menu. Replaces vanilla JS devtools.js.
-->

<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js'
  import { Button } from '$lib/components/ui/button/index.js'
  import { Separator } from '$lib/components/ui/separator/index.js'
  import { cn } from '$lib/utils/index.js'

  interface Props {
    basePath?: string
  }

  let { basePath = '/' }: Props = $props()

  // Lazy imports for framework-agnostic modules
  let loadFlow: any = null
  let isCommentsEnabled: any = null
  let isHideMode: any = null
  let activateHideMode: any = null
  let deactivateHideMode: any = null
  let getAllFlags: any = null
  let toggleFlag: any = null
  let getFlagKeys: any = null
  let getCommentsMenuItems: any = null

  let menuOpen = $state(false)
  let visible = $state(true)
  let panelType: 'flow' | 'flags' | null = $state(null)
  let flowJson = $state('')
  let flowError: string | null = $state(null)
  let flowName = $state('default')
  let flagKeys: string[] = $state([])
  let flags: Record<string, { current: boolean }> = $state({})
  let hideModeActive = $state(false)
  let commentsItems: Array<{ label: string; icon: string; onClick: () => void }> = $state([])
  let commentsEnabled = $state(false)

  function getFlowName() {
    const p = new URLSearchParams(window.location.search)
    return p.get('flow') || p.get('scene') || 'default'
  }

  function refreshState() {
    if (isHideMode) hideModeActive = isHideMode()
    if (getFlagKeys) flagKeys = getFlagKeys()
    if (getAllFlags) flags = getAllFlags()
    if (isCommentsEnabled) commentsEnabled = isCommentsEnabled()
    flowName = getFlowName()
  }

  function openFlowPanel() {
    menuOpen = false
    flowName = getFlowName()
    flowError = null
    try {
      flowJson = JSON.stringify(loadFlow(flowName), null, 2)
    } catch (err: any) {
      flowError = err.message
    }
    panelType = 'flow'
  }

  function openFlagsPanel() {
    menuOpen = false
    refreshState()
    panelType = 'flags'
  }

  function closePanel() {
    panelType = null
  }

  function handleToggleFlag(key: string) {
    if (toggleFlag) toggleFlag(key)
    refreshState()
  }

  function handleHideMode() {
    if (hideModeActive) { if (deactivateHideMode) deactivateHideMode() }
    else { if (activateHideMode) activateHideMode() }
    hideModeActive = isHideMode ? isHideMode() : false
    menuOpen = false
  }

  function handleViewfinder() {
    menuOpen = false
    window.location.href = basePath + 'viewfinder'
  }

  function handleReset() {
    window.location.hash = ''
    menuOpen = false
  }

  function handleCommentAction(item: any) {
    menuOpen = false
    item.onClick()
  }

  async function refreshComments() {
    if (!commentsEnabled) { commentsItems = []; return }
    try {
      const mod = await import('./comments/ui/CommentOverlay.js')
      commentsItems = mod.getCommentsMenuItems()
    } catch { commentsItems = [] }
  }

  function handleMenuOpen(open: boolean) {
    menuOpen = open
    if (open) {
      refreshState()
      refreshComments()
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === '.' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      visible = !visible
      if (!visible) { menuOpen = false; closePanel() }
    }
  }

  onMount(async () => {
    window.addEventListener('keydown', handleKeydown)

    // Dynamic imports to avoid circular deps
    try {
      const loader = await import('./loader.js')
      loadFlow = loader.loadFlow
    } catch {}
    try {
      const comments = await import('./comments/config.js')
      isCommentsEnabled = comments.isCommentsEnabled
    } catch {}
    try {
      const hide = await import('./hideMode.js')
      isHideMode = hide.isHideMode
      activateHideMode = hide.activateHideMode
      deactivateHideMode = hide.deactivateHideMode
    } catch {}
    try {
      const ff = await import('./featureFlags.js')
      getAllFlags = ff.getAllFlags
      toggleFlag = ff.toggleFlag
      getFlagKeys = ff.getFlagKeys
    } catch {}

    refreshState()
  })

  onDestroy(() => {
    window.removeEventListener('keydown', handleKeydown)
  })
</script>

{#if visible}
  <div class="fixed bottom-6 right-6 z-[9999] font-sans">
    <DropdownMenu.Root bind:open={menuOpen} onOpenChange={handleMenuOpen}>
      <DropdownMenu.Trigger>
        {#snippet child({ props })}
          <button
            {...props}
            class="flex items-center justify-center w-10 h-10 text-lg font-medium bg-popover text-muted-foreground border border-border rounded-full cursor-pointer shadow-lg transition-transform duration-150 hover:scale-105 active:scale-[0.97] select-none leading-none"
            aria-label="Command Menu"
          >⌘</button>
        {/snippet}
      </DropdownMenu.Trigger>
      <DropdownMenu.Content side="top" align="end" class="min-w-[200px]">
        <DropdownMenu.Item onclick={handleViewfinder}>
          <svg class="w-4 h-4 mr-2 shrink-0 fill-current" viewBox="0 0 16 16"><path d="M8.5 1.75a.75.75 0 0 0-1.5 0V3H1.75a.75.75 0 0 0 0 1.5H3v6H1.75a.75.75 0 0 0 0 1.5H7v1.25a.75.75 0 0 0 1.5 0V12h5.25a.75.75 0 0 0 0-1.5H12v-6h1.75a.75.75 0 0 0 0-1.5H8.5Zm2 8.75h-5a.25.25 0 0 1-.25-.25v-4.5A.25.25 0 0 1 5.5 5.5h5a.25.25 0 0 1 .25.25v4.5a.25.25 0 0 1-.25.25Z"/></svg>
          Viewfinder
        </DropdownMenu.Item>
        <DropdownMenu.Item onclick={openFlowPanel}>
          <svg class="w-4 h-4 mr-2 shrink-0 fill-current" viewBox="0 0 16 16"><path d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8Zm8-6.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13ZM6.5 7.75A.75.75 0 0 1 7.25 7h1a.75.75 0 0 1 .75.75v2.75h.25a.75.75 0 0 1 0 1.5h-2a.75.75 0 0 1 0-1.5h.25v-2h-.25a.75.75 0 0 1-.75-.75ZM8 6a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z"/></svg>
          Show flow info
        </DropdownMenu.Item>
        <DropdownMenu.Item onclick={handleReset}>
          <svg class="w-4 h-4 mr-2 shrink-0 fill-current" viewBox="0 0 16 16"><path d="M1.705 8.005a.75.75 0 0 1 .834.656 5.5 5.5 0 0 0 9.592 2.97l-1.204-1.204a.25.25 0 0 1 .177-.427h3.646a.25.25 0 0 1 .25.25v3.646a.25.25 0 0 1-.427.177l-1.38-1.38A7.002 7.002 0 0 1 1.05 8.84a.75.75 0 0 1 .656-.834ZM8 2.5a5.487 5.487 0 0 0-4.131 1.869l1.204 1.204A.25.25 0 0 1 4.896 6H1.25A.25.25 0 0 1 1 5.75V2.104a.25.25 0 0 1 .427-.177l1.38 1.38A7.002 7.002 0 0 1 14.95 7.16a.75.75 0 0 1-1.49.178A5.5 5.5 0 0 0 8 2.5Z"/></svg>
          Reset all params
        </DropdownMenu.Item>
        <DropdownMenu.Item onclick={handleHideMode}>
          {#if hideModeActive}
            <svg class="w-4 h-4 mr-2 shrink-0 fill-current" viewBox="0 0 16 16"><path d="M8 2c1.981 0 3.671.992 4.933 2.078 1.27 1.091 2.187 2.345 2.637 3.023a1.62 1.62 0 0 1 0 1.798c-.45.678-1.367 1.932-2.637 3.023C11.67 13.008 9.981 14 8 14s-3.671-.992-4.933-2.078C1.797 10.831.88 9.577.43 8.899a1.62 1.62 0 0 1 0-1.798c.45-.678 1.367-1.932 2.637-3.023C4.33 2.992 6.019 2 8 2ZM1.679 7.932a.12.12 0 0 0 0 .136c.411.622 1.241 1.75 2.366 2.717C5.176 11.758 6.527 12.5 8 12.5s2.823-.742 3.955-1.715c1.124-.967 1.954-2.096 2.366-2.717a.12.12 0 0 0 0-.136c-.412-.621-1.242-1.75-2.366-2.717C10.824 4.242 9.473 3.5 8 3.5s-2.824.742-3.955 1.715c-1.124.967-1.954 2.096-2.366 2.717ZM8 10a2 2 0 1 1-.001-3.999A2 2 0 0 1 8 10Z"/></svg>
            Show mode
          {:else}
            <svg class="w-4 h-4 mr-2 shrink-0 fill-current" viewBox="0 0 16 16"><path d="M.143 2.31a.75.75 0 0 1 1.047-.167l14.5 10.5a.75.75 0 1 1-.88 1.214l-2.248-1.628C11.346 13.19 9.792 14 8 14c-1.981 0-3.671-.992-4.933-2.078C1.797 10.831.88 9.577.43 8.899a1.62 1.62 0 0 1 0-1.798c.35-.527 1.06-1.476 2.019-2.398L.31 3.357A.75.75 0 0 1 .143 2.31Zm3.386 3.378a14.21 14.21 0 0 0-1.85 2.244.12.12 0 0 0 0 .136c.411.622 1.241 1.75 2.366 2.717C5.176 11.758 6.527 12.5 8 12.5c1.195 0 2.31-.488 3.29-1.191L9.063 9.695A2 2 0 0 1 6.058 7.39L3.529 5.688ZM8 3.5c-.516 0-1.017.09-1.499.251a.75.75 0 1 1-.473-1.423A6.23 6.23 0 0 1 8 2c1.981 0 3.671.992 4.933 2.078 1.27 1.091 2.187 2.345 2.637 3.023a1.62 1.62 0 0 1 0 1.798c-.11.166-.248.365-.41.587a.75.75 0 1 1-1.21-.887c.14-.191.26-.367.36-.524a.12.12 0 0 0 0-.136c-.412-.621-1.242-1.75-2.366-2.717C10.824 4.242 9.473 3.5 8 3.5Z"/></svg>
            Hide mode
          {/if}
        </DropdownMenu.Item>

        {#if flagKeys.length > 0}
          <DropdownMenu.Separator />
          <DropdownMenu.Item onclick={openFlagsPanel}>
            <svg class="w-4 h-4 mr-2 shrink-0 fill-current" viewBox="0 0 16 16"><path d="M9.504.43a1.516 1.516 0 0 1 2.437 1.713L10.415 5.5h2.123c1.57 0 2.346 1.909 1.22 3.004l-7.34 7.142a1.249 1.249 0 0 1-.871.354h-.302a1.25 1.25 0 0 1-1.157-1.723L5.633 10.5H3.462c-1.57 0-2.346-1.909-1.22-3.004Z"/></svg>
            Feature Flags
          </DropdownMenu.Item>
        {/if}

        {#if commentsItems.length > 0}
          <DropdownMenu.Separator />
          {#each commentsItems as item}
            <DropdownMenu.Item onclick={() => handleCommentAction(item)}>
              <span class="w-4 h-4 mr-2 flex items-center justify-center shrink-0">{item.icon}</span>
              {item.label}
            </DropdownMenu.Item>
          {/each}
        {/if}

        <DropdownMenu.Separator />
        <DropdownMenu.Label class="text-xs font-normal text-muted-foreground font-mono">⌘ + . to hide</DropdownMenu.Label>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  </div>

  <!-- Flow info panel -->
  {#if panelType === 'flow'}
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="fixed inset-0 z-[9998] flex items-end justify-center p-4 pb-20">
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div class="fixed inset-0" onclick={closePanel}></div>
      <div class="relative w-full max-w-[640px] max-h-[60vh] bg-background border border-border rounded-xl shadow-lg overflow-hidden flex flex-col">
        <div class="flex items-center justify-between px-4 py-3 border-b border-border">
          <span class="text-sm font-semibold">Flow: {flowName}</span>
          <Button variant="ghost" size="icon" class="h-7 w-7 text-muted-foreground" aria-label="Close panel" onclick={closePanel}>×</Button>
        </div>
        <div class="overflow-auto p-4">
          {#if flowError}
            <span class="text-destructive text-sm">{flowError}</span>
          {:else}
            <pre class="m-0 bg-transparent text-sm font-mono leading-relaxed text-foreground whitespace-pre-wrap break-words">{flowJson}</pre>
          {/if}
        </div>
      </div>
    </div>
  {/if}

  <!-- Feature flags panel -->
  {#if panelType === 'flags'}
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="fixed inset-0 z-[9998] flex items-end justify-center p-4 pb-20">
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div class="fixed inset-0" onclick={closePanel}></div>
      <div class="relative w-full max-w-[640px] max-h-[60vh] bg-background border border-border rounded-xl shadow-lg overflow-hidden flex flex-col">
        <div class="flex items-center justify-between px-4 py-3 border-b border-border">
          <span class="text-sm font-semibold">Feature Flags</span>
          <Button variant="ghost" size="icon" class="h-7 w-7 text-muted-foreground" aria-label="Close" onclick={closePanel}>×</Button>
        </div>
        <div class="overflow-auto p-4">
          {#if flagKeys.length === 0}
            <span class="text-sm text-muted-foreground">No feature flags configured.</span>
          {:else}
            {#each flagKeys as key (key)}
              <button class="flex items-center gap-2 w-full px-4 py-2 text-sm text-left bg-transparent border-none cursor-pointer hover:bg-accent/50 rounded transition-colors"
                      onclick={() => handleToggleFlag(key)}>
                <span class="w-4 h-4 flex items-center justify-center shrink-0">
                  {#if flags[key]?.current}
                    <svg class="w-4 h-4 fill-current" viewBox="0 0 16 16"><path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z"/></svg>
                  {/if}
                </span>
                {key}
              </button>
            {/each}
          {/if}
        </div>
      </div>
    </div>
  {/if}
{/if}
