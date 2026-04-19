import { useMemo, useCallback } from 'react'
import styles from './ConnectorLayer.module.css'
import { getConnectorDefaults, getConnectorConfig } from './widgets/widgetConfig.js'

const connectorConfig = getConnectorDefaults()
const CONTROL_OFFSET = connectorConfig.controlOffset

/**
 * Get the effective endpoint style for a widget, merging per-widget-type
 * connector overrides with global defaults.
 * @param {string} widgetType — widget type string
 * @param {'start'|'end'} side — which end of the connector
 * @returns {string} endpoint style ('circle', 'arrow-in', 'arrow-out', 'none')
 */
function getEndpointStyle(widgetType, side) {
  const key = side === 'start' ? 'startEndpoint' : 'endEndpoint'
  const widgetConnectors = getConnectorConfig(widgetType)
  if (widgetConnectors.defaults?.[key]) return widgetConnectors.defaults[key]
  return connectorConfig[key]
}

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
 * Render an endpoint shape (circle, arrow-start, arrow-end, or none) at the given point.
 * - "circle" (default): filled dot
 * - "arrow-start": arrowhead pointing toward the start widget
 * - "arrow-end": arrowhead pointing toward the end widget
 * - "none": invisible drag target only
 *
 * @param {number} x,y — position of this endpoint
 * @param {Object} startPt — position of the connector's start endpoint
 * @param {Object} endPt — position of the connector's end endpoint
 */
function EndpointShape({ x, y, startPt, endPt, style, onPointerDown }) {
  if (style === 'none') {
    return (
      <circle cx={x} cy={y} r={connectorConfig.endpointRadius}
        style={{ fill: 'transparent', stroke: 'none', pointerEvents: 'auto', cursor: 'crosshair' }}
        onPointerDown={onPointerDown}
      />
    )
  }
  if (style === 'arrow-start' || style === 'arrow-end') {
    const size = connectorConfig.endpointRadius * 2.2
    // Determine which point the arrow should aim toward
    const target = style === 'arrow-start' ? startPt : endPt
    const dx = target.x - x
    const dy = target.y - y
    // atan2 gives angle from positive X axis; polygon tip points up (-Y), so offset by 90°
    const rotation = (Math.atan2(dy, dx) * 180 / Math.PI) + 90
    return (
      <polygon
        points={`0,${-size} ${size * 0.6},${size * 0.5} ${-size * 0.6},${size * 0.5}`}
        transform={`translate(${x},${y}) rotate(${rotation})`}
        className={styles.connectorEndpoint}
        onPointerDown={onPointerDown}
      />
    )
  }
  // Default: circle
  return (
    <circle cx={x} cy={y} r={connectorConfig.endpointRadius}
      className={styles.connectorEndpoint}
      onPointerDown={onPointerDown}
    />
  )
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
    <svg
      className={`${styles.connectorLayer} ${hidden ? styles.connectorLayerHidden : ''}`}
      style={{
        width: '100000px',
        height: '100000px',
        '--connector-stroke': connectorConfig.stroke,
        '--connector-stroke-width': `${connectorConfig.strokeWidth}px`,
        '--connector-hover-stroke': connectorConfig.hoverStroke,
        '--connector-hover-stroke-width': `${connectorConfig.hoverStrokeWidth}px`,
        '--connector-endpoint-fill': connectorConfig.endpointFill,
        '--connector-endpoint-stroke': connectorConfig.endpointStroke,
        '--connector-endpoint-stroke-width': `${connectorConfig.endpointStrokeWidth}px`,
        '--connector-hit-area-width': `${connectorConfig.hitAreaStrokeWidth}px`,
        '--connector-drag-stroke': connectorConfig.dragStroke,
        '--connector-drag-stroke-width': `${connectorConfig.dragStrokeWidth}px`,
        '--connector-drag-dasharray': connectorConfig.dragDasharray,
        '--connector-drag-opacity': connectorConfig.dragOpacity,
      }}
    >
      {connectors.map((conn) => {
        const startWidget = widgetMap.get(conn.start?.widgetId)
        const endWidget = widgetMap.get(conn.end?.widgetId)
        if (!startWidget || !endWidget) return null

        const startPt = getAnchorPoint(startWidget, conn.start.anchor)
        const endPt = getAnchorPoint(endWidget, conn.end.anchor)
        const d = buildPath(startPt, conn.start.anchor, endPt, conn.end.anchor)
        const startStyle = getEndpointStyle(startWidget.type, 'start')
        const endStyle = getEndpointStyle(endWidget.type, 'end')

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
            {/* Endpoint shapes — draggable to reconnect or remove */}
            <EndpointShape x={startPt.x} y={startPt.y} startPt={startPt} endPt={endPt} style={startStyle}
              onPointerDown={onEndpointDrag ? (e) => { e.stopPropagation(); e.preventDefault(); onEndpointDrag(conn, 'start', e) } : undefined}
            />
            <EndpointShape x={endPt.x} y={endPt.y} startPt={startPt} endPt={endPt} style={endStyle}
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
            <EndpointShape x={dragPreview.endPt.x} y={dragPreview.endPt.y} startPt={dragPreview.startPt} endPt={dragPreview.endPt} style={connectorConfig.endEndpoint} />
          )}
        </>
      )}
    </svg>
  )
}

export { getAnchorPoint, buildPath }
