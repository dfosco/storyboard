<!--
  CreateMenuButton — config-driven trigger for create/workshop features.
  Appears to the left of the command button in develop (inspect) mode.
  Menu label and items are defined by core-ui.config.json buttons.create section.

  Icon options (set in config):
    - "icon": octicon name (e.g. "plus", "beaker") — rendered via Octicon.svelte
    - "character": raw character/emoji (e.g. "⌘", "🧩") — rendered as text
    - Falls back to "+" if neither is set
-->

<script lang="ts">
  import { TriggerButton } from '$lib/components/ui/trigger-button/index.js'
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js'
  import * as Panel from '$lib/components/ui/panel/index.js'
  import Octicon from './svelte-plugin-ui/components/Octicon.svelte'
  import type { Component } from 'svelte'

  interface CreateMenuFeature {
    name: string
    label: string
    overlayId: string
    overlay: Component<{ onClose?: () => void }>
  }

  interface CreateMenuConfig {
    label: string
    ariaLabel?: string
    icon?: string
    character?: string
    items?: Array<{ feature: string; label?: string }>
  }

  interface Props {
    features?: CreateMenuFeature[]
    config?: CreateMenuConfig
  }

  let { features = [], config = { label: 'Create' } }: Props = $props()

  let menuOpen = $state(false)
  let activeOverlay: string | null = $state(null)

  const activeFeature = $derived(
    activeOverlay ? features.find(f => f.overlayId === activeOverlay) ?? null : null
  )

  function showOverlay(id: string) {
    activeOverlay = id
    menuOpen = false
  }

  function closeOverlay() { activeOverlay = null }
</script>

<DropdownMenu.Root bind:open={menuOpen}>
  <DropdownMenu.Trigger>
    {#snippet child({ props })}
      <TriggerButton
        active={menuOpen}
        size="icon-xl"
        aria-label={config.ariaLabel || config.label}
        {...props}
      >
        {#if config.icon}
          <Octicon name={config.icon} size={16} />
        {:else if config.character}
          {config.character}
        {:else}
          +
        {/if}
      </TriggerButton>
    {/snippet}
  </DropdownMenu.Trigger>

  <DropdownMenu.Content side="top" align="end" sideOffset={16} class="min-w-[180px]">
    <DropdownMenu.Label>{config.label}</DropdownMenu.Label>
    {#each features as f (f.overlayId)}
      <DropdownMenu.Item onclick={() => showOverlay(f.overlayId)}>
        {f.label}
      </DropdownMenu.Item>
    {/each}
  </DropdownMenu.Content>
</DropdownMenu.Root>

{#if activeFeature}
  <Panel.Root open={true} onOpenChange={(open) => { if (!open) closeOverlay() }}>
    <Panel.Content>
      <activeFeature.overlay onClose={closeOverlay} />
    </Panel.Content>
  </Panel.Root>
{/if}
