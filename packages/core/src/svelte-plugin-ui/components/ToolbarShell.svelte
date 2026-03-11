<!--
  ToolbarShell — right-side toolbar container with two stacked groups:
    1. Mode-specific tools (from the active mode's `tools` array)
    2. Developer tools (from the active mode's `devTools` array)

  Fixed to the right side of the viewport, above the ModeSwitch.
  Only renders when the current mode provides tools or devTools.
-->

<script lang="ts">
  import { modeState } from '../stores/modeStore.js'
  import type { ModeToolConfig } from '../stores/types.js'

  let tools: ModeToolConfig[] = $derived(
    ($modeState.currentModeConfig as any)?.tools ?? []
  )
  let devTools: ModeToolConfig[] = $derived(
    ($modeState.currentModeConfig as any)?.devTools ?? []
  )
</script>

{#if tools.length > 0 || devTools.length > 0}
  <div class="sb-toolbar-shell">
    {#if tools.length > 0}
      <div class="sb-toolbar" role="toolbar" aria-label="Mode tools">
        <span class="sb-toolbar-label">Tools</span>
        {#each tools as tool (tool.id)}
          <button
            class="sb-tool-btn"
            onclick={tool.action}
            title={tool.label}
          >
            {tool.label}
          </button>
        {/each}
      </div>
    {/if}

    {#if devTools.length > 0}
      <div class="sb-toolbar" role="toolbar" aria-label="Developer tools">
        <span class="sb-toolbar-label">Dev</span>
        {#each devTools as tool (tool.id)}
          <button
            class="sb-tool-btn"
            onclick={tool.action}
            title={tool.label}
          >
            {tool.label}
          </button>
        {/each}
      </div>
    {/if}
  </div>
{/if}

<style>
  .sb-toolbar-shell {
    position: fixed;
    right: 20px;
    bottom: 80px;
    z-index: 9998;
    display: flex;
    flex-direction: column;
    gap: 8px;
    align-items: flex-end;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
  }

  .sb-toolbar {
    display: flex;
    flex-direction: column;
    gap: 2px;
    background: var(--bgColor-muted, #161b22);
    border: 1px solid var(--borderColor-default, #30363d);
    border-radius: 12px;
    padding: 4px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
  }

  .sb-tool-btn {
    appearance: none;
    border: none;
    background: transparent;
    color: var(--fgColor-muted, #848d97);
    font-size: 12px;
    font-weight: 500;
    padding: 6px 10px;
    border-radius: 8px;
    cursor: pointer;
    transition: background 0.15s ease, color 0.15s ease;
    white-space: nowrap;
    text-align: left;
    line-height: 1;
  }

  .sb-tool-btn:hover {
    color: var(--fgColor-default, #e6edf3);
    background: var(--bgColor-neutral-muted, rgba(110, 118, 129, 0.1));
  }

  .sb-toolbar-label {
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--fgColor-muted, #848d97);
    padding: 4px 10px 2px;
    opacity: 0.6;
  }
</style>
