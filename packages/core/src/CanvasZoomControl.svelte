<!--
  CanvasZoomControl — zoom in/out/reset bar for canvas pages.
-->
<script lang="ts">
  import * as Tooltip from './lib/components/ui/tooltip/index.js'

  interface Props {
    config?: any
    data?: any
    zoom?: number
    tabindex?: number
  }

  let { config = {}, data, zoom = 100, tabindex = -1 }: Props = $props()
</script>

{#if data}
  <div class="canvas-zoom-bar" role="group" aria-label={config.ariaLabel || 'Zoom controls'}>
    <Tooltip.Root>
      <Tooltip.Trigger>
        <button
          class="canvas-zoom-btn"
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
          class="canvas-zoom-label"
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
          class="canvas-zoom-btn"
          onclick={() => data.zoomIn(zoom)}
          disabled={zoom >= data.ZOOM_MAX}
          aria-label="Increase zoom"
          tabindex={-1}
        >+</button>
      </Tooltip.Trigger>
      <Tooltip.Content side="top">Increase zoom</Tooltip.Content>
    </Tooltip.Root>
  </div>
{/if}

<style>
  .canvas-zoom-bar {
    display: flex;
    align-items: center;
    border-radius: 10px;
    border: 2.5px solid var(--sb--trigger-border, var(--color-slate-400));
    background: var(--sb--trigger-bg, var(--color-slate-100));
    overflow: hidden;
  }

  .canvas-zoom-btn {
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

  .canvas-zoom-btn:hover:not(:disabled) {
    background: var(--sb--trigger-bg-hover, var(--color-slate-300));
  }

  .canvas-zoom-btn:disabled {
    opacity: 0.3;
    cursor: default;
  }

  .canvas-zoom-label {
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
    border-left: 2px solid var(--sb--trigger-border, var(--color-slate-400));
    border-right: 2px solid var(--sb--trigger-border, var(--color-slate-400));
    transition: background 120ms;
  }

  .canvas-zoom-label:hover {
    background: var(--sb--trigger-bg-hover, var(--color-slate-300));
  }
</style>
