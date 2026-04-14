import { useEffect, useMemo, Suspense, lazy } from 'react'
import { useParams, useLocation } from 'react-router-dom'
// Named import seeds the core data index via init() AND provides canvas/story route data
import { canvases, stories } from 'virtual:storyboard-data-index'
import { loadFlow, flowExists, findRecord, deepMerge, setFlowClass, installBodyClassSync, resolveFlowName, resolveRecordName, isModesEnabled } from '@dfosco/storyboard-core'
import { StoryboardContext } from './StoryboardContext.js'
import styles from './FlowError.module.css'

export { StoryboardContext }

const CanvasPageLazy = lazy(() => import('./canvas/CanvasPage.jsx'))
const StoryPageLazy = lazy(() => import('./story/StoryPage.jsx'))

// Build a map from canvas route paths → canvas names at module load time
const canvasRouteMap = new Map()
for (const [name, data] of Object.entries(canvases || {})) {
  const route = (data?._route || `/${name}`).replace(/\/+$/, '')
  canvasRouteMap.set(route, name)
}

// Build a map from story route paths → story names at module load time
const storyRouteMap = new Map()
for (const [name, data] of Object.entries(stories || {})) {
  if (data?._route) {
    const route = data._route.replace(/\/+$/, '')
    storyRouteMap.set(route, name)
  }
}

function matchCanvasRoute(pathname) {
  const normalized = pathname.replace(/\/+$/, '') || '/'
  return canvasRouteMap.get(normalized) || null
}

function matchStoryRoute(pathname) {
  // Strip ?export=... from pathname matching (export is in search params, not pathname)
  const normalized = pathname.replace(/\/+$/, '') || '/'
  return storyRouteMap.get(normalized) || null
}

function isCanvasPath(pathname) {
  const normalized = pathname.replace(/\/+$/, '') || '/'
  return normalized === '/canvas' || normalized.startsWith('/canvas/')
}

function isStoryPath(pathname) {
  const normalized = pathname.replace(/\/+$/, '') || '/'
  return normalized === '/components' || normalized.startsWith('/components/')
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
  const isMissingCanvasRoute = useMemo(
    () => isCanvasPath(location.pathname) && !canvasName && !matchStoryRoute(location.pathname),
    [location.pathname, canvasName],
  )

  // Story route detection — matches current URL against registered story routes
  const storyName = useMemo(() => matchStoryRoute(location.pathname), [location.pathname])
  const isMissingStoryRoute = useMemo(
    () => isStoryPath(location.pathname) && !storyName,
    [location.pathname, storyName],
  )

  const searchParams = new URLSearchParams(location.search)
  const sceneParam = searchParams.get('flow') || searchParams.get('scene')
  const prototypeName = getPrototypeName(location.pathname)
  const pageFlow = getPageFlowName(location.pathname)

  // Resolve flow name with prototype scoping (skip for canvas/story pages)
  const activeFlowName = useMemo(() => {
    if (canvasName || isMissingCanvasRoute || storyName || isMissingStoryRoute) return null
    const requested = sceneParam || flowName || sceneName
    if (requested) {
      // Allow fully-scoped flow names from URLs/widgets without re-prefixing
      // (e.g. "Proto/flow" should not become "Proto/Proto/flow").
      if (requested.includes('/')) return requested
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
    // 3. Prototype-scoped default (e.g. Example/default)
    if (prototypeName) {
      const scopedDefault = resolveFlowName(prototypeName, 'default')
      if (flowExists(scopedDefault)) return scopedDefault
    }
    // 4. Global default — or null if no flow exists at all
    if (flowExists('default')) return 'default'
    return null
  }, [canvasName, isMissingCanvasRoute, storyName, isMissingStoryRoute, sceneParam, flowName, sceneName, prototypeName, pageFlow])

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

  // Skip flow loading for canvas/story pages and flow-less pages
  const { data, error } = useMemo(() => {
    if (canvasName || isMissingCanvasRoute || storyName || isMissingStoryRoute) return { data: null, error: null }
    if (!activeFlowName) return { data: {}, error: null }
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
  }, [canvasName, isMissingCanvasRoute, storyName, isMissingStoryRoute, activeFlowName, recordName, recordParam, params, prototypeName])

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

  // Story pages get their own rendering path — no flow data needed
  if (storyName) {
    const storyValue = {
      data: null,
      error: null,
      loading: false,
      flowName: null,
      sceneName: null,
      prototypeName: null,
    }
    return (
      <StoryboardContext.Provider value={storyValue}>
        <Suspense fallback={null}>
          <StoryPageLazy name={storyName} />
        </Suspense>
      </StoryboardContext.Provider>
    )
  }

  if (isMissingCanvasRoute) {
    const currentUrl = `${location.pathname}${location.search}`
    const truncatedUrl = currentUrl.length > 60
      ? currentUrl.slice(0, 60) + '…'
      : currentUrl

    return (
      <main className={styles.container}>
        <div className={styles.banner}>
          <strong>Canvas not found</strong>
          No canvas matches this route.
        </div>
        <p className={styles.meta}>
          Tried to open{' '}
          <a href={currentUrl} title={currentUrl}>{truncatedUrl}</a>
        </p>
        <a className={styles.homeLink} href="/">← Go to index page</a>
      </main>
    )
  }

  if (isMissingStoryRoute) {
    const currentUrl = `${location.pathname}${location.search}`
    const truncatedUrl = currentUrl.length > 60
      ? currentUrl.slice(0, 60) + '…'
      : currentUrl

    return (
      <main className={styles.container}>
        <div className={styles.banner}>
          <strong>Story not found</strong>
          No story matches this route.
        </div>
        <p className={styles.meta}>
          Tried to open{' '}
          <a href={currentUrl} title={currentUrl}>{truncatedUrl}</a>
        </p>
        <a className={styles.homeLink} href="/">← Go to index page</a>
      </main>
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
