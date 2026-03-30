<!--
  CanvasCreateMenu — CoreUIBar dropdown for adding widgets to the active canvas.
  Dispatches custom events to bridge Svelte → React.
  Only visible when a canvas page is active.
-->

<script lang="ts">
  import { TriggerButton } from './lib/components/ui/trigger-button/index.js'
  import * as DropdownMenu from './lib/components/ui/dropdown-menu/index.js'
  import Icon from './svelte-plugin-ui/components/Icon.svelte'

  interface Props {
    config?: any
    canvasName?: string
    tabindex?: number
  }

  let { config = {}, canvasName = '', tabindex }: Props = $props()

  const widgetTypes = [
    { type: 'sticky-note', label: 'Sticky Note' },
    { type: 'markdown', label: 'Markdown' },
    { type: 'prototype', label: 'Prototype' },
  ]

  let menuOpen = $state(false)

  function addWidget(type: string) {
    document.dispatchEvent(new CustomEvent('storyboard:canvas:add-widget', {
      detail: { type, canvasName }
    }))
    menuOpen = false
  }
</script>

<DropdownMenu.Root bind:open={menuOpen}>
  <DropdownMenu.Trigger>
    {#snippet child({ props })}
      <TriggerButton
        active={menuOpen}
        size="icon-xl"
        aria-label={config.ariaLabel || 'Add widget'}
        {tabindex}
        {...props}
      >
        {#if config.icon}
          <Icon name={config.icon} size={16} {...(config.meta || {})} />
        {:else}
          +
        {/if}
      </TriggerButton>
    {/snippet}
  </DropdownMenu.Trigger>

  <DropdownMenu.Content side="top" align="start" sideOffset={16} class="min-w-[180px]" style={config.menuWidth ? `width: ${config.menuWidth}` : ''}>
    <DropdownMenu.Label>Add to canvas</DropdownMenu.Label>
    {#each widgetTypes as wt (wt.type)}
      <DropdownMenu.Item onclick={() => addWidget(wt.type)}>
        {wt.label}
      </DropdownMenu.Item>
    {/each}
    <DropdownMenu.Separator />
    <div class="px-2 py-1.5 text-xs text-muted-foreground">Supported in local development</div>
  </DropdownMenu.Content>
</DropdownMenu.Root>
