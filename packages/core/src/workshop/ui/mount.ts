/**
 * Workshop Dev Panel — Svelte-based mount entry point.
 *
 * Replaces the Alpine.js-based mount.js. Uses mountSveltePlugin() to render
 * the WorkshopPanel component with enabled features from the registry.
 *
 * Injected into the page by the storyboard server plugin via transformIndexHtml.
 */

import { mountSveltePlugin, type PluginHandle } from '../../svelte-plugin-ui/mount.js'
import WorkshopPanel from './WorkshopPanel.jsx'
import { features as allFeatures } from '../features/registry.js'
import '../../../dist/tailwind.css'

let handle: PluginHandle | null = null

/**
 * Resolve which features are enabled from a data attribute on the script tag,
 * injected by the server plugin. Falls back to all features enabled.
 */
function getEnabledFeatures(): Record<string, boolean> {
  const script = document.querySelector('script[data-workshop-features]')
  if (script) {
    try {
      return JSON.parse((script as HTMLElement).dataset.workshopFeatures!)
    } catch { /* ignore */ }
  }
  return Object.fromEntries(Object.keys(allFeatures).map((k) => [k, true]))
}

/**
 * Mount the Workshop panel into the page.
 *
 * Idempotent — calling multiple times is a no-op.
 */
export function mountWorkshop(): void {
  if (handle) return

  const enabledConfig = getEnabledFeatures()

  const features = Object.entries(allFeatures)
    .filter(([name]) => enabledConfig[name] !== false)
    .filter(([, f]) => f.label && f.overlayId && f.overlay)
    .map(([, f]) => ({
      name: f.name,
      label: f.label,
      icon: f.icon,
      overlayId: f.overlayId,
      overlay: f.overlay,
    }))

  handle = mountSveltePlugin(document.body, WorkshopPanel as any, { features } as any)
}

/**
 * Remove the Workshop panel from the DOM.
 */
export function unmountWorkshop(): void {
  if (handle) {
    handle.destroy()
    handle = null
  }
}

// Auto-mount removed — CoreUIBar now owns the workshop UI.
// This module is still loaded by the server plugin for the
// data-workshop-features attribute, but does not self-mount.
// mountWorkshop()
