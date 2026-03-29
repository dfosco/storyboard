import { useCallback, useRef, useState, useEffect } from 'react'
import { Canvas, Draggable } from '@dfosco/tiny-canvas'
import { useCanvas } from './useCanvas.js'
import { getWidgetComponent } from './widgets/index.js'
import ComponentWidget from './widgets/ComponentWidget.jsx'
import CanvasToolbar from './CanvasToolbar.jsx'
import { updateCanvas, removeWidget as removeWidgetApi } from './canvasApi.js'
import styles from './CanvasPage.module.css'

/**
 * Debounce helper — returns a function that delays invocation.
 */
function debounce(fn, ms) {
  let timer
  return (...args) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), ms)
  }
}

/**
 * Generic canvas page component.
 * Reads canvas data from the index and renders all widgets on a draggable surface.
 *
 * @param {{ name: string }} props - Canvas name as indexed by the data plugin
 */
export default function CanvasPage({ name }) {
  const { canvas, jsxExports, loading } = useCanvas(name)

  // Local mutable copy of widgets for instant UI updates
  const [localWidgets, setLocalWidgets] = useState(null)
  useEffect(() => {
    setLocalWidgets(canvas?.widgets ?? null)
  }, [canvas])

  // Debounced save to server
  const debouncedSave = useRef(
    debounce((canvasName, widgets) => {
      updateCanvas(canvasName, { widgets }).catch((err) =>
        console.error('[canvas] Failed to save:', err)
      )
    }, 500)
  ).current

  const handleWidgetUpdate = useCallback((widgetId, updates) => {
    setLocalWidgets((prev) => {
      if (!prev) return prev
      const next = prev.map((w) =>
        w.id === widgetId ? { ...w, props: { ...w.props, ...updates } } : w
      )
      debouncedSave(name, next)
      return next
    })
  }, [name, debouncedSave])

  const handleWidgetRemove = useCallback((widgetId) => {
    setLocalWidgets((prev) => prev ? prev.filter((w) => w.id !== widgetId) : prev)
    removeWidgetApi(name, widgetId).catch((err) =>
      console.error('[canvas] Failed to remove widget:', err)
    )
  }, [name])

  if (!canvas) {
    return (
      <div className={styles.empty}>
        <p>Canvas &ldquo;{name}&rdquo; not found</p>
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
  const widgets = localWidgets ?? []
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
    <>
      <Canvas {...canvasProps}>
        {allChildren}
      </Canvas>
      <CanvasToolbar
        canvasName={name}
        onWidgetAdded={() => {
          // Reload the page to pick up the new widget from the updated .canvas.json
          window.location.reload()
        }}
      />
    </>
  )
}
