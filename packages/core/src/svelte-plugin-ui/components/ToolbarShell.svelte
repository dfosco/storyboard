<!--
  ToolbarShell — right-side toolbar container with two stacked groups:
    1. Mode-specific tools (group: 'tools')
    2. Developer tools (group: 'dev')

  Reads from the tool store, which sources from the declarative tool
  registry (modes.config.json) + runtime state (setToolState/setToolAction).

  Fixed to the right side of the viewport, above the ModeSwitch.
  Only renders when the current mode has visible tools.
-->

<script lang="ts">
  import { toolState } from '../stores/toolStore.js'

  function handleClick(tool: any) {
    if (tool.action && tool.state.enabled && !tool.state.busy) {
      tool.action()
    }
  }
</script>

{#if $toolState.tools.length > 0 || $toolState.devTools.length > 0}
  <div class="sb-toolbar-shell">
    {#if $toolState.tools.length > 0}
      <div class="sb-toolbar" role="toolbar" aria-label="Mode tools">
        <span class="sb-toolbar-label">Tools</span>
        {#each $toolState.tools as tool (tool.id)}
          <button
            class="sb-tool-btn"
            class:sb-tool-btn-active={tool.state.active}
            class:sb-tool-btn-busy={tool.state.busy}
            onclick={() => handleClick(tool)}
            disabled={!tool.state.enabled || tool.state.busy || !tool.action}
            title={tool.label}
          >
            {tool.label}
            {#if tool.state.badge != null}
              <span class="sb-tool-badge">{tool.state.badge}</span>
            {/if}
          </button>
        {/each}
      </div>
    {/if}

    {#if $toolState.devTools.length > 0}
      <div class="sb-toolbar" role="toolbar" aria-label="Developer tools">
        <span class="sb-toolbar-label">Dev</span>
        {#each $toolState.devTools as tool (tool.id)}
          <button
            class="sb-tool-btn"
            class:sb-tool-btn-active={tool.state.active}
            class:sb-tool-btn-busy={tool.state.busy}
            onclick={() => handleClick(tool)}
            disabled={!tool.state.enabled || tool.state.busy || !tool.action}
            title={tool.label}
          >
            {tool.label}
            {#if tool.state.badge != null}
              <span class="sb-tool-badge">{tool.state.badge}</span>
            {/if}
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
    font-family: "Mona Sans", -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
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
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .sb-tool-btn:hover:not(:disabled) {
    color: var(--fgColor-default, #e6edf3);
    background: var(--bgColor-neutral-muted, rgba(110, 118, 129, 0.1));
  }

  .sb-tool-btn:disabled {
    opacity: 0.4;
    cursor: default;
  }

  .sb-tool-btn-active {
    color: var(--fgColor-default, #e6edf3);
    background: var(--bgColor-neutral-muted, rgba(110, 118, 129, 0.15));
  }

  .sb-tool-btn-busy {
    opacity: 0.6;
  }

  .sb-tool-badge {
    font-size: 10px;
    font-weight: 600;
    background: var(--bgColor-accent-muted, rgba(56, 139, 253, 0.15));
    color: var(--fgColor-accent, #58a6ff);
    padding: 1px 5px;
    border-radius: 10px;
    line-height: 1.2;
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
