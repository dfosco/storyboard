<!--
  SidePanel — push-style panel for Documentation and Inspector views.

  Can dock to the right edge (side) or bottom edge of the viewport.
  When open, pushes #root content via CSS classes on <html>.
  Background color follows the active mode's collar color.
  Resizable by dragging the panel edge.
  Position preference (side/bottom) is persisted in localStorage.

  Mounted lazily from CoreUIBar when a side panel trigger is clicked.
-->

<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { sidePanelState, closePanel, openPanel } from './stores/sidePanelStore.js'
  import type { SidePanelTab } from './stores/sidePanelStore.js'
  import Icon from './svelte-plugin-ui/components/Icon.svelte'
  import './sidepanel.css'

  interface Props {
    resizable?: boolean
    onClose?: () => void
  }

  let { resizable = true, onClose }: Props = $props()

  let DocPanel: any = $state(null)
  let InspectorPanel: any = $state(null)
  let panelWidth = $state(420)
  let panelHeight = $state(300)
  let panelPosition = $state<'side' | 'bottom'>('side')
  let dragging = $state(false)
  let closeBtnEl: HTMLButtonElement | null = $state(null)

  const MIN_WIDTH = 300
  const MAX_WIDTH = 900
  const MIN_HEIGHT = 200
  const MAX_HEIGHT = 600

  const isBottom = $derived(panelPosition === 'bottom')

  // Lazy-load tab content components
  $effect(() => {
    if ($sidePanelState.open && $sidePanelState.activeTab === 'docs' && !DocPanel) {
      import('./DocPanel.svelte').then(m => { DocPanel = m.default })
    }
    if ($sidePanelState.open && $sidePanelState.activeTab === 'inspector' && !InspectorPanel) {
      import('./InspectorPanel.svelte').then(m => { InspectorPanel = m.default })
    }
  })

  // Sync panel width to CSS custom property
  $effect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.style.setProperty('--sb--sidepanel-width', `${panelWidth}px`)
    }
  })

  // Sync panel height to CSS custom property
  $effect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.style.setProperty('--sb--sidepanel-height', `${panelHeight}px`)
    }
  })

  // Sync position class on <html>
  $effect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('sb-sidepanel-bottom', isBottom)
    }
  })

  // Auto-focus close button when panel opens
  $effect(() => {
    if ($sidePanelState.open && closeBtnEl) {
      requestAnimationFrame(() => closeBtnEl?.focus())
    }
  })

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape' && $sidePanelState.open) {
      e.preventDefault()
      closePanel()
      onClose?.()
    }
  }

  function togglePosition() {
    panelPosition = isBottom ? 'side' : 'bottom'
  }

  // --- Drag resize (side mode — horizontal) ---
  function startDragSide(e: PointerEvent) {
    if (!resizable) return
    e.preventDefault()
    dragging = true

    const startX = e.clientX
    const startWidth = panelWidth

    function onMove(ev: PointerEvent) {
      const delta = startX - ev.clientX
      panelWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, startWidth + delta))
    }

    function onUp() {
      dragging = false
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  // --- Drag resize (bottom mode — vertical) ---
  function startDragBottom(e: PointerEvent) {
    if (!resizable) return
    e.preventDefault()
    dragging = true

    const startY = e.clientY
    const startHeight = panelHeight

    function onMove(ev: PointerEvent) {
      const delta = startY - ev.clientY
      panelHeight = Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, startHeight + delta))
    }

    function onUp() {
      dragging = false
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  // Restore dimensions and position from localStorage
  onMount(() => {
    const savedWidth = localStorage.getItem('sb-sidepanel-width')
    if (savedWidth) {
      const w = parseInt(savedWidth, 10)
      if (w >= MIN_WIDTH && w <= MAX_WIDTH) panelWidth = w
    }

    const savedHeight = localStorage.getItem('sb-sidepanel-height')
    if (savedHeight) {
      const h = parseInt(savedHeight, 10)
      if (h >= MIN_HEIGHT && h <= MAX_HEIGHT) panelHeight = h
    }

    const savedPos = localStorage.getItem('sb-sidepanel-position')
    if (savedPos === 'side' || savedPos === 'bottom') panelPosition = savedPos
  })

  // Clean up position class on unmount
  onDestroy(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.remove('sb-sidepanel-bottom')
    }
  })

  // Persist width on change
  $effect(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('sb-sidepanel-width', String(panelWidth))
    }
  })

  // Persist height on change
  $effect(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('sb-sidepanel-height', String(panelHeight))
    }
  })

  // Persist position on change
  $effect(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('sb-sidepanel-position', panelPosition)
    }
  })
</script>

