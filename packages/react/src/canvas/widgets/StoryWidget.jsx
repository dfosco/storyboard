/**
 * Renders a story at its route URL inside an iframe on canvas.
 *
 * Works like PrototypeEmbed: the story has its own route (e.g. /canvas/button-patterns)
 * and this widget iframes that URL with ?export=ExportName&_sb_embed for single-export mode.
 *
 * Props: { storyId, exportName, width, height }
 */
import { useRef, useCallback, useState, useEffect, useMemo } from 'react'
import { getStoryData } from '@dfosco/storyboard-core'
import WidgetWrapper from './WidgetWrapper.jsx'
import ResizeHandle from './ResizeHandle.jsx'
import styles from './StoryWidget.module.css'
import overlayStyles from './embedOverlay.module.css'

function resolveStoryUrl(storyId, exportName) {
  const story = getStoryData(storyId)
  if (!story?._route) return null

  const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '')
  const route = story._route
  const params = new URLSearchParams({ _sb_embed: '1' })
  if (exportName) params.set('export', exportName)

  return `${base}${route}?${params}`
}

export default function StoryWidget({ props, onUpdate, resizable }) {
  const storyId = props?.storyId || ''
  const exportName = props?.exportName || ''
  const width = props?.width
  const height = props?.height

  const containerRef = useRef(null)
  const [interactive, setInteractive] = useState(false)

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

  const iframeSrc = useMemo(
    () => resolveStoryUrl(storyId, exportName),
    [storyId, exportName],
  )

  // Error state — missing story or no route
  if (!storyId) {
    return (
      <WidgetWrapper>
        <div className={styles.container} ref={containerRef}>
          <div className={styles.error}>
            <span className={styles.errorIcon}>📖</span>
            <span className={styles.errorText}>Missing story ID</span>
          </div>
        </div>
      </WidgetWrapper>
    )
  }

  if (!iframeSrc) {
    return (
      <WidgetWrapper>
        <div className={styles.container} ref={containerRef}>
          <div className={styles.error}>
            <span className={styles.errorIcon}>📖</span>
            <span className={styles.errorText}>Story &ldquo;{storyId}&rdquo; not found or has no route</span>
          </div>
        </div>
      </WidgetWrapper>
    )
  }

  const sizeStyle = {}
  if (typeof width === 'number') sizeStyle.width = `${width}px`
  if (typeof height === 'number') sizeStyle.height = `${height}px`

  return (
    <WidgetWrapper>
      <div ref={containerRef} className={styles.container} style={sizeStyle}>
        <div className={styles.content}>
          <iframe
            src={iframeSrc}
            className={styles.iframe}
            title={exportName ? `${storyId}/${exportName}` : storyId}
          />
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
