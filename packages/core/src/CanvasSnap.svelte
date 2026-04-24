<!--
  CanvasSnap — standalone snap-to-grid toggle button.
-->
<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import * as Tooltip from './lib/components/ui/tooltip/index.js'
  import Icon from './svelte-plugin-ui/components/Icon.svelte'

  interface Props {
    config?: any
    data?: any
    tabindex?: number
  }

  let { config = {}, data, tabindex = -1 }: Props = $props()

  let snapEnabled = $state(false)

  function handleSnapState(e: CustomEvent) {
    snapEnabled = !!e.detail?.snapEnabled
  }

  onMount(() => {
    document.addEventListener('storyboard:canvas:snap-state', handleSnapState as EventListener)
    // Broadcast configured gridSize to React on mount
    const gridSize = config.gridSize
    if (gridSize) {
      document.dispatchEvent(new CustomEvent('storyboard:canvas:grid-size', {
        detail: { gridSize }
      }))
    }
    // Request current snap state from React (may have dispatched before we mounted)
    document.dispatchEvent(new CustomEvent('storyboard:canvas:snap-state-request'))
  })

  onDestroy(() => {
    document.removeEventListener('storyboard:canvas:snap-state', handleSnapState as EventListener)
  })
</script>

{#if data}
  <Tooltip.Root>
    <Tooltip.Trigger>
      <button
        class="canvas-snap-btn"
        class:canvas-snap-btn-active={snapEnabled}
        onclick={() => data.toggleSnap()}
        aria-label={config.label || 'Snap to grid'}
        aria-pressed={snapEnabled}
        {tabindex}
      >
        <Icon name={config.icon || 'iconoir/view-grid'} size={16} {...(config.meta || {})} />
      </button>
    </Tooltip.Trigger>
    <Tooltip.Content side="top">{snapEnabled ? (config.labelOn || 'Snap to grid (on)') : (config.labelOff || 'Snap to grid (off)')}</Tooltip.Content>
  </Tooltip.Root>
{/if}

<style>
  .canvas-snap-btn {
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

  .canvas-snap-btn:hover:not(:disabled) {
    background: var(--sb--trigger-bg-hover, var(--color-slate-300));
  }

  .canvas-snap-btn-active {
    background: var(--sb--trigger-bg-hover, var(--color-slate-300));
    border-color: var(--sb--trigger-text, var(--color-slate-600));
  }

  .canvas-snap-btn-active:hover {
    opacity: 0.85;
  }
</style>
