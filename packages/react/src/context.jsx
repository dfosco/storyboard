import { useEffect, useMemo } from 'react'
import { useParams, useLocation } from 'react-router-dom'
// Side-effect import: seeds the core data index via init()
import 'virtual:storyboard-data-index'
import { loadFlow, flowExists, findRecord, deepMerge, setFlowClass, installBodyClassSync, resolveFlowName, resolveRecordName, isModesEnabled } from '@dfosco/storyboard-core'
import { StoryboardContext } from './StoryboardContext.js'

export { StoryboardContext }

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
  const searchParams = new URLSearchParams(location.search)
  const sceneParam = searchParams.get('flow') || searchParams.get('scene')
  const prototypeName = getPrototypeName(location.pathname)
  const pageFlow = getPageFlowName(location.pathname)
  const params = useParams()

  // Resolve flow name with prototype scoping
  const activeFlowName = useMemo(() => {
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
  }, [sceneParam, flowName, sceneName, prototypeName, pageFlow])

  // Auto-install body class sync (sb-key--value classes on <body>)
  useEffect(() => installBodyClassSync(), [])

  // Mount design modes UI when enabled in storyboard.config.json
  useEffect(() => {
    if (!isModesEnabled()) return

    let cleanup
    import('@dfosco/storyboard-core/ui/design-modes')
      .then(({ mountDesignModesUI }) => {
        cleanup = mountDesignModesUI()
      })
      .catch(() => {
        // Svelte UI not available — degrade gracefully
      })

    return () => cleanup?.()
  }, [])

  const { data, error } = useMemo(() => {
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
  }, [activeFlowName, recordName, recordParam, params, prototypeName])

  const value = {
    data,
    error,
    loading: false,
    flowName: activeFlowName,
    sceneName: activeFlowName, // backward compat
    prototypeName,
  }

  if (error) {
    return <span style={{ color: 'var(--fgColor-danger, #f85149)' }}>Error loading flow: {error}</span>
  }

  return (
    <StoryboardContext.Provider value={value}>
      {children}
    </StoryboardContext.Provider>
  )
}
