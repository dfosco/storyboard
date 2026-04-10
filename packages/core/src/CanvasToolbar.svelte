<!--
  CanvasToolbar — zoom, undo/redo, and fit controls for canvas pages.
  Rendered in the CoreUIBar canvas toolbar slot.
-->

<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import * as Tooltip from './lib/components/ui/tooltip/index.js'
  import Icon from './svelte-plugin-ui/components/Icon.svelte'

  interface Props {
    config?: any
    data?: {
      zoomIn: (zoom: number) => void
      zoomOut: (zoom: number) => void
      zoomReset: () => void
      zoomToFit: () => void
      undo: () => void
      redo: () => void
      toggleSnap: () => void
      ZOOM_MIN: number
      ZOOM_MAX: number
    }
    zoom?: number
    tabindex?: number
  }

  let { config = {}, data, zoom = 100, tabindex = -1 }: Props = $props()

  let canUndo = $state(false)
  let canRedo = $state(false)
  let snapEnabled = $state(false)

  function handleUndoRedoState(e: CustomEvent) {
    canUndo = !!e.detail?.canUndo
    canRedo = !!e.detail?.canRedo
  }

  function handleSnapState(e: CustomEvent) {
    snapEnabled = !!e.detail?.snapEnabled
  }

  onMount(() => {
    document.addEventListener('storyboard:canvas:undo-redo-state', handleUndoRedoState as EventListener)
    document.addEventListener('storyboard:canvas:snap-state', handleSnapState as EventListener)
    // Broadcast configured gridSize to React on mount
    if (config.gridSize) {
      document.dispatchEvent(new CustomEvent('storyboard:canvas:grid-size', {
        detail: { gridSize: config.gridSize }
      }))
    }
  })

  onDestroy(() => {
    document.removeEventListener('storyboard:canvas:undo-redo-state', handleUndoRedoState as EventListener)
    document.removeEventListener('storyboard:canvas:snap-state', handleSnapState as EventListener)
  })
</script>

