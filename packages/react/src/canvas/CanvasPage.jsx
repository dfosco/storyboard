import { useCallback } from 'react'
import { Canvas, Draggable } from '@dfosco/tiny-canvas'
import { useCanvas } from './useCanvas.js'
import { getWidgetComponent } from './widgets/index.js'
import ComponentWidget from './widgets/ComponentWidget.jsx'
import styles from './CanvasPage.module.css'

/**
 * Generic canvas page component.
 * Reads canvas data from the index and renders all widgets on a draggable surface.
 *
 * @param {{ name: string }} props - Canvas name as indexed by the data plugin
 */
export default function CanvasPage({ name }) {
  const { canvas, jsxExports, loading } = useCanvas(name)

  const handleWidgetUpdate = useCallback((widgetId, updates) => {
    // TODO: Phase 3 — PUT to /_storyboard/canvas/update
    console.log('[canvas] widget update:', widgetId, updates)
  }, [])

  const handleWidgetRemove = useCallback((widgetId) => {
    // TODO: Phase 3 — DELETE to /_storyboard/canvas/widget
    console.log('[canvas] widget remove:', widgetId)
  }, [])

  if (!canvas) {
    return (
      <div className={styles.empty}>
        <p>Canvas "{name}" not found</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className={styles.loading}>
        <p>Loading canvas…</p>
      </div>
    )
  }

  const canvasProps = {
    centered: canvas.centered ?? true,
    dotted: canvas.dotted ?? false,
    grid: canvas.grid ?? false,
    gridSize: canvas.gridSize ?? 18,
    colorMode: canvas.colorMode ?? 'auto',
  }

  // Merge JSX-sourced widgets (from .canvas.jsx) and JSON widgets
  const allChildren = []

  // 1. JSX-sourced component widgets
  if (jsxExports) {
    const sources = canvas.sources ?? []
    for (const [exportName, Component] of Object.entries(jsxExports)) {
      const sourceEntry = sources.find((s) => s.export === exportName)
      allChildren.push(
        <div key={`jsx-${exportName}`} id={`jsx-${exportName}`}>
          <ComponentWidget exportName={exportName} component={Component} />
        </div>
      )
    }
  }

  // 2. JSON-defined mutable widgets
  const widgets = canvas.widgets ?? []
  for (const widget of widgets) {
    const WidgetComponent = getWidgetComponent(widget.type)
    if (!WidgetComponent) {
      console.warn(`[canvas] Unknown widget type: ${widget.type}`)
      continue
    }
    allChildren.push(
      <div key={widget.id} id={widget.id}>
        <WidgetComponent
          id={widget.id}
          props={widget.props}
          onUpdate={(updates) => handleWidgetUpdate(widget.id, updates)}
          onRemove={() => handleWidgetRemove(widget.id)}
        />
      </div>
    )
  }

  return (
    <Canvas {...canvasProps}>
      {allChildren}
    </Canvas>
  )
}
