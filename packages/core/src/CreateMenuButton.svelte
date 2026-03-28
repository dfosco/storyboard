<!--
  CreateMenuButton — config-driven trigger for create/workshop features.
  Appears to the left of the command button in develop (inspect) mode.
  Menu label and items are defined by configs/create-menu.config.json.
-->

<script lang="ts">
  import { TriggerButton } from '$lib/components/ui/trigger-button/index.js'
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js'
  import * as Dialog from '$lib/components/ui/dialog/index.js'
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
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
          <path d="M5.433 2.304A4.494 4.494 0 0 0 3.5 6c0 1.598.832 3.002 2.09 3.802.518.328.929.923.902 1.64v.008l-.164 3.337a.75.75 0 1 1-1.498-.073l.163-3.34c.007-.14-.1-.313-.36-.465A5.986 5.986 0 0 1 2 6a5.994 5.994 0 0 1 2.567-4.92 1.482 1.482 0 0 1 1.673-.04c.462.296.76.827.76 1.423v2.076c0 .332.214.572.491.572.268 0 .492-.24.492-.572V2.463c0-.596.298-1.127.76-1.423a1.482 1.482 0 0 1 1.673.04A5.994 5.994 0 0 1 13 6a5.986 5.986 0 0 1-2.633 4.909c-.26.152-.367.325-.36.465l.164 3.34a.75.75 0 1 1-1.498.073l-.164-3.337v-.008c-.027-.717.384-1.312.902-1.64A4.494 4.494 0 0 0 11.5 6a4.494 4.494 0 0 0-1.933-3.696c-.024.017-.067.067-.067.159v2.076c0 1.074-.84 2.072-1.991 2.072-1.161 0-2.009-.998-2.009-2.072V2.463c0-.092-.043-.142-.067-.16Z"/>
        </svg>
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
  <Dialog.Root open={true} onOpenChange={(open) => { if (!open) closeOverlay() }}>
    <Dialog.Content class="sm:max-w-[480px] max-h-[80vh] flex flex-col">
      <activeFeature.overlay onClose={closeOverlay} />
    </Dialog.Content>
  </Dialog.Root>
{/if}
