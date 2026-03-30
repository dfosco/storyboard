import { createElement, useCallback, useRef, useState } from 'react'
import { Canvas } from '@dfosco/tiny-canvas'
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

/** Renders a single JSON-defined widget by type lookup. */
function WidgetRenderer({ widget, onUpdate, onRemove }) {
  const Component = getWidgetComponent(widget.type)
  if (!Component) {
    console.warn(`[canvas] Unknown widget type: ${widget.type}`)
    return null
  }
  return createElement(Component, {
    id: widget.id,
    props: widget.props,
    onUpdate,
    onRemove,
  })
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
  const [localWidgets, setLocalWidgets] = useState(canvas?.widgets ?? null)
  const [trackedCanvas, setTrackedCanvas] = useState(canvas)
  if (canvas !== trackedCanvas) {
    setTrackedCanvas(canvas)
    setLocalWidgets(canvas?.widgets ?? null)
  }

  // Debounced save to server
  const debouncedSave = useRef(
    debounce((canvasName, widgets) => {
      updateCanvas(canvasName, { widgets }).catch((err) =>
        console.error('[canvas] Failed to save:', err)
      )
    }, 2000)
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
    centered: canvas.centered ?? false,
    dotted: canvas.dotted ?? false,
    grid: canvas.grid ?? false,
    gridSize: canvas.gridSize ?? 18,
    colorMode: canvas.colorMode ?? 'auto',
  }

  // Merge JSX-sourced widgets (from .canvas.jsx) and JSON widgets
  const allChildren = []

  // 1. JSX-sourced component widgets
  if (jsxExports) {
    for (const [exportName, Component] of Object.entries(jsxExports)) {
      allChildren.push(
        <div key={`jsx-${exportName}`} id={`jsx-${exportName}`}>
          <ComponentWidget component={Component} />
        </div>
      )
    }
  }

  // 2. JSON-defined mutable widgets
  for (const widget of (localWidgets ?? [])) {
    allChildren.push(
      <div key={widget.id} id={widget.id}>
        <WidgetRenderer
          widget={widget}
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