{#if data}
  <div class="canvas-toolbar-group">
    <div class="canvas-toolbar-bar" role="group" aria-label={config.ariaLabel || 'Zoom controls'}>
      <Tooltip.Root>
        <Tooltip.Trigger>
          <button
            class="canvas-toolbar-btn"
            onclick={() => data.zoomOut(zoom)}
            disabled={zoom <= data.ZOOM_MIN}
            aria-label="Decrease zoom"
            {tabindex}
          >−</button>
        </Tooltip.Trigger>
        <Tooltip.Content side="top">Decrease zoom</Tooltip.Content>
      </Tooltip.Root>
      <Tooltip.Root>
        <Tooltip.Trigger>
          <button
            class="canvas-toolbar-label"
            onclick={() => data.zoomReset()}
            aria-label="Zoom to 100%"
            tabindex={-1}
          >{zoom}%</button>
        </Tooltip.Trigger>
        <Tooltip.Content side="top">Zoom to 100%</Tooltip.Content>
      </Tooltip.Root>
      <Tooltip.Root>
        <Tooltip.Trigger>
          <button
            class="canvas-toolbar-btn"
            onclick={() => data.zoomIn(zoom)}
            disabled={zoom >= data.ZOOM_MAX}
            aria-label="Increase zoom"
            tabindex={-1}
          >+</button>
        </Tooltip.Trigger>
        <Tooltip.Content side="top">Increase zoom</Tooltip.Content>
      </Tooltip.Root>
    </div>
    <Tooltip.Root>
      <Tooltip.Trigger>
        <button
          class="canvas-toolbar-standalone"
          onclick={() => data.zoomToFit()}
          aria-label="Zoom to objects"
          tabindex={-1}
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
            <path d="M1.75 10a.75.75 0 0 1 .75.75v2.5c0 .138.112.25.25.25h2.5a.75.75 0 0 1 0 1.5h-2.5A1.75 1.75 0 0 1 1 13.25v-2.5a.75.75 0 0 1 .75-.75Zm12.5 0a.75.75 0 0 1 .75.75v2.5A1.75 1.75 0 0 1 13.25 15h-2.5a.75.75 0 0 1 0-1.5h2.5a.25.25 0 0 0 .25-.25v-2.5a.75.75 0 0 1 .75-.75ZM2.75 1a1.75 1.75 0 0 0-1.75 1.75v2.5a.75.75 0 0 0 1.5 0v-2.5a.25.25 0 0 1 .25-.25h2.5a.75.75 0 0 0 0-1.5h-2.5Zm10.5 0h-2.5a.75.75 0 0 0 0 1.5h2.5a.25.25 0 0 1 .25.25v2.5a.75.75 0 0 0 1.5 0v-2.5A1.75 1.75 0 0 0 13.25 1Z" />
          </svg>
        </button>
      </Tooltip.Trigger>
      <Tooltip.Content side="top">Zoom to objects</Tooltip.Content>
    </Tooltip.Root>
    <div class="canvas-toolbar-bar" role="group" aria-label="Undo and redo">
      <Tooltip.Root>
        <Tooltip.Trigger>
          <button
            class="canvas-toolbar-btn"
            onclick={() => data.undo()}
            disabled={!canUndo}
            aria-label="Undo"
            tabindex={-1}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
              <path d="M6.78 1.97a.75.75 0 0 1 0 1.06L3.81 6h6.44A4.75 4.75 0 0 1 15 10.75v2.5a.75.75 0 0 1-1.5 0v-2.5a3.25 3.25 0 0 0-3.25-3.25H3.81l2.97 2.97a.75.75 0 1 1-1.06 1.06L1.47 7.28a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z" />
            </svg>
          </button>
        </Tooltip.Trigger>
        <Tooltip.Content side="top">Undo (⌘Z)</Tooltip.Content>
      </Tooltip.Root>
      <span class="canvas-toolbar-separator"></span>
      <Tooltip.Root>
        <Tooltip.Trigger>
          <button
            class="canvas-toolbar-btn"
            onclick={() => data.redo()}
            disabled={!canRedo}
            aria-label="Redo"
            tabindex={-1}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
              <path d="M9.22 1.97a.75.75 0 0 0 0 1.06L12.19 6H5.75A4.75 4.75 0 0 0 1 10.75v2.5a.75.75 0 0 0 1.5 0v-2.5a3.25 3.25 0 0 1 3.25-3.25h6.44l-2.97 2.97a.75.75 0 1 0 1.06 1.06l4.25-4.25a.75.75 0 0 0 0-1.06l-4.25-4.25a.75.75 0 0 0-1.06 0Z" />
            </svg>
          </button>
        </Tooltip.Trigger>
        <Tooltip.Content side="top">Redo (⌘⇧Z)</Tooltip.Content>
      </Tooltip.Root>
    </div>
    <Tooltip.Root>
      <Tooltip.Trigger>
        <button
          class="canvas-toolbar-standalone"
          class:canvas-toolbar-standalone-active={snapEnabled}
          onclick={() => data.toggleSnap()}
          aria-label="Snap to grid"
          aria-pressed={snapEnabled}
          tabindex={-1}
        >
          <Icon name={snapEnabled ? 'iconoir/dots-grid-3x3-solid' : 'iconoir/dots-grid-3x3'} size={16} />
        </button>
      </Tooltip.Trigger>
      <Tooltip.Content side="top">{snapEnabled ? 'Snap to grid (on)' : 'Snap to grid (off)'}</Tooltip.Content>
    </Tooltip.Root>
  </div>
{/if}

<style>
  .canvas-toolbar-group {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .canvas-toolbar-bar {
    display: flex;
    align-items: center;
    border-radius: 10px;
    border: 2.5px solid var(--sb--trigger-border, var(--color-slate-400));
    background: var(--sb--trigger-bg, var(--color-slate-100));
    overflow: hidden;
  }

  .canvas-toolbar-btn {
    all: unset;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 38px;
    font-size: 16px;
    font-weight: 600;
    color: var(--sb--trigger-text, var(--color-slate-600));
    transition: background 120ms;
  }

  .canvas-toolbar-btn:hover:not(:disabled) {
    background: var(--sb--trigger-bg-hover, var(--color-slate-300));
  }

  .canvas-toolbar-btn:disabled {
    opacity: 0.3;
    cursor: default;
  }

  .canvas-toolbar-label {
    all: unset;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 48px;
    height: 38px;
    padding: 0 4px;
    font-size: 13px;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    color: var(--sb--trigger-text, var(--color-slate-600));
    border-left: 2.5px solid var(--sb--trigger-border, var(--color-slate-400));
    border-right: 2.5px solid var(--sb--trigger-border, var(--color-slate-400));
    transition: background 120ms;
  }

  .canvas-toolbar-label:hover {
    background: var(--sb--trigger-bg-hover, var(--color-slate-300));
  }

  .canvas-toolbar-standalone {
    all: unset;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 38px;
    height: 38px;
    border-radius: 10px;
    border: 2.5px solid var(--sb--trigger-border, var(--color-slate-400));
    background: var(--sb--trigger-bg, var(--color-slate-100));
    color: var(--sb--trigger-text, var(--color-slate-600));
    transition: background 120ms;
  }

  .canvas-toolbar-standalone:hover:not(:disabled) {
    background: var(--sb--trigger-bg-hover, var(--color-slate-300));
  }

  .canvas-toolbar-standalone:disabled {
    opacity: 0.3;
    cursor: default;
  }

  .canvas-toolbar-standalone-active {
    background: var(--sb--trigger-text, var(--color-slate-600));
    color: var(--sb--trigger-bg, var(--color-slate-100));
    border-color: var(--sb--trigger-text, var(--color-slate-600));
  }

  .canvas-toolbar-standalone-active:hover {
    opacity: 0.85;
  }

  .canvas-toolbar-separator {
    width: 2.5px;
    height: 24px;
    background: var(--sb--trigger-border, var(--color-slate-400));
    flex-shrink: 0;
  }
</style>
