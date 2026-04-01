<!--
  CanvasZoomControl — zoom in/out/reset bar for canvas pages.
  Extracted from CoreUIBar to be config-driven.
-->

<script lang="ts">
  interface Props {
    config?: any
    data?: {
      zoomIn: (zoom: number) => void
      zoomOut: (zoom: number) => void
      zoomReset: () => void
      ZOOM_MIN: number
      ZOOM_MAX: number
    }
    zoom?: number
    tabindex?: number
  }

  let { config = {}, data, zoom = 100, tabindex = -1 }: Props = $props()
</script>

{#if data}
  <div class="canvas-zoom-bar" role="group" aria-label={config.ariaLabel || 'Zoom controls'}>
    <button
      class="canvas-zoom-btn"
      onclick={() => data.zoomOut(zoom)}
      disabled={zoom <= data.ZOOM_MIN}
      aria-label="Zoom out"
      title="Zoom out"
      {tabindex}
    >−</button>
    <button
      class="canvas-zoom-label"
      onclick={() => data.zoomReset()}
      aria-label="Reset zoom to 100%"
      title="Reset to 100%"
      tabindex={-1}
    >{zoom}%</button>
    <button
      class="canvas-zoom-btn"
      onclick={() => data.zoomIn(zoom)}
      disabled={zoom >= data.ZOOM_MAX}
      aria-label="Zoom in"
      title="Zoom in"
      tabindex={-1}
    >+</button>
  </div>
{/if}

<style>
  .canvas-zoom-bar {
    display: flex;
    align-items: center;
    border-radius: 10px;
    border: 1.5px solid var(--trigger-border, var(--color-slate-400));
    background: var(--trigger-bg, var(--color-slate-100));
    overflow: hidden;
  }

  .canvas-zoom-btn {
    all: unset;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 32px;
    font-size: 16px;
    font-weight: 600;
    color: var(--trigger-text, var(--color-slate-600));
    transition: background 120ms;
  }

  .canvas-zoom-btn:hover:not(:disabled) {
    background: var(--trigger-bg-hover, var(--color-slate-300));
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
    height: 32px;
    padding: 0 4px;
    font-size: 11px;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    color: var(--trigger-text, var(--color-slate-600));
    border-left: 1.5px solid var(--trigger-border, var(--color-slate-400));
    border-right: 1.5px solid var(--trigger-border, var(--color-slate-400));
    transition: background 120ms;
  }

  .canvas-zoom-label:hover {
    background: var(--trigger-bg-hover, var(--color-slate-300));
  }
</style>
