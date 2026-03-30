import { useState, useRef, useEffect, useCallback } from 'react'
import styles from './CanvasControls.module.css'

const ZOOM_STEPS = [25, 50, 75, 100, 125, 150, 200]
const ZOOM_MIN = ZOOM_STEPS[0]
const ZOOM_MAX = ZOOM_STEPS[ZOOM_STEPS.length - 1]

const WIDGET_TYPES = [
  { type: 'sticky-note', label: 'Sticky Note' },
  { type: 'markdown', label: 'Markdown' },
  { type: 'prototype', label: 'Prototype' },
]

/**
 * Focused canvas toolbar — bottom-left controls for zoom and widget creation.
 */
export default function CanvasControls({ zoom, onZoomChange, onAddWidget }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return
    function handlePointerDown(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [menuOpen])

  const zoomIn = useCallback(() => {
    onZoomChange((z) => {
      const next = ZOOM_STEPS.find((s) => s > z)
      return next ?? ZOOM_MAX
    })
  }, [onZoomChange])

  const zoomOut = useCallback(() => {
    onZoomChange((z) => {
      const next = [...ZOOM_STEPS].reverse().find((s) => s < z)
      return next ?? ZOOM_MIN
    })
  }, [onZoomChange])

  const resetZoom = useCallback(() => {
    onZoomChange(100)
  }, [onZoomChange])

  const handleAddWidget = useCallback((type) => {
    onAddWidget(type)
    setMenuOpen(false)
  }, [onAddWidget])

  return (
    <div className={styles.toolbar} role="toolbar" aria-label="Canvas controls">
      {/* Create widget */}
      <div ref={menuRef} className={styles.createGroup}>
        <button
          className={styles.btn}
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Add widget"
          aria-expanded={menuOpen}
          title="Add widget"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
            <path d="M7.75 2a.75.75 0 0 1 .75.75V7h4.25a.75.75 0 0 1 0 1.5H8.5v4.25a.75.75 0 0 1-1.5 0V8.5H2.75a.75.75 0 0 1 0-1.5H7V2.75A.75.75 0 0 1 7.75 2Z" />
          </svg>
        </button>
        {menuOpen && (
          <div className={styles.menu} role="menu">
            <div className={styles.menuLabel}>Add to canvas</div>
            {WIDGET_TYPES.map((wt) => (
              <button
                key={wt.type}
                className={styles.menuItem}
                role="menuitem"
                onClick={() => handleAddWidget(wt.type)}
              >
                {wt.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className={styles.divider} />

      {/* Zoom controls */}
      <button
        className={styles.btn}
        onClick={zoomOut}
        disabled={zoom <= ZOOM_MIN}
        aria-label="Zoom out"
        title="Zoom out"
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
          <path d="M2.75 7.25h10.5a.75.75 0 0 1 0 1.5H2.75a.75.75 0 0 1 0-1.5Z" />
        </svg>
      </button>
      <button
        className={styles.zoomLevel}
        onClick={resetZoom}
        title="Reset to 100%"
        aria-label={`Zoom ${zoom}%, click to reset`}
      >
        {zoom}%
      </button>
      <button
        className={styles.btn}
        onClick={zoomIn}
        disabled={zoom >= ZOOM_MAX}
        aria-label="Zoom in"
        title="Zoom in"
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
          <path d="M7.75 2a.75.75 0 0 1 .75.75V7h4.25a.75.75 0 0 1 0 1.5H8.5v4.25a.75.75 0 0 1-1.5 0V8.5H2.75a.75.75 0 0 1 0-1.5H7V2.75A.75.75 0 0 1 7.75 2Z" />
        </svg>
      </button>
    </div>
  )
}
