/**
 * Renders a named export from a .story.jsx module as a canvas widget.
 *
 * In dev, uses iframe isolation (same middleware as .canvas.jsx components)
 * so a broken story cannot crash the canvas. In production, renders
 * directly with an ErrorBoundary fallback.
 */
import { useRef, useCallback, useState, useEffect, useMemo } from 'react'
import { getStoryData } from '@dfosco/storyboard-core'
import WidgetWrapper from './WidgetWrapper.jsx'
import ResizeHandle from './ResizeHandle.jsx'
import ComponentErrorBoundary from '../ComponentErrorBoundary.jsx'
import styles from './StoryWidget.module.css'
import overlayStyles from './embedOverlay.module.css'

export default function StoryWidget({ props, onUpdate, resizable }) {
  const storyId = props?.storyId || ''
  const exportName = props?.exportName || ''
  const width = props?.width
  const height = props?.height

  const containerRef = useRef(null)
  const [interactive, setInteractive] = useState(false)
  const [Component, setComponent] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  const isLocalDev = !import.meta.env?.PROD

  // Load the story module and extract the named export
  useEffect(() => {
    let cancelled = false

    if (!storyId || !exportName) {
      // Defer to avoid synchronous setState in effect
      Promise.resolve().then(() => {
        if (cancelled) return
        setComponent(null)
        setError(storyId ? `Missing export name` : `Missing story ID`)
        setLoading(false)
      })
      return () => { cancelled = true }
    }

    const story = getStoryData(storyId)
    if (!story) {
      Promise.resolve().then(() => {
        if (cancelled) return
        setComponent(null)
        setError(`Story "${storyId}" not found`)
        setLoading(false)
      })
      return () => { cancelled = true }
    }

    // Use a microtask to set loading state, then start the import
    Promise.resolve().then(() => {
      if (cancelled) return
      setLoading(true)
      setError(null)

      return story._storyImport()
    })
      .then((mod) => {
        if (cancelled || !mod) return
        const exp = mod[exportName]
        if (!exp || typeof exp !== 'function') {
          setError(`Export "${exportName}" not found in story "${storyId}"`)
          setComponent(null)
        } else {
          setComponent(() => exp)
          setError(null)
        }
        setLoading(false)
      })
      .catch((err) => {
        if (cancelled) return
        console.error(`[storyboard] Failed to load story "${storyId}":`, err)
        setError(`Failed to load story "${storyId}": ${err.message || err}`)
        setComponent(null)
        setLoading(false)
      })

    return () => { cancelled = true }
  }, [storyId, exportName])

  const handleResize = useCallback((w, h) => {
    onUpdate?.({ width: w, height: h })
  }, [onUpdate])

  const enterInteractive = useCallback(() => setInteractive(true), [])

  useEffect(() => {
    if (!interactive) return
    function handlePointerDown(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setInteractive(false)
      }
    }
    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [interactive])

  // Build iframe src for dev isolation
  const storyModule = useMemo(() => {
    if (!storyId) return null
    const story = getStoryData(storyId)
    return story?._storyModule || null
  }, [storyId])

  const iframeSrc = useMemo(() => {
    if (!isLocalDev || !storyModule || !exportName) return null
    const basePath = (import.meta.env.BASE_URL || '/').replace(/\/$/, '')
    const params = new URLSearchParams({
      module: storyModule,
      export: exportName,
      theme: 'light',
    })
    return `${basePath}/_storyboard/canvas/isolate?${params}`
  }, [isLocalDev, storyModule, exportName])

  const useIframe = isLocalDev && iframeSrc

  // Error / loading states
  if (error) {
    return (
      <WidgetWrapper>
        <div className={styles.container} ref={containerRef}>
          <div className={styles.error}>
            <span className={styles.errorIcon}>📖</span>
            <span className={styles.errorText}>{error}</span>
          </div>
        </div>
      </WidgetWrapper>
    )
  }

  if (loading) {
    return (
      <WidgetWrapper>
        <div className={styles.container} ref={containerRef}>
          <div className={styles.loading}>Loading story…</div>
        </div>
      </WidgetWrapper>
    )
  }

  if (!useIframe && !Component) return null

  const sizeStyle = {}
  if (typeof width === 'number') sizeStyle.width = `${width}px`
  if (typeof height === 'number') sizeStyle.height = `${height}px`

  return (
    <WidgetWrapper>
      <div ref={containerRef} className={styles.container} style={sizeStyle}>
        <div className={styles.content}>
          {useIframe ? (
            <iframe
              src={iframeSrc}
              className={styles.iframe}
              title={`${storyId}/${exportName}`}
              sandbox="allow-same-origin allow-scripts"
            />
          ) : Component ? (
            <ComponentErrorBoundary name={`${storyId}/${exportName}`}>
              <Component />
            </ComponentErrorBoundary>
          ) : null}
        </div>
        {!interactive && (
          <div
            className={overlayStyles.interactOverlay}
            onClick={(e) => {
              if (e.shiftKey || e.metaKey || e.ctrlKey || e.altKey) return
              enterInteractive()
            }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                e.stopPropagation()
                enterInteractive()
              }
            }}
            aria-label="Click to interact with story component"
          >
            <span className={overlayStyles.interactHint}>Click to interact</span>
          </div>
        )}
        {resizable && (
          <ResizeHandle
            targetRef={containerRef}
            minWidth={100}
            minHeight={60}
            onResize={handleResize}
          />
        )}
      </div>
    </WidgetWrapper>
  )
}
