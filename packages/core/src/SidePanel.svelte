<!--
  SidePanel — push-style side panel for Documentation and Inspector views.

  Fixed to the right edge of the viewport, full height.
  When open, pushes #root content via CSS class on <html>.
  Background color follows the active mode's collar color.
  Resizable by dragging the left edge.

  Mounted lazily from CoreUIBar when a side panel trigger is clicked.
-->

<script lang="ts">
  import { onMount } from 'svelte'
  import { sidePanelState, closePanel, openPanel } from './stores/sidePanelStore.js'
  import type { SidePanelTab } from './stores/sidePanelStore.js'
  import Octicon from './svelte-plugin-ui/components/Octicon.svelte'
  import './sidepanel.css'

  interface Props {
    resizable?: boolean
  }

  let { resizable = true }: Props = $props()

  let DocPanel: any = $state(null)
  let InspectorPanel: any = $state(null)
  let panelWidth = $state(420)
  let dragging = $state(false)

  const MIN_WIDTH = 300
  const MAX_WIDTH = 900

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
      document.documentElement.style.setProperty('--sidepanel-width', `${panelWidth}px`)
    }
  })

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape' && $sidePanelState.open) {
      e.preventDefault()
      closePanel()
    }
  }

  // --- Drag resize ---
  function startDrag(e: PointerEvent) {
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

  // Restore width from localStorage
  onMount(() => {
    const saved = localStorage.getItem('sb-sidepanel-width')
    if (saved) {
      const w = parseInt(saved, 10)
      if (w >= MIN_WIDTH && w <= MAX_WIDTH) panelWidth = w
    }
  })

  // Persist width on change
  $effect(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('sb-sidepanel-width', String(panelWidth))
    }
  })
</script>

<svelte:window onkeydown={handleKeydown} />

{#if $sidePanelState.open}
  <div
    class="sb-sidepanel"
    class:sb-sidepanel-dragging={dragging}
    data-sidepanel
    role="complementary"
    aria-label="Side panel"
    style:width="{panelWidth}px"
  >
    <!-- Drag handle -->
    {#if resizable}
      <div
        class="sb-sidepanel-drag-handle"
        onpointerdown={startDrag}
        role="separator"
        aria-orientation="vertical"
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

    <!-- Header — title and close -->
    <div class="sb-sidepanel-header">
      <span class="sb-sidepanel-title">
        {$sidePanelState.activeTab === 'docs' ? 'Docs' : $sidePanelState.activeTab === 'inspector' ? 'Inspector' : ''}
      </span>
      <button
        class="sb-sidepanel-close"
        onclick={closePanel}
        aria-label="Close side panel"
      >
        <Octicon name="x" size={16} />
      </button>
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
    top: 0;
    right: 0;
    bottom: 0;
    width: var(--sidepanel-width, 420px);
    z-index: 9998;
    display: flex;
    flex-direction: column;
    background-color: var(--bgColor-default, #0d1117);
    border-left: 1px solid var(--borderColor-default, #30363d);
    box-shadow: -4px 0 24px rgba(0, 0, 0, 0.15);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
    color: var(--fgColor-default, #e6edf3);
    animation: sb-sidepanel-slide-in 0.25s ease;
  }

  .sb-sidepanel-dragging {
    user-select: none;
  }

  @keyframes sb-sidepanel-slide-in {
    from { transform: translateX(100%); }
    to { transform: translateX(0); }
  }

  /* Mode-aware top accent bar */
  .sb-sidepanel::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: var(--mode-color, var(--borderColor-default, #30363d));
  }

  /* Drag handle */
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

  .sb-sidepanel-grabber {
    opacity: 0;
    color: rgba(0, 0, 0, 0.5);
    transition: opacity 0.15s ease;
    pointer-events: none;
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
    color: var(--fgColor-muted, #848d97);
    padding-left: 4px;
  }

  .sb-sidepanel-close {
    appearance: none;
    border: none;
    background: transparent;
    color: var(--fgColor-muted, #848d97);
    cursor: pointer;
    padding: 6px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.15s ease, color 0.15s ease;
  }

  .sb-sidepanel-close:hover {
    background: var(--bgColor-neutral-muted, rgba(110, 118, 129, 0.1));
    color: var(--fgColor-default, #e6edf3);
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
    border: 2px solid var(--borderColor-default, #30363d);
    border-top-color: var(--fgColor-muted, #848d97);
    border-radius: 50%;
    animation: sb-spin 0.6s linear infinite;
  }

  @keyframes sb-spin {
    to { transform: rotate(360deg); }
  }

  /* Float the panel inside the mode collar (present/plan/inspect) */
  :global(html.storyboard-mode-present) .sb-sidepanel,
  :global(html.storyboard-mode-plan) .sb-sidepanel,
  :global(html.storyboard-mode-inspect) .sb-sidepanel {
    top: 12px;
    right: 12px;
    bottom: 12px;
    border-radius: var(--borderRadius-default);
    border-left: none;
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
