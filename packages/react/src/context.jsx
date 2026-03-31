import { useEffect, useMemo, Suspense, lazy } from 'react'
import { useParams, useLocation } from 'react-router-dom'
// Named import seeds the core data index via init() AND provides canvas route data
import { canvases } from 'virtual:storyboard-data-index'
import { loadFlow, flowExists, findRecord, deepMerge, setFlowClass, installBodyClassSync, resolveFlowName, resolveRecordName, isModesEnabled } from '@dfosco/storyboard-core'
import { StoryboardContext } from './StoryboardContext.js'
import styles from './FlowError.module.css'

export { StoryboardContext }

const CanvasPageLazy = lazy(() => import('./canvas/CanvasPage.jsx'))

// Build a map from canvas route paths → canvas names at module load time
const canvasRouteMap = new Map()
for (const [name, data] of Object.entries(canvases || {})) {
  const route = (data?._route || `/${name}`).replace(/\/+$/, '')
  canvasRouteMap.set(route, name)
}

function matchCanvasRoute(pathname) {
  const normalized = pathname.replace(/\/+$/, '') || '/'
  return canvasRouteMap.get(normalized) || null
}

/**
 * Derives the top-level prototype name from a pathname.
 * "/Dashboard" → "Dashboard", "/Dashboard/sub" → "Dashboard"
 * "/posts/123" → "posts", "/" → null
 */
function getPrototypeName(pathname) {
  const path = pathname.replace(/\/+$/, '') || '/'
  if (path === '/') return null
  const segments = path.split('/').filter(Boolean)
  return segments[0] || null
}

/**
 * Derives a flow name from a pathname.
 * "/Overview" → "Overview", "/" → "index", "/nested/Page" → "Page"
 */
function getPageFlowName(pathname) {
  const path = pathname.replace(/\/+$/, '') || '/'
  if (path === '/') return 'index'
  const last = path.split('/').pop()
  return last || 'index'
}

/**
 * Provides loaded flow data to the component tree.
 * Reads the flow name from the ?flow= URL param (with ?scene= as alias),
 * a matching flow file for the current page, or defaults to "default".
 *
 * Derives the prototype scope from the route and uses it to resolve
 * scoped flow and record names (e.g. "Dashboard/default" for /Dashboard).
 *
 * Optionally merges record data when `recordName` and `recordParam` are provided.
 * The matched record entry is injected under the "record" key in flow data.
 */
export default function StoryboardProvider({ flowName, sceneName, recordName, recordParam, children }) {
  const location = useLocation()
  const params = useParams()

  // Canvas route detection — matches current URL against registered canvas routes
  const canvasName = useMemo(() => matchCanvasRoute(location.pathname), [location.pathname])

  const searchParams = new URLSearchParams(location.search)
  const sceneParam = searchParams.get('flow') || searchParams.get('scene')
  const prototypeName = getPrototypeName(location.pathname)
  const pageFlow = getPageFlowName(location.pathname)

  // Resolve flow name with prototype scoping (skip for canvas pages)
  const activeFlowName = useMemo(() => {
    if (canvasName) return null
    const requested = sceneParam || flowName || sceneName
    if (requested) {
      return resolveFlowName(prototypeName, requested)
    }
    // 1. Page-specific flow (e.g., Example/Forms)
    const scopedPageFlow = resolveFlowName(prototypeName, pageFlow)
    if (flowExists(scopedPageFlow)) return scopedPageFlow
    // 2. Prototype flow — named after the prototype folder (e.g., Example/example)
    if (prototypeName) {
      const protoFlow = resolveFlowName(prototypeName, prototypeName)
      if (flowExists(protoFlow)) return protoFlow
    }
    // 3. Global default
    return 'default'
  }, [canvasName, sceneParam, flowName, sceneName, prototypeName, pageFlow])

  // Auto-install body class sync (sb-key--value classes on <body>)
  useEffect(() => installBodyClassSync(), [])

  // Mount design modes UI when enabled in storyboard.config.json
  useEffect(() => {
    if (!isModesEnabled()) return

    let cleanup
    import('@dfosco/storyboard-core/ui-runtime')
      .then(({ mountDesignModes }) => {
        cleanup = mountDesignModes()
      })
      .catch(() => {
        // Svelte UI not available — degrade gracefully
      })

    return () => cleanup?.()
  }, [])

  // Skip flow loading for canvas pages
  const { data, error } = useMemo(() => {
    if (canvasName) return { data: null, error: null }
    try {
      let flowData = loadFlow(activeFlowName)

      // Merge record data if configured (with scoped resolution)
      if (recordName && recordParam && params[recordParam]) {
        const resolvedRecord = resolveRecordName(prototypeName, recordName)
        const entry = findRecord(resolvedRecord, params[recordParam])
        if (entry) {
          flowData = deepMerge(flowData, { record: entry })
        }
      }

      setFlowClass(activeFlowName)
      return { data: flowData, error: null }
    } catch (err) {
      return { data: null, error: err.message }
    }
  }, [canvasName, activeFlowName, recordName, recordParam, params, prototypeName])

  // Canvas pages get their own rendering path — no flow data needed
  if (canvasName) {
    const canvasValue = {
      data: null,
      error: null,
      loading: false,
      flowName: null,
      sceneName: null,
      prototypeName: null,
    }
    return (
      <StoryboardContext.Provider value={canvasValue}>
        <Suspense fallback={null}>
          <CanvasPageLazy name={canvasName} />
        </Suspense>
      </StoryboardContext.Provider>
    )
  }

  const value = {
    data,
    error,
    loading: false,
    flowName: activeFlowName,
    sceneName: activeFlowName, // backward compat
    prototypeName,
  }

  if (error) {
    const currentUrl = `${location.pathname}${location.search}`
    const truncatedUrl = currentUrl.length > 60
      ? currentUrl.slice(0, 60) + '…'
      : currentUrl

    return (
      <div className={styles.container}>
        <div className={styles.banner}>
          <strong>Error loading flow</strong>
          {error}
        </div>
        <p className={styles.meta}>
          Tried to load{' '}
          <a href={currentUrl} title={currentUrl}>{truncatedUrl}</a>
        </p>
        <a className={styles.homeLink} href="/">← Go to homepage</a>
      </div>
    )
  }

  return (
    <StoryboardContext.Provider value={value}>
      {children}
    </StoryboardContext.Provider>
  )
}
