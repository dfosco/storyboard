/**
 * Storyboard Command Menu — a core floating toolbar for development.
 *
 * Framework-agnostic: mounts itself to the DOM, no React/Vue/etc. needed.
 *
 * Features:
 *  - Floating ⌘ button (bottom-right) that opens a command menu
 *  - "Show flow info" — overlay panel with resolved scene JSON
 *  - "Reset all params" — clears all URL hash session params
 *  - Cmd+. (Mac) / Ctrl+. (other) toggles visibility
 *
 * Usage:
 *   import { mountDevTools } from '@dfosco/storyboard-core'
 *   mountDevTools() // call once at app startup
 */
import { loadFlow } from './loader.js'
import { isCommentsEnabled } from './comments/config.js'
import { isHideMode, activateHideMode, deactivateHideMode } from './hideMode.js'
import { getAllFlags, toggleFlag, getFlagKeys } from './featureFlags.js'

const STYLES = `
.sb-command-wrapper {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 9999;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
}

.sb-command-trigger {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  font-size: 18px;
  font-weight: 500;
  background-color: var(--color-popover, #161b22);
  color: var(--color-muted-foreground, #8b949e);
  border: 1px solid var(--color-border, #30363d);
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 8px 24px rgba(0,0,0,0.4);
  transition: opacity 150ms ease, transform 150ms ease;
  user-select: none;
  line-height: 1;
}
.sb-command-trigger:hover { transform: scale(1.05); }
.sb-command-trigger:active { transform: scale(0.97); }

.sb-command-menu {
  position: absolute;
  bottom: 56px;
  right: 0;
  min-width: 200px;
  background-color: var(--color-popover, #161b22);
  color: var(--color-popover-foreground, #c9d1d9);
  border: 1px solid var(--color-border, #30363d);
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.4);
  overflow: hidden;
  display: none;
}
.sb-command-menu.open { display: block; }

.sb-command-menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 16px;
  background: none;
  border: none;
  color: var(--color-popover-foreground, #c9d1d9);
  font-size: 14px;
  font-family: inherit;
  cursor: pointer;
  text-align: left;
}
.sb-command-menu-item:hover { background-color: var(--color-accent, #21262d); }
.sb-command-menu-item svg { width: 16px; height: 16px; fill: currentColor; flex-shrink: 0; }

.sb-command-hint {
  padding: 6px 16px 8px;
  font-size: 12px;
  color: var(--color-muted-foreground, #484f58);
  font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace;
}

.sb-command-overlay {
  position: fixed;
  inset: 0;
  z-index: 9998;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 16px;
  padding-bottom: 80px;
}
.sb-command-backdrop {
  position: fixed;
  inset: 0;
  background: transparent;
}
.sb-command-panel {
  position: relative;
  width: 100%;
  max-width: 640px;
  max-height: 60vh;
  font-family: inherit;
  background-color: var(--color-background, #0d1117);
  border: 1px solid var(--color-border, #30363d);
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.4);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.sb-command-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid var(--color-border, #21262d);
}
.sb-command-panel-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-foreground, #c9d1d9);
}
.sb-command-panel-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: none;
  border: none;
  border-radius: 6px;
  color: var(--color-muted-foreground, #8b949e);
  cursor: pointer;
}
.sb-command-panel-close:hover { background-color: var(--color-accent, #21262d); color: var(--color-foreground, #c9d1d9); }
.sb-command-panel-close svg { width: 16px; height: 16px; fill: currentColor; }
.sb-command-panel-body {
  overflow: auto;
  padding: 16px;
}
.sb-command-code {
  padding: 0;
  margin: 0;
  background: none;
  font-size: 13px;
  font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace;
  line-height: 1.5;
  color: var(--color-foreground, #c9d1d9);
  white-space: pre-wrap;
  word-break: break-word;
}
.sb-command-error { color: var(--color-destructive, #f85149); }
.sb-command-separator {
  height: 1px;
  background-color: var(--color-border, #21262d);
  margin: 4px 0;
}
.sb-command-group-header {
  padding: 6px 16px 2px;
  font-size: 12px;
  font-weight: 600;
  color: var(--color-muted-foreground, #8b949e);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
`

