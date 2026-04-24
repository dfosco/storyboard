/**
 * Design-modes UI mount entry point.
 *
 * Call mountDesignModesUI() once at app startup to render the ModeSwitch
 * and ToolbarShell components.  Framework-agnostic — works from any JS
 * context (React StoryboardProvider, vanilla JS, etc.).
 *
 * Usage:
 *   import { mountDesignModesUI } from '@dfosco/storyboard-core/ui/design-modes'
 *   mountDesignModesUI()  // mounts to document.body
 *   mountDesignModesUI(document.getElementById('my-container'))
 */

import { mountSveltePlugin, type PluginHandle } from '../svelte-plugin-ui/mount.js'
import ModeSwitch from '../svelte-plugin-ui/components/ModeSwitch.jsx'
// TODO: Re-enable after migrating devtools features into tool registry
// import ToolbarShell from '../svelte-plugin-ui/components/ToolbarShell.jsx'

let handles: PluginHandle[] = []

/**
 * Mount the design-modes UI (ModeSwitch + ToolbarShell).
 *
 * Idempotent — calling multiple times is a no-op.
 * Returns a teardown function that removes both components.
 *
 * @param container - DOM element to mount into (defaults to document.body)
 */
export function mountDesignModesUI(
  container?: HTMLElement,
): () => void {
  // Prevent double-mount
  if (handles.length > 0) return unmountDesignModesUI

  const target = container ?? document.body

  handles.push(
    mountSveltePlugin(target, ModeSwitch),
    // TODO: Re-enable after migrating devtools features into tool registry
    // mountSveltePlugin(target, ToolbarShell),
  )

  return unmountDesignModesUI
}

/**
 * Remove the design-modes UI from the DOM.
 */
export function unmountDesignModesUI(): void {
  for (const h of handles) {
    h.destroy()
  }
  handles = []
}
