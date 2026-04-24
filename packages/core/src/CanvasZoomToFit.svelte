<!--
  CanvasZoomToFit — standalone zoom-to-objects button.
-->
<script lang="ts">
  import * as Tooltip from './lib/components/ui/tooltip/index.js'
  import Icon from './svelte-plugin-ui/components/Icon.svelte'

  interface Props {
    config?: any
    data?: any
    tabindex?: number
  }

  let { config = {}, data, tabindex = -1 }: Props = $props()
</script>

{#if data}
  <Tooltip.Root>
    <Tooltip.Trigger>
      <button
        class="canvas-standalone-btn"
        onclick={() => data.zoomToFit()}
        aria-label={config.label || 'Zoom to objects'}
        {tabindex}
      >
        <Icon name={config.icon || 'iconoir/square-3d-three-points'} size={16} {...(config.meta || {})} />
      </button>
    </Tooltip.Trigger>
    <Tooltip.Content side="top">{config.label || 'Zoom to objects'}</Tooltip.Content>
  </Tooltip.Root>
{/if}

<style>
  .canvas-standalone-btn {
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

  .canvas-standalone-btn:hover {
    background: var(--sb--trigger-bg-hover, var(--color-slate-300));
  }
</style>
