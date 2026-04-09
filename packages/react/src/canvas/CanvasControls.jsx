import { useState, useRef, useEffect, useCallback } from 'react'
import { getMenuWidgetTypes } from './widgets/widgetConfig.js'
import styles from './CanvasControls.module.css'

const WIDGET_TYPES = getMenuWidgetTypes()

/**
 * Focused canvas toolbar — bottom-left controls for zoom, widget creation, and undo/redo.
 */
export default function CanvasControls({ onAddWidget }) {
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

  const handleAddWidget = useCallback((type) => {
    onAddWidget(type)
    setMenuOpen(false)
  }, [onAddWidget])

  return (
    <div className={styles.toolbar} role="toolbar" aria-label="Canvas controls">
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
    </div>
  )
}
