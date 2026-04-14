<!--
  WorkshopPanel — floating dev panel with trigger, menu, and overlay.
  Plain Svelte + Tailwind. No shadcn component dependencies.
-->

<script lang="ts">
  import { onMount, onDestroy, type Component } from 'svelte'

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

  function showOverlay(id: string) {
    activeOverlay = id
    menuOpen = false
  }

  function closeOverlay() { activeOverlay = null }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === '.' && (e.metaKey || e.ctrlKey)) { visible = !visible; return }
    if (e.key === 'Escape') {
      if (activeOverlay) closeOverlay()
      else if (menuOpen) menuOpen = false
    }
  }

  function handleClickOutside(e: MouseEvent) {
    const t = e.target as HTMLElement
    if (menuOpen && !t.closest('[data-workshop-panel]')) menuOpen = false
  }

  onMount(() => {
    window.addEventListener('keydown', handleKeydown)
    document.addEventListener('click', handleClickOutside)

    // Allow external events to open a specific overlay (e.g. from CanvasCreateMenu)
    function handleOpenOverlay(e: Event) {
      const detail = (e as CustomEvent).detail
      if (detail?.overlayId) {
        showOverlay(detail.overlayId)
        visible = true
      }
    }
    document.addEventListener('storyboard:workshop:open-overlay', handleOpenOverlay)

    return () => {
      document.removeEventListener('storyboard:workshop:open-overlay', handleOpenOverlay)
    }
  })
  onDestroy(() => {
    window.removeEventListener('keydown', handleKeydown)
    document.removeEventListener('click', handleClickOutside)
  })
</script>

{#if visible}
  <div data-workshop-panel class="fixed bottom-6 right-[76px] z-[9999] font-sans">
    <!-- Trigger -->
    <button
      class="flex items-center p-3 bg-popover text-muted-foreground border border-border rounded-full cursor-pointer shadow-lg hover:scale-105 active:scale-95 transition-transform select-none"
      aria-label="Workshop"
      onclick={() => menuOpen = !menuOpen}
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" fill="currentColor"><path d="M5.433 2.304A4.494 4.494 0 0 0 3.5 6c0 1.598.832 3.002 2.09 3.802.518.328.929.923.902 1.64v.008l-.164 3.337a.75.75 0 1 1-1.498-.073l.163-3.34c.007-.14-.1-.313-.36-.465A5.986 5.986 0 0 1 2 6a5.994 5.994 0 0 1 2.567-4.92 1.482 1.482 0 0 1 1.673-.04c.462.296.76.827.76 1.423v2.076c0 .332.214.572.491.572.268 0 .492-.24.492-.572V2.463c0-.596.298-1.127.76-1.423a1.482 1.482 0 0 1 1.673.04A5.994 5.994 0 0 1 13 6a5.986 5.986 0 0 1-2.633 4.909c-.26.152-.367.325-.36.465l.164 3.34a.75.75 0 1 1-1.498.073l-.164-3.337v-.008c-.027-.717.384-1.312.902-1.64A4.494 4.494 0 0 0 11.5 6a4.494 4.494 0 0 0-1.933-3.696c-.024.017-.067.067-.067.159v2.076c0 1.074-.84 2.072-1.991 2.072-1.161 0-2.009-.998-2.009-2.072V2.463c0-.092-.043-.142-.067-.16Z"/></svg>
    </button>

    <!-- Menu -->
    {#if menuOpen}
      <div class="absolute bottom-14 right-0 min-w-[200px] bg-popover text-popover-foreground border border-border rounded-xl shadow-lg overflow-hidden">
        <div class="px-4 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Workshop</div>
        <div class="h-px bg-border"></div>
        {#each features as f (f.overlayId)}
          <button class="flex items-center gap-2 w-full px-4 py-2 text-sm bg-transparent border-none cursor-pointer text-left hover:bg-accent transition-colors" onclick={() => showOverlay(f.overlayId)}>
            <span class="text-sm">{f.icon || ''}</span> {f.label}
          </button>
        {/each}
        <div class="h-px bg-border"></div>
        <div class="px-4 py-1.5 text-[11px] text-muted-foreground">Dev-only tools</div>
      </div>
    {/if}

    <!-- Overlay -->
    {#if activeFeature}
      <!-- svelte-ignore a11y_no_static_element_interactions a11y_click_events_have_key_events -->
      <div class="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50" onclick={(e) => { if (e.target === e.currentTarget) closeOverlay() }}>
        <div class="w-full max-w-[480px]">
          <activeFeature.overlay onClose={closeOverlay} />
        </div>
      </div>
    {/if}
  </div>
{/if}
