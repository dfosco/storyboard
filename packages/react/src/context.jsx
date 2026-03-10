import { useEffect, useMemo } from 'react'
import { useParams, useLocation } from 'react-router-dom'
// Side-effect import: seeds the core data index via init()
import 'virtual:storyboard-data-index'
import { loadFlow, flowExists, findRecord, deepMerge, setFlowClass, installBodyClassSync } from '@dfosco/storyboard-core'
import { StoryboardContext } from './StoryboardContext.js'

export { StoryboardContext }

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
 * Reads the flow name from the ?scene= URL param, the flowName prop,
 * a matching flow file for the current page, or defaults to "default".
 *
 * Optionally merges record data when `recordName` and `recordParam` are provided.
 * The matched record entry is injected under the "record" key in flow data.
 */
export default function StoryboardProvider({ flowName, sceneName, recordName, recordParam, children }) {
  const location = useLocation()
  const sceneParam = new URLSearchParams(location.search).get('scene')
  const pageFlow = getPageFlowName(location.pathname)
  const activeFlowName = sceneParam || flowName || sceneName || (flowExists(pageFlow) ? pageFlow : 'default')
  const params = useParams()

  // Auto-install body class sync (sb-key--value classes on <body>)
  useEffect(() => installBodyClassSync(), [])

  const { data, error } = useMemo(() => {
    try {
      let flowData = loadFlow(activeFlowName)

      // Merge record data if configured
      if (recordName && recordParam && params[recordParam]) {
        const entry = findRecord(recordName, params[recordParam])
        if (entry) {
          flowData = deepMerge(flowData, { record: entry })
        }
      }

      setFlowClass(activeFlowName)
      return { data: flowData, error: null }
    } catch (err) {
      return { data: null, error: err.message }
    }
  }, [activeFlowName, recordName, recordParam, params])

  const value = {
    data,
    error,
    loading: false,
    flowName: activeFlowName,
    sceneName: activeFlowName, // backward compat
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
