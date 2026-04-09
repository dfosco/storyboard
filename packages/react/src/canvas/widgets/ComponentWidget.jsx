import { useRef, useCallback, useState, useEffect } from 'react'
import WidgetWrapper from './WidgetWrapper.jsx'
import ResizeHandle from './ResizeHandle.jsx'
import styles from './ComponentWidget.module.css'

/**
 * Renders a live JSX export from a .canvas.jsx companion file.
 * Content is read-only (re-renders on HMR), only position and size are mutable.
 * Cannot be deleted from canvas — only removed from source code.
 *
 * Double-click the overlay to enter interactive mode (dropdowns, buttons work).
 * Click outside to exit interactive mode.
 */
export default function ComponentWidget({ component: Component, width, height, onUpdate }) {
  const containerRef = useRef(null)
  const [interactive, setInteractive] = useState(false)

  const handleResize = useCallback((w, h) => {
    onUpdate?.({ width: w, height: h })
  }, [onUpdate])

  const enterInteractive = useCallback(() => setInteractive(true), [])

  // Exit interactive mode when clicking outside the component
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

  if (!Component) return null

  const sizeStyle = {}
  if (typeof width === 'number') sizeStyle.width = `${width}px`
  if (typeof height === 'number') sizeStyle.height = `${height}px`

  return (
    <WidgetWrapper>
      <div ref={containerRef} className={styles.container} style={sizeStyle}>
        <div className={styles.content}>
          <Component />
        </div>
        {!interactive && (
          <div
            className={styles.interactOverlay}
            onDoubleClick={enterInteractive}
          />
        )}
        <ResizeHandle
          targetRef={containerRef}
          minWidth={100}
          minHeight={60}
          onResize={handleResize}
        />
      </div>
    </WidgetWrapper>
  )
}
