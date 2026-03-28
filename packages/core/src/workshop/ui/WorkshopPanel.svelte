<!--
  WorkshopPanel — floating dev panel with menu and overlay system.

  Replaces the Alpine.js-based workshop mount. Renders a fixed trigger
  button, a dropdown menu of enabled features, and a modal overlay
  that dynamically mounts the active feature's Svelte component.

  Styled with workshop.css + sb-* tokens.
-->

<script lang="ts">
  import { onMount, onDestroy, type Component } from 'svelte'
  import { fade } from 'svelte/transition'

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

  function toggle() {
    menuOpen = !menuOpen
  }

  function close() {
    menuOpen = false
  }

  function showOverlay(overlayId: string) {
    activeOverlay = overlayId
    menuOpen = false
  }

  function closeOverlay() {
    activeOverlay = null
  }

  function handleBackdropClick(e: MouseEvent) {
    if (e.target === e.currentTarget) {
      closeOverlay()
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    // Cmd/Ctrl+. toggles panel visibility
    if (e.key === '.' && (e.metaKey || e.ctrlKey)) {
      visible = !visible
      return
    }
    // Escape closes overlay or menu
    if (e.key === 'Escape') {
      if (activeOverlay) {
        closeOverlay()
      } else if (menuOpen) {
        close()
      }
    }
  }

  function handleClickOutside(e: MouseEvent) {
    const target = e.target as HTMLElement
    if (menuOpen && !target.closest('.sb-workshop-menu') && !target.closest('.sb-workshop-trigger')) {
      close()
    }
  }

  onMount(() => {
    window.addEventListener('keydown', handleKeydown)
    document.addEventListener('click', handleClickOutside)
  })

  onDestroy(() => {
    window.removeEventListener('keydown', handleKeydown)
    document.removeEventListener('click', handleClickOutside)
  })
</script>

{#if visible}
  <div class="sb-workshop-wrapper">
    <button class="sb-workshop-trigger" onclick={toggle} aria-label="Workshop" title="Workshop">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16"><path fill="currentColor" d="M5.433 2.304A4.494 4.494 0 0 0 3.5 6c0 1.598.832 3.002 2.09 3.802.518.328.929.923.902 1.64v.008l-.164 3.337a.75.75 0 1 1-1.498-.073l.163-3.34c.007-.14-.1-.313-.36-.465A5.986 5.986 0 0 1 2 6a5.994 5.994 0 0 1 2.567-4.92 1.482 1.482 0 0 1 1.673-.04c.462.296.76.827.76 1.423v2.076c0 .332.214.572.491.572.268 0 .492-.24.492-.572V2.463c0-.596.298-1.127.76-1.423a1.482 1.482 0 0 1 1.673.04A5.994 5.994 0 0 1 13 6a5.986 5.986 0 0 1-2.633 4.909c-.26.152-.367.325-.36.465l.164 3.34a.75.75 0 1 1-1.498.073l-.164-3.337v-.008c-.027-.717.384-1.312.902-1.64A4.494 4.494 0 0 0 11.5 6a4.494 4.494 0 0 0-1.933-3.696c-.024.017-.067.067-.067.159v2.076c0 1.074-.84 2.072-1.991 2.072-1.161 0-2.009-.998-2.009-2.072V2.463c0-.092-.043-.142-.067-.16Z"></path></svg>
    </button>

    {#if menuOpen}
      <div class="sb-workshop-menu" transition:fade={{ duration: 100 }}>
        <div class="sb-workshop-menu-header">Workshop</div>
        {#each features as feature (feature.overlayId)}
          <button class="sb-workshop-menu-item" onclick={() => showOverlay(feature.overlayId)}>
            <span class="sb-workshop-menu-icon">{feature.icon || ''}</span> {feature.label}
          </button>
        {/each}
        <div class="sb-workshop-hint">Dev-only tools</div>
      </div>
    {/if}

    {#if activeFeature}
      <div class="sb-workshop-backdrop" onclick={handleBackdropClick}>
        <activeFeature.overlay onClose={closeOverlay} />
      </div>
    {/if}
  </div>
{/if}

<style>
  /* Styles are in workshop.css (imported by mount.ts) */
</style>
