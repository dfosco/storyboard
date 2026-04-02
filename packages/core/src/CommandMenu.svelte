<!--
  CommandMenu — ⌘ trigger + config-driven dropdown menu.
  Renders actions from the command action registry by type:
    default  → DropdownMenu.Item
    toggle   → DropdownMenu.CheckboxItem
    submenu  → DropdownMenu.Sub with SubTrigger + SubContent
-->

<script lang="ts">
  import * as DropdownMenu from './lib/components/ui/dropdown-menu/index.js'
  import * as Panel from './lib/components/ui/panel/index.js'
  import { TriggerButton } from './lib/components/ui/trigger-button/index.js'
  import Icon from './svelte-plugin-ui/components/Icon.svelte'
  import { getActionsForMode, executeAction, getActionChildren, subscribeToCommandActions } from './commandActions.js'
  import { getToolbarToolState, isToolbarToolLocalOnly, subscribeToToolbarToolStates } from './toolStateStore.js'
  import { modeState } from './svelte-plugin-ui/stores/modeStore.js'

  interface ShortcutConfig {
    key: string
    label: string
  }

  interface Props {
    basePath?: string
    open?: boolean
    tabindex?: number
    icon?: string
    iconMeta?: Record<string, unknown>
    flowDialogOpen?: boolean
    flowName?: string
    flowJson?: string
    flowError?: string | null
    shortcuts?: { openCommandMenu?: ShortcutConfig; hideChrome?: ShortcutConfig }
  }

  let {
    basePath = '/',
    open = $bindable(false),
    tabindex,
    icon = 'iconoir/key-command',
    iconMeta = {},
    flowDialogOpen = $bindable(false),
    flowName = 'default',
    flowJson = '',
    flowError = null,
    shortcuts = {},
  }: Props = $props()

  let actionsVersion = $state(0)

  // Subscribe to registry changes for reactivity
  $effect(() => {
    const unsub = subscribeToCommandActions(() => { actionsVersion++ })
    return unsub
  })

  $effect(() => {
    const unsub = subscribeToToolbarToolStates(() => { actionsVersion++ })
    return unsub
  })

  // Resolve actions for current mode (re-derives on mode or registry change)
  const resolvedActions = $derived.by(() => {
    void actionsVersion
    const raw = getActionsForMode($modeState.mode)
    return raw.filter(a => {
      if (!a.toolKey) return true  // structural items (header, separator, footer)
      const state = getToolbarToolState(a.toolKey)
      return state !== 'disabled' && state !== 'hidden'
    })
  })

  function handleAction(action: any) {
    executeAction(action.id)
    open = false
  }

  function handleToggleSelect(e: Event, action: any) {
    e.preventDefault()
    executeAction(action.id)
  }

  function handleSubmenuChildSelect(e: Event, child: any) {
    e.preventDefault()
    if (child.execute) child.execute()
    actionsVersion++
  }

  function refreshOnOpen(isOpen: boolean) {
    if (isOpen) actionsVersion++
  }
