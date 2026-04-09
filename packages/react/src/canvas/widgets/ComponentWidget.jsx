import { useRef, useCallback } from 'react'
import WidgetWrapper from './WidgetWrapper.jsx'
import ResizeHandle from './ResizeHandle.jsx'
import styles from './ComponentWidget.module.css'

/**
 * Renders a live JSX export from a .canvas.jsx companion file.
 * Content is read-only (re-renders on HMR), only position and size are mutable.
 * Cannot be deleted from canvas — only removed from source code.
 */
export default function ComponentWidget({ component: Component, width, height, onUpdate }) {
  const containerRef = useRef(null)

  const handleResize = useCallback((w, h) => {
    onUpdate?.({ width: w, height: h })
  }, [onUpdate])

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
