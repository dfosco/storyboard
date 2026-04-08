import { useCallback } from 'react'
import styles from './ResizeHandle.module.css'

/**
 * Shared resize handle for canvas widgets.
 *
 * Renders a small drag handle in the bottom-right corner of the parent.
 * On drag, calls `onResize(width, height)` with new dimensions.
 *
 * The parent must have `position: relative` for correct positioning.
 *
 * @param {Object} props
 * @param {React.RefObject} props.targetRef - ref to the element being resized (reads offsetWidth/Height)
 * @param {number} [props.minWidth=180]  - minimum allowed width
 * @param {number} [props.minHeight=60]  - minimum allowed height
 * @param {Function} props.onResize - callback: (width, height) => void
 */
export default function ResizeHandle({ targetRef, minWidth = 180, minHeight = 60, onResize }) {
  const handleMouseDown = useCallback((e) => {
    e.stopPropagation()
    e.preventDefault()

    const el = targetRef?.current
    if (!el) return

    const startX = e.clientX
    const startY = e.clientY
    const startW = el.offsetWidth
    const startH = el.offsetHeight

    function onMove(ev) {
      const newW = Math.max(minWidth, startW + ev.clientX - startX)
      const newH = Math.max(minHeight, startH + ev.clientY - startY)
      onResize?.(newW, newH)
    }

    function onUp() {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }

    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }, [targetRef, minWidth, minHeight, onResize])

  return (
    <div
      className={styles.handle}
      onMouseDown={handleMouseDown}
      onPointerDown={(e) => e.stopPropagation()}
      role="separator"
      aria-orientation="horizontal"
      aria-label="Resize"
    />
  )
}