// SVG icons (inline to avoid external deps)
const INFO_ICON = '<svg viewBox="0 0 16 16"><path d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8Zm8-6.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13ZM6.5 7.75A.75.75 0 0 1 7.25 7h1a.75.75 0 0 1 .75.75v2.75h.25a.75.75 0 0 1 0 1.5h-2a.75.75 0 0 1 0-1.5h.25v-2h-.25a.75.75 0 0 1-.75-.75ZM8 6a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z"/></svg>'
const SYNC_ICON = '<svg viewBox="0 0 16 16"><path d="M1.705 8.005a.75.75 0 0 1 .834.656 5.5 5.5 0 0 0 9.592 2.97l-1.204-1.204a.25.25 0 0 1 .177-.427h3.646a.25.25 0 0 1 .25.25v3.646a.25.25 0 0 1-.427.177l-1.38-1.38A7.002 7.002 0 0 1 1.05 8.84a.75.75 0 0 1 .656-.834ZM8 2.5a5.487 5.487 0 0 0-4.131 1.869l1.204 1.204A.25.25 0 0 1 4.896 6H1.25A.25.25 0 0 1 1 5.75V2.104a.25.25 0 0 1 .427-.177l1.38 1.38A7.002 7.002 0 0 1 14.95 7.16a.75.75 0 0 1-1.49.178A5.5 5.5 0 0 0 8 2.5Z"/></svg>'
const VIEWFINDER_ICON = '<svg viewBox="0 0 16 16"><path d="M8.5 1.75a.75.75 0 0 0-1.5 0V3H1.75a.75.75 0 0 0 0 1.5H3v6H1.75a.75.75 0 0 0 0 1.5H7v1.25a.75.75 0 0 0 1.5 0V12h5.25a.75.75 0 0 0 0-1.5H12v-6h1.75a.75.75 0 0 0 0-1.5H8.5Zm2 8.75h-5a.25.25 0 0 1-.25-.25v-4.5A.25.25 0 0 1 5.5 5.5h5a.25.25 0 0 1 .25.25v4.5a.25.25 0 0 1-.25.25Z"/></svg>'
const X_ICON = '<svg viewBox="0 0 16 16"><path d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.749.749 0 0 1 1.275.326.749.749 0 0 1-.215.734L9.06 8l3.22 3.22a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215L8 9.06l-3.22 3.22a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06Z"/></svg>'
const EYE_ICON = '<svg viewBox="0 0 16 16"><path d="M8 2c1.981 0 3.671.992 4.933 2.078 1.27 1.091 2.187 2.345 2.637 3.023a1.62 1.62 0 0 1 0 1.798c-.45.678-1.367 1.932-2.637 3.023C11.67 13.008 9.981 14 8 14s-3.671-.992-4.933-2.078C1.797 10.831.88 9.577.43 8.899a1.62 1.62 0 0 1 0-1.798c.45-.678 1.367-1.932 2.637-3.023C4.33 2.992 6.019 2 8 2ZM1.679 7.932a.12.12 0 0 0 0 .136c.411.622 1.241 1.75 2.366 2.717C5.176 11.758 6.527 12.5 8 12.5s2.823-.742 3.955-1.715c1.124-.967 1.954-2.096 2.366-2.717a.12.12 0 0 0 0-.136c-.412-.621-1.242-1.75-2.366-2.717C10.824 4.242 9.473 3.5 8 3.5s-2.824.742-3.955 1.715c-1.124.967-1.954 2.096-2.366 2.717ZM8 10a2 2 0 1 1-.001-3.999A2 2 0 0 1 8 10Z"/></svg>'
const EYE_CLOSED_ICON = '<svg viewBox="0 0 16 16"><path d="M.143 2.31a.75.75 0 0 1 1.047-.167l14.5 10.5a.75.75 0 1 1-.88 1.214l-2.248-1.628C11.346 13.19 9.792 14 8 14c-1.981 0-3.671-.992-4.933-2.078C1.797 10.831.88 9.577.43 8.899a1.62 1.62 0 0 1 0-1.798c.35-.527 1.06-1.476 2.019-2.398L.31 3.357A.75.75 0 0 1 .143 2.31Zm3.386 3.378a14.21 14.21 0 0 0-1.85 2.244.12.12 0 0 0 0 .136c.411.622 1.241 1.75 2.366 2.717C5.176 11.758 6.527 12.5 8 12.5c1.195 0 2.31-.488 3.29-1.191L9.063 9.695A2 2 0 0 1 6.058 7.39L3.529 5.688ZM8 3.5c-.516 0-1.017.09-1.499.251a.75.75 0 1 1-.473-1.423A6.23 6.23 0 0 1 8 2c1.981 0 3.671.992 4.933 2.078 1.27 1.091 2.187 2.345 2.637 3.023a1.62 1.62 0 0 1 0 1.798c-.11.166-.248.365-.41.587a.75.75 0 1 1-1.21-.887c.14-.191.26-.367.36-.524a.12.12 0 0 0 0-.136c-.412-.621-1.242-1.75-2.366-2.717C10.824 4.242 9.473 3.5 8 3.5Z"/></svg>'
const CHECK_ICON = '<svg viewBox="0 0 16 16"><path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z"/></svg>'
const ZAP_ICON = '<svg viewBox="0 0 16 16"><path d="M9.504.43a1.516 1.516 0 0 1 2.437 1.713L10.415 5.5h2.123c1.57 0 2.346 1.909 1.22 3.004l-7.34 7.142a1.249 1.249 0 0 1-.871.354h-.302a1.25 1.25 0 0 1-1.157-1.723L5.633 10.5H3.462c-1.57 0-2.346-1.909-1.22-3.004Z"/></svg>'