</script>

    <DropdownMenu.Root bind:open onOpenChange={refreshOnOpen}>
      <DropdownMenu.Trigger>
        {#snippet child({ props })}
          <TriggerButton
            active={open}
            class="text-2xl"
            aria-label="Command Menu"
            {tabindex}
            {...props}
          ><Icon name={icon} size={16} {...iconMeta} /></TriggerButton>
        {/snippet}
      </DropdownMenu.Trigger>

      <DropdownMenu.Content side="top" align="end" sideOffset={16} alignOffset={4} class="min-w-[200px]">
        {#each resolvedActions as action, i (action.id || `_${action.type}_${i}`)}
          {#if action.type === 'separator'}
            <DropdownMenu.Separator />

          {:else if action.type === 'header'}
            <DropdownMenu.Label>{action.label}</DropdownMenu.Label>

          {:else if action.type === 'footer'}
            <DropdownMenu.Separator />
            <div class="px-2 py-1.5 text-xs text-muted-foreground font-mono">{action.label}</div>

          {:else if action.type === 'toggle'}
            <DropdownMenu.CheckboxItem
              checked={action.active}
              onSelect={(e) => handleToggleSelect(e, action)}
            >
              {action.label}
            </DropdownMenu.CheckboxItem>

          {:else if action.type === 'submenu'}
            {@const itemState = action.toolKey ? getToolbarToolState(action.toolKey) : 'active'}
            {@const itemLocalOnly = action.toolKey ? isToolbarToolLocalOnly(action.toolKey) : false}
            {#if itemState !== 'inactive'}
              <DropdownMenu.Sub>
                <DropdownMenu.SubTrigger class={itemState === 'dimmed' ? 'opacity-50' : ''}>
                  <span class="flex items-center justify-between w-full gap-2">
                    <span>{action.label}</span>
                    {#if itemLocalOnly}
                      <span class="local-dot"></span>
                    {/if}
                  </span>
                </DropdownMenu.SubTrigger>
                <DropdownMenu.SubContent class="min-w-[160px]">
                  {#each getActionChildren(action.id) as child (child.id || child.label)}
                    {#if child.type === 'toggle'}
                      <DropdownMenu.CheckboxItem
                        checked={child.active}
                        onSelect={(e) => handleSubmenuChildSelect(e, child)}
                      >
                        {child.label}
                      </DropdownMenu.CheckboxItem>
                    {:else}
                      <DropdownMenu.Item onclick={() => { if (child.execute) child.execute(); open = false }}>
                        {child.label}
                      </DropdownMenu.Item>
                    {/if}
                  {/each}
                </DropdownMenu.SubContent>
              </DropdownMenu.Sub>
            {:else}
              <DropdownMenu.Item disabled>
                <span class="flex items-center justify-between w-full gap-2">
                  <span>{action.label}</span>
                  {#if itemLocalOnly}
                    <span class="local-dot"></span>
                  {/if}
                </span>
              </DropdownMenu.Item>
            {/if}

          {:else if action.type === 'link' && action.url}
            {@const itemState = action.toolKey ? getToolbarToolState(action.toolKey) : 'active'}
            {@const itemLocalOnly = action.toolKey ? isToolbarToolLocalOnly(action.toolKey) : false}
            <DropdownMenu.Item
              onclick={() => {
                open = false
                if (action.url.startsWith('/') && !action.url.startsWith('//')) {
                  const base = (basePath || '/').replace(/\/+$/, '')
                  window.location.href = (base === '/' ? '' : base) + action.url
                } else {
                  window.location.href = action.url
                }
              }}
              disabled={itemState === 'inactive'}
              class={itemState === 'dimmed' ? 'opacity-50' : ''}
            >
              <span class="flex items-center justify-between w-full gap-2">
                <span>{action.label}</span>
                {#if itemLocalOnly}
                  <span class="local-dot"></span>
                {/if}
              </span>
            </DropdownMenu.Item>

          {:else}
            {@const itemState = action.toolKey ? getToolbarToolState(action.toolKey) : 'active'}
            {@const itemLocalOnly = action.toolKey ? isToolbarToolLocalOnly(action.toolKey) : false}
            <DropdownMenu.Item
              onclick={() => handleAction(action)}
              disabled={itemState === 'inactive'}
              class={itemState === 'dimmed' ? 'opacity-50' : ''}
            >
              <span class="flex items-center justify-between w-full gap-2">
                <span>{action.label}</span>
                {#if itemLocalOnly}
                  <span class="local-dot"></span>
                {/if}
              </span>
            </DropdownMenu.Item>
          {/if}
        {/each}
        {#if shortcuts.hideChrome || shortcuts.openCommandMenu}
          <DropdownMenu.Separator />
          <div class="px-2 py-1.5 flex flex-col gap-0.5">
            {#if shortcuts.hideChrome}
              <div class="text-xs text-muted-foreground font-mono">{shortcuts.hideChrome.label}</div>
            {/if}
            {#if shortcuts.openCommandMenu}
              <div class="text-xs text-muted-foreground font-mono">{shortcuts.openCommandMenu.label}</div>
            {/if}
          </div>
        {/if}
      </DropdownMenu.Content>
    </DropdownMenu.Root>

  <!-- Flow info panel -->
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
  .local-dot {
    display: inline-block;
    width: 4px;
    height: 4px;
    background: #1a7f37;
    border-radius: 50%;
    flex-shrink: 0;
  }
</style>
