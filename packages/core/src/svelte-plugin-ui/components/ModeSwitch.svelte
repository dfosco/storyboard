<!--
  ModeSwitch — segmented toggle for switching between design modes.

  Renders as a fixed pill at the bottom-center of the viewport.
  Only visible when two or more modes are registered.

  Styled with Tachyons utilities + sb-* custom properties.
-->

<script lang="ts">
  import { modeState, switchMode } from '../stores/modeStore.js'
</script>

{#if $modeState.switcherVisible && $modeState.modes.length >= 2}
  <div class="sb-mode-switch" role="tablist" aria-label="Design mode">
    {#each $modeState.modes as m (m.name)}
      <button
        role="tab"
        aria-selected={$modeState.mode === m.name}
        class="sb-mode-btn"
        class:sb-mode-btn-active={$modeState.mode === m.name}
        onclick={() => switchMode(m.name)}
      >
        {m.label}
      </button>
    {/each}
  </div>
{/if}

<style>
  .sb-mode-switch {
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 9999;
    display: flex;
    align-items: center;
    gap: 0;
    background: var(--bgColor-muted, #161b22);
    border: 1px solid var(--borderColor-default, #30363d);
    border-radius: 999px;
    padding: 4px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
    font-family: "Hubot Sans", -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
  }

  :global(html.storyboard-mode-present) .sb-mode-switch,
  :global(html.storyboard-mode-plan) .sb-mode-switch,
  :global(html.storyboard-mode-inspect) .sb-mode-switch {
    background: color-mix(in srgb, var(--sb--mode-color) 40%, black);
    transition: background 0.2s ease;
  }

  .sb-mode-btn {
    appearance: none;
    border: none;
    background: transparent;
    color: var(--fgColor-muted, #848d97);
    font-size: 13px;
    font-weight: 500;
    padding: 6px 14px;
    border-radius: 999px;
    cursor: pointer;
    transition: background 0.15s ease, color 0.15s ease;
    white-space: nowrap;
    line-height: 1;
  }

  .sb-mode-btn:hover {
    color: var(--fgColor-default, #e6edf3);
    background: var(--bgColor-neutral-muted, rgba(110, 118, 129, 0.1));
  }

  .sb-mode-btn-active {
    background: var(--bgColor-accent-muted, rgba(56, 139, 253, 0.15));
    color: var(--fgColor-accent, #58a6ff);
  }

  .sb-mode-btn-active:hover {
    background: var(--bgColor-accent-muted, rgba(56, 139, 253, 0.2));
    color: var(--fgColor-accent, #58a6ff);
  }

  /* Mode-aware button colors */
  :global(html.storyboard-mode-prototype) .sb-mode-btn,
  :global(html.storyboard-mode-present) .sb-mode-btn,
  :global(html.storyboard-mode-plan) .sb-mode-btn,
  :global(html.storyboard-mode-inspect) .sb-mode-btn {
    color: rgba(255, 255, 255, 0.7);
  }

  :global(html.storyboard-mode-prototype) .sb-mode-btn:hover,
  :global(html.storyboard-mode-present) .sb-mode-btn:hover,
  :global(html.storyboard-mode-plan) .sb-mode-btn:hover,
  :global(html.storyboard-mode-inspect) .sb-mode-btn:hover {
    color: #fff;
    background: rgba(255, 255, 255, 0.1);
  }

  :global(html.storyboard-mode-prototype) .sb-mode-btn-active,
  :global(html.storyboard-mode-present) .sb-mode-btn-active,
  :global(html.storyboard-mode-plan) .sb-mode-btn-active,
  :global(html.storyboard-mode-inspect) .sb-mode-btn-active {
    background: rgba(255, 255, 255, 0.85);
    color: color-mix(in srgb, var(--sb--mode-color) 70%, black);
  }

  :global(html.storyboard-mode-prototype) .sb-mode-btn-active:hover,
  :global(html.storyboard-mode-present) .sb-mode-btn-active:hover,
  :global(html.storyboard-mode-plan) .sb-mode-btn-active:hover,
  :global(html.storyboard-mode-inspect) .sb-mode-btn-active:hover {
    background: rgba(255, 255, 255, 0.85);
    color: color-mix(in srgb, var(--sb--mode-color) 70%, black);
  }

  /* Hide when chrome is toggled off via ⌘ + . */
  :global(html.storyboard-chrome-hidden) .sb-mode-switch {
    display: none;
  }
</style>
