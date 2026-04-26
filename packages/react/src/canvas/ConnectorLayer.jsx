import { useMemo, useCallback } from 'react'
import styles from './ConnectorLayer.module.css'
import { getConnectorDefaults, getConnectorConfig } from './widgets/widgetConfig.js'
import { getAnchorPoint, buildPath } from './connectorGeometry.js'

const connectorConfig = getConnectorDefaults()

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
const ENDPOINT_HIT_PADDING = 8

function EndpointShape({ x, y, startPt, endPt, style, onPointerDown }) {
  const passThrough = !onPointerDown ? { pointerEvents: 'none' } : {}
  const hitRadius = connectorConfig.endpointRadius + ENDPOINT_HIT_PADDING
  const hitTarget = onPointerDown ? (
    <circle cx={x} cy={y} r={hitRadius}
      className={styles.endpointHitArea}
      onPointerDown={onPointerDown}
    />
  ) : null
  if (style === 'none') {
    return (
      <>
        {hitTarget}
        <circle cx={x} cy={y} r={connectorConfig.endpointRadius}
          style={{ fill: 'transparent', stroke: 'none', ...(onPointerDown ? { pointerEvents: 'none' } : { pointerEvents: 'none' }) }}
        />
      </>
    )
  }
  if (style === 'arrow-start' || style === 'arrow-end') {
    const size = connectorConfig.endpointRadius * 2.2
    const target = style === 'arrow-start' ? startPt : endPt
    const dx = target.x - x
    const dy = target.y - y
    const rotation = (Math.atan2(dy, dx) * 180 / Math.PI) + 90
    return (
      <>
        {hitTarget}
        <polygon
          points={`0,${-size} ${size * 0.6},${size * 0.5} ${-size * 0.6},${size * 0.5}`}
          transform={`translate(${x},${y}) rotate(${rotation})`}
          className={styles.connectorEndpoint}
          style={passThrough}
        />
      </>
    )
  }
  return (
    <>
      {hitTarget}
      <circle cx={x} cy={y} r={connectorConfig.endpointRadius}
        className={styles.connectorEndpoint}
        style={passThrough}
      />
    </>
  )
}

/**
 * SVG overlay that renders connector lines between widgets.
 * Must be placed inside the same zoom-transformed container as widgets.
 */
export default function ConnectorLayer({
  connectors = [],
  widgets = [],
  selectedWidgetIds,
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

        // Broadcast animation: show flowing dots when connector has two-way messaging
        // and one of the connected widgets is selected
        const isBroadcast = conn.meta?.messagingMode === 'two-way'
        const startSelected = selectedWidgetIds?.has(conn.start?.widgetId)
        const endSelected = selectedWidgetIds?.has(conn.end?.widgetId)
        // Always show flowing dots when broadcast is active
        // Reverse direction when the end widget is selected (dots flow FROM selected)
        const reverseAnim = endSelected && !startSelected

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
              className={`${styles.connectorPath}${isBroadcast ? ` ${styles.connectorBroadcast}` : ''}`}
              onClick={(e) => handleClick(e, conn.id)}
            />
            {/* Broadcast animation: flowing dots along the path */}
            {isBroadcast && (
              <path
                d={d}
                className={`${styles.broadcastFlow}${reverseAnim ? ` ${styles.broadcastFlowReverse}` : ''}`}
              />
            )}
            {/* Endpoint shapes — visual only, pointer events pass through to anchor dots */}
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
