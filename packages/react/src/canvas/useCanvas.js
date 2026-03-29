import { useState, useEffect, useMemo } from 'react'
import { getCanvasData } from '@dfosco/storyboard-core'

/**
 * Hook to load canvas data by name.
 * Returns the canvas config (title, grid, widgets, etc.) and resolved JSX module exports.
 *
 * @param {string} name - Canvas name as indexed by the data plugin
 * @returns {{ canvas: object|null, jsxExports: object|null, loading: boolean }}
 */
export function useCanvas(name) {
  const canvas = useMemo(() => getCanvasData(name), [name])
  const [jsxExports, setJsxExports] = useState(null)
  const [loading, setLoading] = useState(!!canvas?._jsxModule)

  useEffect(() => {
    if (!canvas?._jsxModule) {
      setJsxExports(null)
      setLoading(false)
      return
    }

    setLoading(true)
    import(/* @vite-ignore */ canvas._jsxModule)
      .then((mod) => {
        // Filter out default export and non-component exports
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
      .finally(() => setLoading(false))
  }, [canvas?._jsxModule])

  return { canvas, jsxExports, loading }
}
