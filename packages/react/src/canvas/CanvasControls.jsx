import { useState, useRef, useEffect, useCallback } from 'react'
import { getMenuWidgetTypes } from './widgets/widgetConfig.js'
import styles from './CanvasControls.module.css'

const ZOOM_STEPS = [25, 50, 75, 100, 125, 150, 200]
export const ZOOM_MIN = ZOOM_STEPS[0]
export const ZOOM_MAX = ZOOM_STEPS[ZOOM_STEPS.length - 1]

const WIDGET_TYPES = getMenuWidgetTypes()

/**
 * Focused canvas toolbar — bottom-left controls for zoom, widget creation, and undo/redo.
 */
export default function CanvasControls({ zoom, onZoomChange, onAddWidget, canUndo, canRedo, onUndo, onRedo }) {
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
    <div className={styles.controlsRow}>
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

      {/* Undo / Redo — separate grouped pair */}
      <div className={styles.toolbar} role="toolbar" aria-label="Undo and redo">
        <button
          className={styles.btn}
          onClick={onUndo}
          disabled={!canUndo}
          aria-label="Undo"
          title="Undo (⌘Z)"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
            <path d="M6.78 1.97a.75.75 0 0 1 0 1.06L3.81 6h6.44A4.75 4.75 0 0 1 15 10.75v2.5a.75.75 0 0 1-1.5 0v-2.5a3.25 3.25 0 0 0-3.25-3.25H3.81l2.97 2.97a.75.75 0 1 1-1.06 1.06L1.47 7.28a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z" />
          </svg>
        </button>
        <button
          className={styles.btn}
          onClick={onRedo}
          disabled={!canRedo}
          aria-label="Redo"
          title="Redo (⌘⇧Z)"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
            <path d="M9.22 1.97a.75.75 0 0 0 0 1.06L12.19 6H5.75A4.75 4.75 0 0 0 1 10.75v2.5a.75.75 0 0 0 1.5 0v-2.5a3.25 3.25 0 0 1 3.25-3.25h6.44l-2.97 2.97a.75.75 0 1 0 1.06 1.06l4.25-4.25a.75.75 0 0 0 0-1.06l-4.25-4.25a.75.75 0 0 0-1.06 0Z" />
          </svg>
        </button>
      </div>
    </div>
  )
}
