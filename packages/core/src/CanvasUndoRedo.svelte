<!--
  CanvasUndoRedo — grouped undo/redo button bar.
-->
<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import * as Tooltip from './lib/components/ui/tooltip/index.js'

  interface Props {
    config?: any
    data?: any
    tabindex?: number
  }

  let { config = {}, data, tabindex = -1 }: Props = $props()

  let canUndo = $state(false)
  let canRedo = $state(false)

  function handleUndoRedoState(e: CustomEvent) {
    canUndo = !!e.detail?.canUndo
    canRedo = !!e.detail?.canRedo
  }

  onMount(() => {
    document.addEventListener('storyboard:canvas:undo-redo-state', handleUndoRedoState as EventListener)
  })

  onDestroy(() => {
    document.removeEventListener('storyboard:canvas:undo-redo-state', handleUndoRedoState as EventListener)
  })
</script>

{#if data}
  <div class="canvas-undo-bar" role="group" aria-label={config.ariaLabel || 'Undo and redo'}>
    <Tooltip.Root>
      <Tooltip.Trigger>
        <button
          class="canvas-undo-btn"
          onclick={() => data.undo()}
          disabled={!canUndo}
          aria-label="Undo"
          {tabindex}
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
            <path d="M6.78 1.97a.75.75 0 0 1 0 1.06L3.81 6h6.44A4.75 4.75 0 0 1 15 10.75v2.5a.75.75 0 0 1-1.5 0v-2.5a3.25 3.25 0 0 0-3.25-3.25H3.81l2.97 2.97a.75.75 0 1 1-1.06 1.06L1.47 7.28a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z" />
          </svg>
        </button>
      </Tooltip.Trigger>
      <Tooltip.Content side="top">Undo (⌘Z)</Tooltip.Content>
    </Tooltip.Root>
    <span class="canvas-undo-separator"></span>
    <Tooltip.Root>
      <Tooltip.Trigger>
        <button
          class="canvas-undo-btn"
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
{/if}

<style>
  .canvas-undo-bar {
    display: flex;
    align-items: center;
    border-radius: 10px;
    border: 2.5px solid var(--sb--trigger-border, var(--color-slate-400));
    background: var(--sb--trigger-bg, var(--color-slate-100));
    overflow: hidden;
  }

  .canvas-undo-btn {
    all: unset;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 38px;
    color: var(--sb--trigger-text, var(--color-slate-600));
    transition: background 120ms;
  }

  .canvas-undo-btn:hover:not(:disabled) {
    background: var(--sb--trigger-bg-hover, var(--color-slate-300));
  }

  .canvas-undo-btn:disabled {
    opacity: 0.3;
    cursor: default;
  }

  .canvas-undo-separator {
    width: 2px;
    height: 40px;
    background: var(--sb--trigger-border, var(--color-slate-400));
    flex-shrink: 0;
  }
</style>
