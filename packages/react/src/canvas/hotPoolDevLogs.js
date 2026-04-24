/**
 * Hot Pool browser devlogs — listens for server HMR events and
 * logs them to the browser console when DevTools "Dev logs" is on.
 *
 * The `dev-logs` feature flag is checked via the body class that
 * featureFlags.js syncs: `sb-ff-dev-logs`.
 */

let registered = false

function isDevLogsEnabled() {
  return typeof document !== 'undefined' &&
    document.body.classList.contains('sb-ff-dev-logs')
}

export function registerHotPoolDevLogs() {
  if (registered) return
  registered = true

  if (!import.meta.hot) return

  import.meta.hot.on('storyboard:hot-pool-log', (data) => {
    if (!isDevLogsEnabled()) return
    const poolTag = data.poolId ? `:${data.poolId}` : ''
    console.log(`%c[hot-pool${poolTag}]%c ${data.message}`, 'color: #8b5cf6; font-weight: bold', 'color: inherit')
  })
}
