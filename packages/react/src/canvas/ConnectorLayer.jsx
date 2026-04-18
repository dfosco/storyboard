import { useMemo, useCallback } from 'react'
import styles from './ConnectorLayer.module.css'

const CONTROL_OFFSET = 80

/**
 * Compute the anchor point on a widget's edge.
 * Reads actual DOM dimensions for accuracy (widgets like markdown auto-size).
 * Falls back to props/bounds/defaults if DOM element isn't found.
 */
function getAnchorPoint(widget, anchor) {
  const x = widget.position?.x ?? 0
  const y = widget.position?.y ?? 0

  // Try to read actual rendered dimensions from DOM
  let w, h
  const el = document.getElementById(widget.id)
  if (el) {
    // The widget element uses CSS translate for positioning;
    // its offsetWidth/Height give the actual rendered size
    const firstChild = el.querySelector('[data-widget-id]') || el.firstElementChild
    if (firstChild) {
      w = firstChild.offsetWidth
      h = firstChild.offsetHeight
    }
  }
  // Fallback to data
  if (!w) w = widget.props?.width ?? widget.bounds?.width ?? 270
  if (!h) h = widget.props?.height ?? widget.bounds?.height ?? 170

  switch (anchor) {
    case 'top':    return { x: x + w / 2, y }
    case 'bottom': return { x: x + w / 2, y: y + h }
    case 'left':   return { x, y: y + h / 2 }
    case 'right':  return { x: x + w, y: y + h / 2 }
    default:       return { x: x + w / 2, y: y + h / 2 }
  }
}

/**
 * Compute the control point offset direction for an anchor.
 */
function getControlOffset(anchor) {
  switch (anchor) {
    case 'top':    return { dx: 0, dy: -CONTROL_OFFSET }
    case 'bottom': return { dx: 0, dy: CONTROL_OFFSET }
    case 'left':   return { dx: -CONTROL_OFFSET, dy: 0 }
    case 'right':  return { dx: CONTROL_OFFSET, dy: 0 }
    default:       return { dx: 0, dy: 0 }
  }
}

const DOT_OUTSET = 8

function getDotOffset(anchor) {
  switch (anchor) {
    case 'top':    return { dx: 0, dy: -DOT_OUTSET }
    case 'bottom': return { dx: 0, dy: DOT_OUTSET }
    case 'left':   return { dx: -DOT_OUTSET, dy: 0 }
    case 'right':  return { dx: DOT_OUTSET, dy: 0 }
    default:       return { dx: 0, dy: 0 }
  }
}

/**
 * Build a cubic Bézier path string between two anchor points.
 * When `freeEnd` is true, the end control point is computed from
 * the direction vector (end→start) so the curve never bends in
 * front of the cursor during drag.
 */
function buildPath(startPt, startAnchor, endPt, endAnchor, freeEnd = false) {
  const c1 = getControlOffset(startAnchor)
  let c2
  if (freeEnd) {
    // Point the end control toward the start so the curve approaches naturally
    const dx = startPt.x - endPt.x
    const dy = startPt.y - endPt.y
    const dist = Math.hypot(dx, dy) || 1
    const scale = Math.min(CONTROL_OFFSET, dist * 0.4)
    c2 = { dx: (dx / dist) * scale, dy: (dy / dist) * scale }
  } else {
    c2 = getControlOffset(endAnchor)
  }
  return `M ${startPt.x} ${startPt.y} C ${startPt.x + c1.dx} ${startPt.y + c1.dy}, ${endPt.x + c2.dx} ${endPt.y + c2.dy}, ${endPt.x} ${endPt.y}`
}

/**
 * SVG overlay that renders connector lines between widgets.
 * Must be placed inside the same zoom-transformed container as widgets.
 */
export default function ConnectorLayer({
  connectors = [],
  widgets = [],
  onRemove,
  onEndpointDrag,
  dragPreview,
  hidden = false,
}) {
  const widgetMap = useMemo(() => {
    const map = new Map()
    for (const w of widgets) {
      map.set(w.id, w)
    }
    return map
  }, [widgets])

  const handleClick = useCallback((e, connectorId) => {
    e.stopPropagation()
    onRemove?.(connectorId)
  }, [onRemove])

  return (
    <svg className={`${styles.connectorLayer} ${hidden ? styles.connectorLayerHidden : ''}`} style={{ width: '100000px', height: '100000px' }}>
      {connectors.map((conn) => {
        const startWidget = widgetMap.get(conn.start?.widgetId)
        const endWidget = widgetMap.get(conn.end?.widgetId)
        if (!startWidget || !endWidget) return null

        const startPt = getAnchorPoint(startWidget, conn.start.anchor)
        const endPt = getAnchorPoint(endWidget, conn.end.anchor)
        const d = buildPath(startPt, conn.start.anchor, endPt, conn.end.anchor)

        return (
          <g key={conn.id}>
            {/* Invisible wider hit area for easier clicking */}
            <path
              d={d}
              className={styles.connectorPathHitArea}
              onClick={(e) => handleClick(e, conn.id)}
            />
            {/* Visible connector line */}
            <path
              d={d}
              className={styles.connectorPath}
              onClick={(e) => handleClick(e, conn.id)}
            />
            {/* Endpoint dots — draggable to reconnect or remove */}
            <circle cx={startPt.x} cy={startPt.y} r={6} className={styles.connectorEndpoint}
              onPointerDown={onEndpointDrag ? (e) => { e.stopPropagation(); e.preventDefault(); onEndpointDrag(conn, 'start', e) } : undefined}
            />
            <circle cx={endPt.x} cy={endPt.y} r={6} className={styles.connectorEndpoint}
              onPointerDown={onEndpointDrag ? (e) => { e.stopPropagation(); e.preventDefault(); onEndpointDrag(conn, 'end', e) } : undefined}
            />
          </g>
        )
      })}

      {/* Drag preview — dashed when free, solid when snapped to anchor */}
      {dragPreview && (
        <>
          <path
            d={buildPath(
              dragPreview.startPt,
              dragPreview.startAnchor,
              dragPreview.endPt,
              dragPreview.endAnchor || dragPreview.startAnchor,
              !dragPreview.snapTarget,
            )}
            className={dragPreview.snapTarget ? styles.connectorPath : styles.dragPreviewPath}
          />
          {dragPreview.snapTarget && (
            <circle cx={dragPreview.endPt.x} cy={dragPreview.endPt.y} r={6} className={styles.connectorEndpoint} />
          )}
        </>
      )}
    </svg>
  )
}

export { getAnchorPoint, buildPath }