function getFlowName() {
  const p = new URLSearchParams(window.location.search)
  return p.get('flow') || p.get('scene') || 'default'
}

/**
 * Mount the Storyboard Command Menu to the DOM.
 * Call once at app startup. Safe to call multiple times (no-ops after first).
 *
 * @param {object} [options]
 * @param {HTMLElement} [options.container=document.body] - Where to mount
 * @param {string} [options.basePath='/'] - Base URL path
 */
export function mountDevTools(options = {}) {
  const container = options.container || document.body
  const basePath = options.basePath || '/'

  // Prevent double-mount
  if (container.querySelector('.sb-command-wrapper')) return

  // Inject styles
  const styleEl = document.createElement('style')
  styleEl.textContent = STYLES
  document.head.appendChild(styleEl)

  let visible = true
  let menuOpen = false
  let panelOpen = false // eslint-disable-line no-unused-vars

  // Build DOM
  const wrapper = document.createElement('div')
  wrapper.className = 'sb-command-wrapper'

  // Trigger button — ⌘ character
  const trigger = document.createElement('button')
  trigger.className = 'sb-command-trigger'
  trigger.setAttribute('aria-label', 'Command Menu')
  trigger.textContent = '\u2318'

  // Dropdown menu
  const menu = document.createElement('div')
  menu.className = 'sb-command-menu'

  const viewfinderBtn = document.createElement('button')
  viewfinderBtn.className = 'sb-command-menu-item'
  viewfinderBtn.innerHTML = `${VIEWFINDER_ICON} Viewfinder`

  const showInfoBtn = document.createElement('button')
  showInfoBtn.className = 'sb-command-menu-item'
  showInfoBtn.innerHTML = `${INFO_ICON} Show flow info`

  const resetBtn = document.createElement('button')
  resetBtn.className = 'sb-command-menu-item'
  resetBtn.innerHTML = `${SYNC_ICON} Reset all params`

  const hideModeBtn = document.createElement('button')
  hideModeBtn.className = 'sb-command-menu-item'
  function updateHideModeBtn() {
    const active = isHideMode()
    hideModeBtn.innerHTML = `${active ? EYE_ICON : EYE_CLOSED_ICON} ${active ? 'Show mode' : 'Hide mode'}`
  }
  updateHideModeBtn()

  const hint = document.createElement('div')
  hint.className = 'sb-command-hint'
  hint.innerHTML = 'Press <code>\u2318 + .</code> to hide'

  // Feature flags entry
  const featureFlagsBtn = document.createElement('button')
  featureFlagsBtn.className = 'sb-command-menu-item'
  featureFlagsBtn.innerHTML = `${ZAP_ICON} Feature Flags`
  featureFlagsBtn.addEventListener('click', openFlagsPanel)

  // Comments menu items (injected dynamically)
  function refreshCommentMenuItems() {
    menu.querySelectorAll('[data-sb-comment-menu-item]').forEach((el) => el.remove())

    if (!isCommentsEnabled()) return

    import('./comments/ui/CommentOverlay.js').then(({ getCommentsMenuItems }) => {
      const items = getCommentsMenuItems()
      const insertBefore = hint
      for (const item of items) {
        const btn = document.createElement('button')
        btn.className = 'sb-command-menu-item'
        btn.setAttribute('data-sb-comment-menu-item', '')
        btn.innerHTML = `<span style="width:16px;height:16px;display:flex;align-items:center;justify-content:center;">${item.icon}</span> ${item.label}`
        btn.addEventListener('click', () => {
          menuOpen = false
          menu.classList.remove('open')
          item.onClick()
        })
        menu.insertBefore(btn, insertBefore)
      }
    })
  }

  function renderMainMenu() {
    while (menu.firstChild) menu.removeChild(menu.firstChild)
    menu.appendChild(viewfinderBtn)
    menu.appendChild(showInfoBtn)
    menu.appendChild(resetBtn)
    menu.appendChild(hideModeBtn)
    if (getFlagKeys().length > 0) {
      const sep = document.createElement('div')
      sep.className = 'sb-command-separator'
      menu.appendChild(sep)
      menu.appendChild(featureFlagsBtn)
    }
    refreshCommentMenuItems()
    menu.appendChild(hint)
  }

  // Refresh dynamic items when menu opens
  trigger.addEventListener('click', () => {
    renderMainMenu()
    updateHideModeBtn()
  })

  renderMainMenu()
  wrapper.appendChild(menu)
  wrapper.appendChild(trigger)
  container.appendChild(wrapper)

  // Overlays
  let overlay = null
  let flagsOverlay = null

  function closeFlagsPanel() {
    if (flagsOverlay) {
      flagsOverlay.remove()
      flagsOverlay = null
    }
  }

  function openFlagsPanel() {
    menuOpen = false
    menu.classList.remove('open')
    closeFlagsPanel()

    flagsOverlay = document.createElement('div')
    flagsOverlay.className = 'sb-command-overlay'

    const backdrop = document.createElement('div')
    backdrop.className = 'sb-command-backdrop'
    backdrop.addEventListener('click', closeFlagsPanel)

    const panel = document.createElement('div')
    panel.className = 'sb-command-panel'

    const header = document.createElement('div')
    header.className = 'sb-command-panel-header'
    header.innerHTML = '<span class="sb-command-panel-title">Feature Flags</span>'

    const closeBtn = document.createElement('button')
    closeBtn.className = 'sb-command-panel-close'
    closeBtn.setAttribute('aria-label', 'Close feature flags panel')
    closeBtn.innerHTML = X_ICON
    closeBtn.addEventListener('click', closeFlagsPanel)
    header.appendChild(closeBtn)

    const body = document.createElement('div')
    body.className = 'sb-command-panel-body'

    function renderFlagItems() {
      body.innerHTML = ''
      const keys = getFlagKeys()
      if (keys.length === 0) {
        body.innerHTML = '<span class="sb-command-hint">No feature flags are configured.</span>'
        return
      }
      const flags = getAllFlags()
      for (const key of keys) {
        const btn = document.createElement('button')
        btn.className = 'sb-command-menu-item'
        const icon = flags[key].current
          ? `<span style="width:16px;height:16px;display:flex;align-items:center;justify-content:center;">${CHECK_ICON}</span>`
          : '<span style="width:16px;height:16px;"></span>'
        btn.innerHTML = `${icon} ${key}`
        btn.addEventListener('click', () => {
          toggleFlag(key)
          renderFlagItems()
        })
        body.appendChild(btn)
      }
    }
    renderFlagItems()

    panel.appendChild(header)
    panel.appendChild(body)
    flagsOverlay.appendChild(backdrop)
    flagsOverlay.appendChild(panel)
    container.appendChild(flagsOverlay)
  }

  function openPanel() {
    menuOpen = false
    menu.classList.remove('open')
    panelOpen = true

    if (overlay) overlay.remove()

    const sceneName = getFlowName()
    let sceneJson = ''
    let error = null
    try {
      sceneJson = JSON.stringify(loadFlow(sceneName), null, 2)
    } catch (err) {
      error = err.message
    }

    overlay = document.createElement('div')
    overlay.className = 'sb-command-overlay'

    const backdrop = document.createElement('div')
    backdrop.className = 'sb-command-backdrop'
    backdrop.addEventListener('click', closePanel)

    const panel = document.createElement('div')
    panel.className = 'sb-command-panel'

    const header = document.createElement('div')
    header.className = 'sb-command-panel-header'
    header.innerHTML = `<span class="sb-command-panel-title">Flow: ${sceneName}</span>`

    const closeBtn = document.createElement('button')
    closeBtn.className = 'sb-command-panel-close'
    closeBtn.setAttribute('aria-label', 'Close panel')
    closeBtn.innerHTML = X_ICON
    closeBtn.addEventListener('click', closePanel)
    header.appendChild(closeBtn)

    const body = document.createElement('div')
    body.className = 'sb-command-panel-body'

    if (error) {
      body.innerHTML = `<span class="sb-command-error">${error}</span>`
    } else {
      const pre = document.createElement('pre')
      pre.className = 'sb-command-code'
      pre.textContent = sceneJson
      body.appendChild(pre)
    }

    panel.appendChild(header)
    panel.appendChild(body)
    overlay.appendChild(backdrop)
    overlay.appendChild(panel)
    container.appendChild(overlay)
  }

  function closePanel() {
    panelOpen = false
    if (overlay) {
      overlay.remove()
      overlay = null
    }
  }

  // Event handlers
  trigger.addEventListener('click', () => {
    menuOpen = !menuOpen
    menu.classList.toggle('open', menuOpen)
  })

  showInfoBtn.addEventListener('click', openPanel)

  viewfinderBtn.addEventListener('click', () => {
    menuOpen = false
    menu.classList.remove('open')
    window.location.href = basePath + 'viewfinder'
  })

  resetBtn.addEventListener('click', () => {
    window.location.hash = ''
    menuOpen = false
    menu.classList.remove('open')
  })

  hideModeBtn.addEventListener('click', () => {
    if (isHideMode()) {
      deactivateHideMode()
    } else {
      activateHideMode()
    }
    updateHideModeBtn()
    menuOpen = false
    menu.classList.remove('open')
  })

  // Close menu when clicking outside
  document.addEventListener('click', (e) => {
    if (menuOpen && !wrapper.contains(e.target)) {
      menuOpen = false
      menu.classList.remove('open')
    }
  })

  // Cmd+. / Ctrl+. keyboard shortcut
  window.addEventListener('keydown', (e) => {
    if (e.key === '.' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      visible = !visible
      wrapper.style.display = visible ? '' : 'none'
      if (!visible) {
        menuOpen = false
        menu.classList.remove('open')
        closePanel()
        closeFlagsPanel()
      }
    }
  })
}
