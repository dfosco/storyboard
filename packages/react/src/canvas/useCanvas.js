import { useState, useEffect, useMemo } from 'react'
import { getCanvasData } from '@dfosco/storyboard-core'

/**
 * Fetch fresh canvas data from the server's .canvas.json file.
 * Falls back to build-time data if the server is unavailable.
 */
async function fetchCanvasFromServer(name) {
  try {
    const base = (import.meta.env?.BASE_URL || '/').replace(/\/$/, '')
    const res = await fetch(`${base}/_storyboard/canvas/read?name=${encodeURIComponent(name)}`)
    if (res.ok) return res.json()
  } catch { /* fall back to build-time data */ }
  return null
}

/**
 * Hook to load canvas data by name.
 * Uses build-time data for static config (routes, JSX path), but fetches
 * fresh widget data from the server to pick up persisted edits.
 *
 * @param {string} name - Canvas name as indexed by the data plugin
 * @returns {{ canvas: object|null, jsxExports: object|null, loading: boolean }}
 */
export function useCanvas(name) {
  const buildTimeCanvas = useMemo(() => getCanvasData(name), [name])
  const [canvas, setCanvas] = useState(buildTimeCanvas)
  const [jsxExports, setJsxExports] = useState(null)
  const [loading, setLoading] = useState(true)

  // Fetch fresh data from server on mount
  useEffect(() => {
    if (!buildTimeCanvas) {
      setCanvas(null)
      setLoading(false)
      return
    }

    setLoading(true)
    fetchCanvasFromServer(name).then((fresh) => {
      if (fresh) {
        // Merge: use server data for widgets/sources, keep build-time for _route/_jsxModule
        setCanvas({ ...buildTimeCanvas, ...fresh })
      } else {
        setCanvas(buildTimeCanvas)
      }
      setLoading(false)
    })
  }, [name, buildTimeCanvas])

  useEffect(() => {
    if (!canvas?._jsxModule) {
      setJsxExports(null)
      return
    }

    import(/* @vite-ignore */ canvas._jsxModule)
      .then((mod) => {
        const exports = {}
        for (const [key, value] of Object.entries(mod)) {
          if (key !== 'default' && typeof value === 'function') {
            exports[key] = value
          }
        }
        setJsxExports(exports)
      })
      .catch((err) => {
        console.error(`[storyboard] Failed to load canvas JSX module: ${canvas._jsxModule}`, err)
        setJsxExports(null)
      })
  }, [canvas?._jsxModule])

  return { canvas, jsxExports, loading }
}
