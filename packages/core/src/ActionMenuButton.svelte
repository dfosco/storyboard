<!--
  ActionMenuButton — generic config-driven dropdown menu button.

  Renders a standalone toolbar button whose items come from the
  command action registry (via getActionChildren). This is the
  standalone equivalent of CommandMenu's submenu rendering — any
  menu declared in toolbar.config.json with an "action" reference
  gets rendered by this component.

  Supports child types: default, toggle, radio.
  Radio groups use RadioGroup/RadioItem with a check indicator.
-->

<script lang="ts">
  import { TriggerButton } from './lib/components/ui/trigger-button/index.js'
  import * as DropdownMenu from './lib/components/ui/dropdown-menu/index.js'
  import Icon from './svelte-plugin-ui/components/Icon.svelte'
  import { getActionChildren, subscribeToCommandActions } from './commandActions.js'

  interface Props {
    config?: {
      ariaLabel?: string
      icon?: string
      meta?: Record<string, any>
      label?: string
      action?: string
    }
    data?: any
    localOnly?: boolean
    tabindex?: number
  }

  let { config = {}, data, localOnly, tabindex = -1 }: Props = $props()

  let menuOpen = $state(false)
  let actionsVersion = $state(0)

  $effect(() => {
    const unsub = subscribeToCommandActions(() => { actionsVersion++ })
    return unsub
  })

  const children = $derived.by(() => {
    void actionsVersion
    if (!config.action) return []
    return getActionChildren(config.action)
  })

  const hasRadio = $derived(children.some((c: any) => c.type === 'radio'))
  const activeValue = $derived(children.find((c: any) => c.type === 'radio' && c.active)?.id || '')

  function handleOpenChange(open: boolean) {
    if (open) actionsVersion++
  }
</script>

{#if children.length > 0}
  <DropdownMenu.Root bind:open={menuOpen} onOpenChange={handleOpenChange}>
    <DropdownMenu.Trigger>
      {#snippet child({ props })}
        <TriggerButton
          active={menuOpen}
          size="icon-xl"
          aria-label={config.ariaLabel || config.label || 'Menu'}
          {tabindex}
          {...props}
        >
          <Icon name={config.icon || 'primer/gear'} size={16} {...(config.meta || {})} />
        </TriggerButton>
      {/snippet}
    </DropdownMenu.Trigger>

    <DropdownMenu.Content side="top" align="end" sideOffset={16} style={config.menuWidth ? `min-width: ${config.menuWidth}` : undefined} class={config.menuWidth ? '' : 'min-w-[200px]'}>
      {#if config.label}
        <DropdownMenu.Label>{config.label}</DropdownMenu.Label>
      {/if}

      {#if hasRadio}
        <DropdownMenu.RadioGroup value={activeValue}>
          {#each children as child (child.id || child.label)}
            {#if child.type === 'radio'}
              <DropdownMenu.RadioItem
                value={child.id}
                onclick={(e) => {
                  if (child.href && (e.metaKey || e.ctrlKey)) {
                    e.preventDefault(); window.open(child.href, '_blank'); menuOpen = false; return
                  }
                  if (child.execute) child.execute(); menuOpen = false
                }}
              >
                {child.label}
              </DropdownMenu.RadioItem>
            {/if}
          {/each}
        </DropdownMenu.RadioGroup>
      {:else}
        {#each children as child (child.id || child.label)}
          {#if child.type === 'toggle'}
            <DropdownMenu.CheckboxItem
              checked={child.active}
              onSelect={(e) => { e.preventDefault(); if (child.execute) child.execute(); actionsVersion++ }}
            >
              {child.label}
            </DropdownMenu.CheckboxItem>
          {:else}
            <DropdownMenu.Item onclick={(e) => {
              if (child.href && (e.metaKey || e.ctrlKey)) {
                e.preventDefault(); window.open(child.href, '_blank'); menuOpen = false; return
              }
              if (child.execute) child.execute(); menuOpen = false
            }}>
              {child.label}
            </DropdownMenu.Item>
          {/if}
        {/each}
      {/if}
    </DropdownMenu.Content>
  </DropdownMenu.Root>
{/if}