<svelte:window onkeydown={handleKeydown} />

{#if $sidePanelState.open}
  <div
    class="sb-sidepanel"
    class:sb-sidepanel--bottom={isBottom}
    class:sb-sidepanel-dragging={dragging}
    data-sidepanel
    role="complementary"
    aria-label={isBottom ? 'Bottom panel' : 'Side panel'}
    style={isBottom ? `height:${panelHeight}px` : `width:${panelWidth}px`}
  >
    <!-- Drag handle -->
    {#if resizable}
      <div
        class="sb-sidepanel-drag-handle"
        onpointerdown={isBottom ? startDragBottom : startDragSide}
        role="separator"
        aria-orientation={isBottom ? 'horizontal' : 'vertical'}
        aria-label="Resize panel"
      >
        <svg class="sb-sidepanel-grabber" width="4" height="16" viewBox="0 0 4 16" fill="currentColor">
          <circle cx="1" cy="2" r="1" /><circle cx="3" cy="2" r="1" />
          <circle cx="1" cy="6" r="1" /><circle cx="3" cy="6" r="1" />
          <circle cx="1" cy="10" r="1" /><circle cx="3" cy="10" r="1" />
          <circle cx="1" cy="14" r="1" /><circle cx="3" cy="14" r="1" />
        </svg>
      </div>
    {/if}

    <!-- Header — title, dock toggle, and close -->
    <div class="sb-sidepanel-header">
      <span class="sb-sidepanel-title">
        {$sidePanelState.activeTab === 'docs' ? 'Docs' : $sidePanelState.activeTab === 'inspector' ? 'Inspector' : ''}
      </span>
      <div class="sb-sidepanel-actions">
        <button
          class="sb-sidepanel-action-btn"
          onclick={togglePosition}
          aria-label={isBottom ? 'Dock to side' : 'Dock to bottom'}
          title={isBottom ? 'Dock to side' : 'Dock to bottom'}
        >
          {#if isBottom}
            <!-- Dock-to-side icon: rectangle with right portion divided -->
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.2">
              <rect x="1.5" y="1.5" width="11" height="11" rx="1.5" />
              <line x1="9" y1="1.5" x2="9" y2="12.5" />
            </svg>
          {:else}
            <!-- Dock-to-bottom icon: rectangle with bottom portion divided -->
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.2">
              <rect x="1.5" y="1.5" width="11" height="11" rx="1.5" />
              <line x1="1.5" y1="9" x2="12.5" y2="9" />
            </svg>
          {/if}
        </button>
        <button
          class="sb-sidepanel-action-btn"
          onclick={() => { closePanel(); onClose?.() }}
          aria-label="Close panel"
          bind:this={closeBtnEl}
        >
          <Icon name="primer/x" size={16} />
        </button>
      </div>
    </div>

    <!-- Content -->
    <div class="sb-sidepanel-body">
      {#if $sidePanelState.activeTab === 'docs' && DocPanel}
        <DocPanel />
      {:else if $sidePanelState.activeTab === 'inspector' && InspectorPanel}
        <InspectorPanel />
      {:else}
        <div class="sb-sidepanel-loading">
          <span class="sb-sidepanel-spinner"></span>
        </div>
      {/if}
    </div>
  </div>
{/if}

<style>
  .sb-sidepanel {
    position: fixed;
    top: var(--sb-branch-bar-height, 0px);
    right: 0;
    bottom: 0;
    width: var(--sb--sidepanel-width, 420px);
    z-index: 9998;
    display: flex;
    flex-direction: column;
    background-color: var(--bgColor-default, var(--sb--color-background, #ffffff));
    border-left: 1px solid var(--borderColor-default, var(--sb--color-border, #d0d7de));
    box-shadow: -4px 0 24px rgba(0, 0, 0, 0.15);
    font-family: "Mona Sans", -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
    color: var(--fgColor-default, var(--sb--color-foreground, #1f2328));
    animation: sb-sidepanel-slide-in 0.25s ease;
  }

  /* Bottom panel position */
  .sb-sidepanel--bottom {
    top: auto;
    right: 0;
    bottom: 0;
    left: 0;
    width: 100% !important;
    height: var(--sb--sidepanel-height, 300px);
    border-left: none;
    border-top: 1px solid var(--borderColor-default, var(--sb--color-border, #d0d7de));
    box-shadow: 0 -4px 24px rgba(0, 0, 0, 0.15);
    animation: sb-sidepanel-slide-up 0.25s ease;
  }

  .sb-sidepanel-dragging {
    user-select: none;
  }

  @keyframes sb-sidepanel-slide-in {
    from { transform: translateX(100%); }
    to { transform: translateX(0); }
  }

  @keyframes sb-sidepanel-slide-up {
    from { transform: translateY(100%); }
    to { transform: translateY(0); }
  }

  /* Mode-aware top accent bar */
  .sb-sidepanel::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    /* background: var(--sb--mode-color, var(--borderColor-default, var(--sb--color-border, #d0d7de))); */
  }

  /* Drag handle — side mode (left edge, vertical) */
  .sb-sidepanel-drag-handle {
    position: absolute;
    top: 0;
    left: -4px;
    bottom: 0;
    width: 8px;
    cursor: col-resize;
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  /* Drag handle — bottom mode (top edge, horizontal) */
  .sb-sidepanel--bottom .sb-sidepanel-drag-handle {
    top: -4px;
    left: 0;
    right: 0;
    bottom: auto;
    width: 100%;
    height: 8px;
    cursor: row-resize;
  }

  .sb-sidepanel-grabber {
    opacity: 0;
    color: rgba(0, 0, 0, 0.5);
    transition: opacity 0.15s ease;
    pointer-events: none;
  }

  .sb-sidepanel--bottom .sb-sidepanel-grabber {
    transform: rotate(90deg);
  }

  .sb-sidepanel-drag-handle:hover .sb-sidepanel-grabber,
  .sb-sidepanel-dragging .sb-sidepanel-grabber {
    opacity: 1;
  }

  /* Header */
  .sb-sidepanel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 8px 0;
    flex-shrink: 0;
  }

  .sb-sidepanel-title {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--fgColor-muted, var(--sb--color-muted-foreground, #656d76));
    padding-left: 4px;
  }

  .sb-sidepanel-actions {
    display: flex;
    align-items: center;
    gap: 2px;
  }

  .sb-sidepanel-action-btn {
    appearance: none;
    border: none;
    background: transparent;
    color: var(--fgColor-muted, var(--sb--color-muted-foreground, #656d76));
    cursor: pointer;
    padding: 6px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.15s ease, color 0.15s ease;
  }

  .sb-sidepanel-action-btn:hover {
    background: var(--bgColor-neutral-muted, rgba(110, 118, 129, 0.1));
    color: var(--fgColor-default, var(--sb--color-foreground, #1f2328));
  }

  /* Body */
  .sb-sidepanel-body {
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .sb-sidepanel-loading {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 120px;
  }

  .sb-sidepanel-spinner {
    width: 20px;
    height: 20px;
    border: 2px solid var(--borderColor-default, var(--sb--color-border, #d0d7de));
    border-top-color: var(--fgColor-muted, var(--sb--color-muted-foreground, #656d76));
    border-radius: 50%;
    animation: sb-spin 0.6s linear infinite;
  }

  @keyframes sb-spin {
    to { transform: rotate(360deg); }
  }

  /* Float the side panel inside the mode collar (present/plan/inspect) */
  :global(html.storyboard-mode-present) .sb-sidepanel:not(.sb-sidepanel--bottom),
  :global(html.storyboard-mode-plan) .sb-sidepanel:not(.sb-sidepanel--bottom),
  :global(html.storyboard-mode-inspect) .sb-sidepanel:not(.sb-sidepanel--bottom) {
    top: 12px;
    right: 12px;
    bottom: 12px;
    border-radius: var(--borderRadius-default);
    border-left: none;
  }

  /* Float the bottom panel inside the mode collar */
  :global(html.storyboard-mode-present) .sb-sidepanel--bottom,
  :global(html.storyboard-mode-plan) .sb-sidepanel--bottom,
  :global(html.storyboard-mode-inspect) .sb-sidepanel--bottom {
    left: 12px;
    right: 12px;
    bottom: 12px;
    width: auto !important;
    border-radius: var(--borderRadius-default);
    border-top: none;
  }

  /* Remove accent bar when collar provides mode context */
  :global(html.storyboard-mode-present) .sb-sidepanel::before,
  :global(html.storyboard-mode-plan) .sb-sidepanel::before,
  :global(html.storyboard-mode-inspect) .sb-sidepanel::before {
    display: none;
  }

  /* Mode-specific box-shadow matching #root treatment */
  :global(html.storyboard-mode-present) .sb-sidepanel {
    box-shadow: 0 0 7px 2px rgb(42 157 143 / 60%);
  }

  :global(html.storyboard-mode-plan) .sb-sidepanel {
    box-shadow: 0 0 7px 2px rgb(74 127 173 / 60%);
  }

  :global(html.storyboard-mode-inspect) .sb-sidepanel {
    box-shadow: 0 0 7px 2px rgb(118 85 164 / 60%);
  }
</style>
