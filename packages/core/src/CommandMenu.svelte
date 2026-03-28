<!--
  CommandMenu — ⌘ trigger + config-driven dropdown menu.
  Renders actions from the command action registry by type:
    default  → DropdownMenu.Item
    toggle   → DropdownMenu.CheckboxItem
    submenu  → DropdownMenu.Sub with SubTrigger + SubContent
-->

<script lang="ts">
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js'
  import * as Panel from '$lib/components/ui/panel/index.js'
  import { TriggerButton } from '$lib/components/ui/trigger-button/index.js'
  import { getActionsForMode, executeAction, getActionChildren, getFooter, subscribeToCommandActions, getCommandActionsSnapshot } from './commandActions.js'
  import { modeState } from './svelte-plugin-ui/stores/modeStore.js'

  interface Props {
    basePath?: string
    flowDialogOpen?: boolean
    flowName?: string
    flowJson?: string
    flowError?: string | null
  }

  let {
    basePath = '/',
    flowDialogOpen = $bindable(false),
    flowName = 'default',
    flowJson = '',
    flowError = null,
  }: Props = $props()

  let menuOpen = $state(false)
  let actionsVersion = $state(0)

  // Subscribe to registry changes for reactivity
  $effect(() => {
    const unsub = subscribeToCommandActions(() => { actionsVersion++ })
    return unsub
  })

  // Resolve actions for current mode (re-derives on mode or registry change)
  const resolvedActions = $derived.by(() => {
    // Touch actionsVersion to re-derive when registry changes
    void actionsVersion
    return getActionsForMode($modeState.mode)
  })

  const footer = $derived.by(() => {
    void actionsVersion
    return getFooter()
  })

  function handleAction(action: any) {
    executeAction(action.id)
    menuOpen = false
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

  function refreshOnOpen(open: boolean) {
    if (open) actionsVersion++
  }
</script>

    <DropdownMenu.Root bind:open={menuOpen} onOpenChange={refreshOnOpen}>
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
        {#each resolvedActions as action, i (action.id)}
          {#if action.separatorBefore}
            <DropdownMenu.Separator />
          {/if}

          {#if action.type === 'toggle'}
            <DropdownMenu.CheckboxItem
              checked={action.active}
              onSelect={(e) => handleToggleSelect(e, action)}
            >
              {action.resolvedLabel}
            </DropdownMenu.CheckboxItem>

          {:else if action.type === 'submenu'}
            <DropdownMenu.Sub>
              <DropdownMenu.SubTrigger>
                {action.resolvedLabel}
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
                    <DropdownMenu.Item onclick={() => handleSubmenuChildExecute(child)}>
                      {child.label}
                    </DropdownMenu.Item>
                  {/if}
                {/each}
              </DropdownMenu.SubContent>
            </DropdownMenu.Sub>

          {:else}
            <DropdownMenu.Item onclick={() => handleAction(action)}>
              {action.resolvedLabel}
            </DropdownMenu.Item>
          {/if}
        {/each}

        {#if footer}
          <DropdownMenu.Separator />
          <div class="px-2 py-1.5 text-[11px] text-muted-foreground font-mono">{footer}</div>
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
