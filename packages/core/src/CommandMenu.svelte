<!--
  CommandMenu — floating ⌘ trigger + dropdown menu + dialog panels.
  Uses shadcn-svelte components backed by bits-ui primitives.
-->

<script lang="ts">
  import { onMount } from 'svelte'
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js'
  import * as Dialog from '$lib/components/ui/dialog/index.js'
  import { TriggerButton } from '$lib/components/ui/trigger-button/index.js'

  interface Props { basePath?: string }
  let { basePath = '/' }: Props = $props()

  let menuOpen = $state(false)
  let flowDialogOpen = $state(false)
  let flagsDialogOpen = $state(false)
  let flowJson = $state('')
  let flowError: string | null = $state(null)
  let flowName = $state('default')
  let flagKeys: string[] = $state([])
  let flags: Record<string, { current: boolean }> = $state({})
  let hideModeActive = $state(false)
  let commentsItems: Array<{ label: string; icon: string; onClick: () => void }> = $state([])
  let commentsEnabled = $state(false)

  // Lazy-loaded modules
  let _loadFlow: any = null
  let _isCommentsEnabled: any = null
  let _isHideMode: any = null
  let _activateHideMode: any = null
  let _deactivateHideMode: any = null
  let _getAllFlags: any = null
  let _toggleFlag: any = null
  let _getFlagKeys: any = null

  function getFlowName() {
    const p = new URLSearchParams(window.location.search)
    return p.get('flow') || p.get('scene') || 'default'
  }

  function refreshState() {
    if (_isHideMode) hideModeActive = _isHideMode()
    if (_getFlagKeys) flagKeys = _getFlagKeys()
    if (_getAllFlags) flags = _getAllFlags()
    if (_isCommentsEnabled) commentsEnabled = _isCommentsEnabled()
    flowName = getFlowName()
  }

  async function refreshComments() {
    if (!commentsEnabled) { commentsItems = []; return }
    try {
      const mod = await import('./comments/ui/CommentOverlay.js')
      commentsItems = mod.getCommentsMenuItems()
    } catch { commentsItems = [] }
  }

  function handleMenuOpenChange(open: boolean) {
    if (open) { refreshState(); refreshComments() }
  }

  function openFlowDialog() {
    menuOpen = false
    flowName = getFlowName()
    flowError = null
    try { flowJson = JSON.stringify(_loadFlow(flowName), null, 2) }
    catch (e: any) { flowError = e.message }
    flowDialogOpen = true
  }

  function openFlagsDialog() {
    menuOpen = false
    refreshState()
    flagsDialogOpen = true
  }

  function handleHideMode() {
    if (hideModeActive) _deactivateHideMode?.(); else _activateHideMode?.()
    hideModeActive = _isHideMode?.() ?? false
    menuOpen = false
  }

  function handleViewfinder() { menuOpen = false; window.location.href = basePath + 'viewfinder' }
  function handleReset() { window.location.hash = ''; menuOpen = false }
  function handleCommentAction(item: any) { menuOpen = false; item.onClick() }
  function handleToggleFlag(key: string) { _toggleFlag?.(key); refreshState() }

  onMount(async () => {
    try { _loadFlow = (await import('./loader.js')).loadFlow } catch {}
    try { const m = await import('./comments/config.js'); _isCommentsEnabled = m.isCommentsEnabled } catch {}
    try { const m = await import('./hideMode.js'); _isHideMode = m.isHideMode; _activateHideMode = m.activateHideMode; _deactivateHideMode = m.deactivateHideMode } catch {}
    try { const m = await import('./featureFlags.js'); _getAllFlags = m.getAllFlags; _toggleFlag = m.toggleFlag; _getFlagKeys = m.getFlagKeys } catch {}
    refreshState()
  })
</script>

    <DropdownMenu.Root bind:open={menuOpen} onOpenChange={handleMenuOpenChange}>
      <DropdownMenu.Trigger>
        {#snippet child({ props })}
          <TriggerButton
            active={menuOpen}
            class="text-2xl"
            aria-label="Command Menu"
            {...props}
          >&#8984;</TriggerButton>
        {/snippet}
      </DropdownMenu.Trigger>

      <DropdownMenu.Content side="top" align="end" sideOffset={16} alignOffset={4} class="min-w-[200px]">
        <DropdownMenu.Item onclick={handleViewfinder}>
          Viewfinder
        </DropdownMenu.Item>
        <DropdownMenu.Item onclick={openFlowDialog}>
          Show flow info
        </DropdownMenu.Item>
        <DropdownMenu.Item onclick={handleReset}>
          Reset all params
        </DropdownMenu.Item>
        <DropdownMenu.Item onclick={handleHideMode}>
          {hideModeActive ? 'Show mode' : 'Hide mode'}
        </DropdownMenu.Item>

        {#if flagKeys.length > 0}
          <DropdownMenu.Separator />
          <DropdownMenu.Item onclick={openFlagsDialog}>
            Feature Flags
          </DropdownMenu.Item>
        {/if}

        {#if commentsItems.length > 0}
          <DropdownMenu.Separator />
          {#each commentsItems as item}
            <DropdownMenu.Item onclick={() => handleCommentAction(item)}>
              {item.label}
            </DropdownMenu.Item>
          {/each}
        {/if}

        <DropdownMenu.Separator />
        <div class="px-2 py-1.5 text-[11px] text-muted-foreground font-mono">&#8984; + . to hide</div>
      </DropdownMenu.Content>
    </DropdownMenu.Root>

  <!-- Flow info dialog -->
  <Dialog.Root bind:open={flowDialogOpen}>
    <Dialog.Content class="sm:max-w-[640px] max-h-[60vh] flex flex-col">
      <Dialog.Header>
        <Dialog.Title>Flow: {flowName}</Dialog.Title>
      </Dialog.Header>
      <div class="overflow-auto">
        {#if flowError}
          <span class="text-destructive text-sm">{flowError}</span>
        {:else}
          <pre class="m-0 bg-transparent text-sm font-mono leading-relaxed whitespace-pre-wrap break-words">{flowJson}</pre>
        {/if}
      </div>
    </Dialog.Content>
  </Dialog.Root>

  <!-- Flags dialog -->
  <Dialog.Root bind:open={flagsDialogOpen}>
    <Dialog.Content class="sm:max-w-[640px] max-h-[60vh] flex flex-col">
      <Dialog.Header>
        <Dialog.Title>Feature Flags</Dialog.Title>
      </Dialog.Header>
      <div class="overflow-auto -mx-4 px-4">
        {#if flagKeys.length === 0}
          <span class="text-sm text-muted-foreground">No feature flags configured.</span>
        {:else}
          {#each flagKeys as key (key)}
            <button
              class="flex items-center gap-2 w-full px-2 py-1.5 text-sm text-left bg-transparent border-none cursor-pointer hover:bg-accent rounded-md transition-colors"
              onclick={() => handleToggleFlag(key)}
            >
              <span class="size-4 flex items-center justify-center shrink-0">
                {#if flags[key]?.current}&#10003;{/if}
              </span>
              {key}
            </button>
          {/each}
        {/if}
      </div>
    </Dialog.Content>
  </Dialog.Root>
