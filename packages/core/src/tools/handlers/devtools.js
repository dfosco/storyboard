/**
 * Devtools tool module — developer utilities submenu.
 *
 * Renders as a submenu in the command menu with:
 * - Show flow info
 * - Reset all params
 * - Hide mode toggle
 * - Logout (when authenticated)
 */
export const id = 'devtools'

/**
 * @param {object} ctx
 * @param {Function} ctx.showFlowInfoDialog - callback to open flow info dialog
 */
export async function handler(ctx) {
  let loader = null
  let hm = null
  let commentsAuth = null
  let prodMode = null
  let ff = null
  try { loader = await import('../../loader.js') } catch { /* optional */ }
  try { hm = await import('../../hideMode.js') } catch { /* optional */ }
  try { commentsAuth = await import('../../comments/auth.js') } catch { /* optional */ }
  try { prodMode = await import('../../prodMode.js') } catch { /* optional */ }
  try { ff = await import('../../featureFlags.js') } catch { /* optional */ }

  return {
    getChildren: () => {
      const children = []
      const canToggleProdMode = prodMode
        && typeof window !== 'undefined'
        && window.__SB_LOCAL_DEV__ === true

      if (canToggleProdMode) {
        children.push({
          id: 'core/prod-mode',
          label: 'Production mode',
          type: 'toggle',
          active: prodMode.isProdMode(),
          execute: () => { prodMode.toggleProdMode() },
        })
      }
      if (loader) {
        children.push({
          id: 'core/show-flow-info',
          label: 'Show flow info',
          type: 'default',
          execute: () => {
            const p = new URLSearchParams(window.location.search)
            const name = p.get('flow') || p.get('scene') || 'default'
            try {
              const data = loader.loadFlow(name)
              if (ctx.showFlowInfoDialog) {
                ctx.showFlowInfoDialog(name, JSON.stringify(data, null, 2), null)
              }
            } catch (e) {
              if (ctx.showFlowInfoDialog) {
                ctx.showFlowInfoDialog(name, '', e.message)
              }
            }
          },
        })
      }
      children.push({
        id: 'core/reset-params',
        label: 'Reset all params',
        type: 'default',
        execute: () => { window.location.hash = '' },
      })
      if (hm) {
        children.push({
          id: 'core/hide-mode',
          label: 'Hide mode',
          type: 'toggle',
          active: hm.isHideMode(),
          execute: () => {
            if (hm.isHideMode()) hm.deactivateHideMode()
            else hm.activateHideMode()
          },
        })
      }
      if (commentsAuth?.isAuthenticated()) {
        children.push({
          id: 'core/logout',
          label: 'Logout (remove token)',
          type: 'default',
          execute: () => {
            commentsAuth.clearToken()
            console.log('[storyboard] Token removed')
          },
        })
      }
      if (ff) {
        children.push({
          id: 'core/dev-logs',
          label: 'Dev logs',
          type: 'toggle',
          active: ff.getFlag('dev-logs'),
          execute: () => { ff.toggleFlag('dev-logs') },
        })
      }
      children.push({
        id: 'core/canvas-hmr',
        label: 'Canvas HMR',
        type: 'toggle',
        active: new URLSearchParams(window.location.search).has('canvas-hmr'),
        execute: () => {
          const url = new URL(window.location.href)
          if (url.searchParams.has('canvas-hmr')) {
            url.searchParams.delete('canvas-hmr')
          } else {
            url.searchParams.set('canvas-hmr', '')
          }
          window.location.replace(url.toString())
        },
      })
      return children
    },
  }
}
