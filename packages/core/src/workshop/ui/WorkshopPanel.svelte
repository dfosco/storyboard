<!--
  WorkshopPanel — floating dev panel with menu and overlay system.
  Uses shadcn DropdownMenu for the feature menu and Dialog for the overlay.
-->

<script lang="ts">
  import { onMount, onDestroy, type Component } from 'svelte'
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js'
  import * as Dialog from '$lib/components/ui/dialog/index.js'

  interface WorkshopFeature {
    name: string
    label: string
    icon?: string
    overlayId: string
    overlay: Component<{ onClose?: () => void }>
  }

  interface Props {
    features?: WorkshopFeature[]
  }

  let { features = [] }: Props = $props()

  let menuOpen = $state(false)
  let activeOverlay: string | null = $state(null)
  let visible = $state(true)

  const activeFeature = $derived(
    activeOverlay ? features.find((f) => f.overlayId === activeOverlay) ?? null : null
  )

  const dialogOpen = $derived(activeFeature !== null)

  function showOverlay(overlayId: string) {
    activeOverlay = overlayId
    menuOpen = false
  }

  function closeOverlay() {
    activeOverlay = null
  }

  function handleDialogChange(open: boolean) {
    if (!open) closeOverlay()
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === '.' && (e.metaKey || e.ctrlKey)) {
      visible = !visible
    }
  }

  onMount(() => {
    window.addEventListener('keydown', handleKeydown)
  })

  onDestroy(() => {
    window.removeEventListener('keydown', handleKeydown)
  })
</script>

{#if visible}
  <div class="fixed bottom-6 right-[76px] z-[9999] font-sans">
    <DropdownMenu.Root bind:open={menuOpen}>
      <DropdownMenu.Trigger>
        {#snippet child({ props })}
          <button
            {...props}
            class="flex items-center p-3 bg-popover text-muted-foreground border border-border rounded-full cursor-pointer shadow-lg transition-transform duration-150 hover:scale-105 active:scale-[0.97] select-none"
            aria-label="Workshop"
            title="Workshop"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16"><path fill="currentColor" d="M5.433 2.304A4.494 4.494 0 0 0 3.5 6c0 1.598.832 3.002 2.09 3.802.518.328.929.923.902 1.64v.008l-.164 3.337a.75.75 0 1 1-1.498-.073l.163-3.34c.007-.14-.1-.313-.36-.465A5.986 5.986 0 0 1 2 6a5.994 5.994 0 0 1 2.567-4.92 1.482 1.482 0 0 1 1.673-.04c.462.296.76.827.76 1.423v2.076c0 .332.214.572.491.572.268 0 .492-.24.492-.572V2.463c0-.596.298-1.127.76-1.423a1.482 1.482 0 0 1 1.673.04A5.994 5.994 0 0 1 13 6a5.986 5.986 0 0 1-2.633 4.909c-.26.152-.367.325-.36.465l.164 3.34a.75.75 0 1 1-1.498.073l-.164-3.337v-.008c-.027-.717.384-1.312.902-1.64A4.494 4.494 0 0 0 11.5 6a4.494 4.494 0 0 0-1.933-3.696c-.024.017-.067.067-.067.159v2.076c0 1.074-.84 2.072-1.991 2.072-1.161 0-2.009-.998-2.009-2.072V2.463c0-.092-.043-.142-.067-.16Z"></path></svg>
          </button>
        {/snippet}
      </DropdownMenu.Trigger>
      <DropdownMenu.Content side="top" align="end" class="min-w-[200px]">
        <DropdownMenu.Label>Workshop</DropdownMenu.Label>
        <DropdownMenu.Separator />
        {#each features as feature (feature.overlayId)}
          <DropdownMenu.Item onclick={() => showOverlay(feature.overlayId)}>
            <span class="mr-2 text-sm">{feature.icon || ''}</span>
            {feature.label}
          </DropdownMenu.Item>
        {/each}
        <DropdownMenu.Separator />
        <DropdownMenu.Label class="text-xs font-normal text-muted-foreground">Dev-only tools</DropdownMenu.Label>
      </DropdownMenu.Content>
    </DropdownMenu.Root>

    <Dialog.Root open={dialogOpen} onOpenChange={handleDialogChange}>
      <Dialog.Content class="sm:max-w-[480px] p-0 gap-0">
        {#if activeFeature}
          <activeFeature.overlay onClose={closeOverlay} />
        {/if}
      </Dialog.Content>
    </Dialog.Root>
  </div>
{/if}
