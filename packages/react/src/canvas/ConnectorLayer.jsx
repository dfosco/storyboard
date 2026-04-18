import { useMemo, useCallback } from 'react'
import styles from './ConnectorLayer.module.css'

const CONTROL_OFFSET = 80

/**
 * Compute the anchor point on a widget's edge.
 * Uses position + props dimensions (not bounds) for live accuracy.
 */
function getAnchorPoint(widget, anchor) {
  const x = widget.position?.x ?? 0
  const y = widget.position?.y ?? 0
  const w = widget.props?.width ?? widget.bounds?.width ?? 270
  const h = widget.props?.height ?? widget.bounds?.height ?? 170

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

/**
 * Build a cubic Bézier path string between two anchor points.
 */
function buildPath(startPt, startAnchor, endPt, endAnchor) {
  const c1 = getControlOffset(startAnchor)
  const c2 = getControlOffset(endAnchor)
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
  dragPreview,
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
    <svg className={styles.connectorLayer} style={{ width: '100000px', height: '100000px' }}>
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
            {/* Endpoint dots */}
            <circle cx={startPt.x} cy={startPt.y} r={4} className={styles.connectorEndpoint} />
            <circle cx={endPt.x} cy={endPt.y} r={4} className={styles.connectorEndpoint} />
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
