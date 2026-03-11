
import { useRef, useEffect } from 'react'

/**
 * Viewfinder — thin React wrapper around the Svelte Viewfinder component.
 *
 * Mounts the core Svelte Viewfinder into a container div and manages
 * its lifecycle via React's useEffect.
 *
 * @param {Object} props
 * @param {Record<string, unknown>} [props.scenes] - Scene/flow index (deprecated, ignored — data comes from core)
 * @param {Record<string, unknown>} [props.flows] - Flow index (deprecated, ignored — data comes from core)
 * @param {Record<string, unknown>} [props.pageModules] - import.meta.glob result for page files
 * @param {string} [props.basePath] - Base URL path
 * @param {string} [props.title] - Header title
 * @param {string} [props.subtitle] - Optional subtitle
 * @param {boolean} [props.showThumbnails] - Show thumbnail previews
 * @param {boolean} [props.hideDefaultScene] - Hide the "default" flow
 */
export default function Viewfinder({ pageModules = {}, basePath, title = 'Storyboard', subtitle, showThumbnails = false, hideDefaultScene = false }) {
  const containerRef = useRef(null)
  const handleRef = useRef(null)

  const knownRoutes = Object.keys(pageModules)
    .map(p => p.replace('/src/prototypes/', '').replace('.jsx', ''))
    .filter(n => !n.startsWith('_') && n !== 'index' && n !== 'viewfinder')

  useEffect(() => {
    if (!containerRef.current) return

    let cancelled = false

    import('@dfosco/storyboard-core/svelte-plugin-ui/viewfinder').then(({ mountViewfinder, unmountViewfinder }) => {
      if (cancelled) return
      // Ensure clean state for re-mounts
      unmountViewfinder()
      handleRef.current = mountViewfinder(containerRef.current, {
        title,
        subtitle,
        basePath,
        knownRoutes,
        showThumbnails,
        hideDefaultFlow: hideDefaultScene,
      })
    })

    return () => {
      cancelled = true
      if (handleRef.current) {
        handleRef.current.destroy()
        handleRef.current = null
      }
    }
  }, [title, subtitle, basePath, showThumbnails, hideDefaultScene])

  return <div ref={containerRef} style={{ minHeight: '100vh' }} />
}

