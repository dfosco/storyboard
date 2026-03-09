/**
 * Workshop Dev Panel — floating button + menu + overlays.
 *
 * Uses Alpine.js for reactivity and Tachyons + sb-* tokens for styling.
 * Injected into the page by the storyboard server plugin via transformIndexHtml.
 *
 * Features are loaded from the registry and rendered dynamically based on
 * which features are enabled in storyboard.config.json → workshop.features.
 */

import Alpine from 'alpinejs'
import './workshop.css'
import { features as allFeatures } from '../features/registry.js'

const WRENCH_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16"><path fill="currentColor" d="M5.433 2.304A4.494 4.494 0 0 0 3.5 6c0 1.598.832 3.002 2.09 3.802.518.328.929.923.902 1.64v.008l-.164 3.337a.75.75 0 1 1-1.498-.073l.163-3.34c.007-.14-.1-.313-.36-.465A5.986 5.986 0 0 1 2 6a5.994 5.994 0 0 1 2.567-4.92 1.482 1.482 0 0 1 1.673-.04c.462.296.76.827.76 1.423v2.076c0 .332.214.572.491.572.268 0 .492-.24.492-.572V2.463c0-.596.298-1.127.76-1.423a1.482 1.482 0 0 1 1.673.04A5.994 5.994 0 0 1 13 6a5.986 5.986 0 0 1-2.633 4.909c-.26.152-.367.325-.36.465l.164 3.34a.75.75 0 1 1-1.498.073l-.164-3.337v-.008c-.027-.717.384-1.312.902-1.64A4.494 4.494 0 0 0 11.5 6a4.494 4.494 0 0 0-1.933-3.696c-.024.017-.067.067-.067.159v2.076c0 1.074-.84 2.072-1.991 2.072-1.161 0-2.009-.998-2.009-2.072V2.463c0-.092-.043-.142-.067-.16Z"></path></svg>`

let _mounted = false

/**
 * Resolve which features are enabled from a data attribute on the script tag,
 * injected by the server plugin. Falls back to all features enabled.
 */
function getEnabledFeatures() {
  const script = document.querySelector('script[data-workshop-features]')
  if (script) {
    try { return JSON.parse(script.dataset.workshopFeatures) } catch { /* ignore */ }
  }
  // Fallback: enable all registered features
  return Object.fromEntries(Object.keys(allFeatures).map((k) => [k, true]))
}

export function mountWorkshop() {
  if (_mounted) return
  _mounted = true

  const enabledConfig = getEnabledFeatures()
  const enabledFeatures = Object.entries(allFeatures)
    .filter(([name]) => enabledConfig[name] !== false)

  // Register Alpine panel component
  Alpine.data('workshopPanel', () => ({
    open: false,
    overlay: null,
    toggle() { this.open = !this.open },
    close() { this.open = false },
    showOverlay(name) {
      this.overlay = name
      this.open = false
    },
    closeOverlay() { this.overlay = null },
  }))

  // Let each enabled feature register its Alpine components
  for (const [, feature] of enabledFeatures) {
    if (feature.clientSetup) feature.clientSetup(Alpine)
  }

  // Build menu items from enabled features
  const menuItems = enabledFeatures
    .filter(([, f]) => f.label && f.overlayId)
    .map(([, f]) => `
      <button class="sb-workshop-menu-item" @click="showOverlay('${f.overlayId}')">
        <span class="sb-workshop-menu-icon">${f.icon || ''}</span> ${f.label}
      </button>
    `).join('')

  // Build overlay templates from enabled features
  const overlays = enabledFeatures
    .filter(([, f]) => f.overlayId && f.overlayHtml)
    .map(([, f]) => `
      <template x-if="overlay === '${f.overlayId}'">
        <div class="sb-workshop-backdrop" @click.self="closeOverlay()">
          ${f.overlayHtml()}
        </div>
      </template>
    `).join('')

  const container = document.createElement('div')
  container.id = 'sb-workshop'
  container.innerHTML = `
    <div class="sb-workshop-wrapper" x-data="workshopPanel">
      <button class="sb-workshop-trigger" @click="toggle()" aria-label="Workshop" title="Workshop">
        ${WRENCH_ICON}
      </button>

      <div class="sb-workshop-menu" x-show="open" x-transition @click.outside="close()">
        <div class="sb-workshop-menu-header">Workshop</div>
        ${menuItems}
        <div class="sb-workshop-hint">Dev-only tools</div>
      </div>

      ${overlays}
    </div>
  `

  document.body.appendChild(container)
  Alpine.initTree(container)
}

// Auto-mount
mountWorkshop()
