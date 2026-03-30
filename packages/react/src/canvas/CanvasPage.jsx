import { createElement, useCallback, useEffect, useRef, useState } from 'react'
import { Canvas } from '@dfosco/tiny-canvas'
import { useCanvas } from './useCanvas.js'
import { getWidgetComponent } from './widgets/index.js'
import { schemas, getDefaults } from './widgets/widgetProps.js'
import ComponentWidget from './widgets/ComponentWidget.jsx'
import { addWidget as addWidgetApi, updateCanvas, removeWidget as removeWidgetApi } from './canvasApi.js'
import CanvasControls, { ZOOM_MIN, ZOOM_MAX } from './CanvasControls.jsx'
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
 * Save a drag position to localStorage so tiny-canvas picks it up on render.
 */
function saveWidgetPosition(widgetId, x, y) {
  try {
    const queue = JSON.parse(localStorage.getItem('tiny-canvas-queue')) || []
    const now = new Date().toISOString().replace(/[:.]/g, '-')
    const entry = { id: widgetId, x, y, time: now }
    const idx = queue.findIndex((item) => item.id === widgetId)
    if (idx >= 0) queue[idx] = entry
    else queue.push(entry)
    localStorage.setItem('tiny-canvas-queue', JSON.stringify(queue))
  } catch { /* localStorage unavailable */ }
}

/**
 * Get viewport-center coordinates for placing a new widget.
 */
function getViewportCenter() {
  return {
    x: Math.round(window.innerWidth / 2 - 120),
    y: Math.round(window.innerHeight / 2 - 80),
  }
}

/** Renders a single JSON-defined widget by type lookup. */
function WidgetRenderer({ widget, onUpdate }) {
  const Component = getWidgetComponent(widget.type)
  if (!Component) {
    console.warn(`[canvas] Unknown widget type: ${widget.type}`)
    return null
  }
  return createElement(Component, {
    id: widget.id,
    props: widget.props,
    onUpdate,
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
  const [selectedWidgetId, setSelectedWidgetId] = useState(null)
  const [zoom, setZoom] = useState(100)
  const scrollRef = useRef(null)

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

  // Signal canvas mount/unmount to CoreUIBar
  useEffect(() => {
    document.dispatchEvent(new CustomEvent('storyboard:canvas:mounted', {
      detail: { name }
    }))
    return () => {
      document.dispatchEvent(new CustomEvent('storyboard:canvas:unmounted'))
    }
  }, [name])

  // Add a widget by type — used by CanvasControls and CoreUIBar event
  const addWidget = useCallback(async (type) => {
    const defaultProps = schemas[type] ? getDefaults(schemas[type]) : {}
    const pos = getViewportCenter()
    try {
      const result = await addWidgetApi(name, {
        type,
        props: defaultProps,
        position: pos,
      })
      if (result.success && result.widget) {
        saveWidgetPosition(result.widget.id, pos.x, pos.y)
        setLocalWidgets((prev) => [...(prev || []), result.widget])
      }
    } catch (err) {
      console.error('[canvas] Failed to add widget:', err)
    }
  }, [name])

  // Listen for CoreUIBar add-widget events
  useEffect(() => {
    function handleAddWidget(e) {
      addWidget(e.detail.type)
    }
    document.addEventListener('storyboard:canvas:add-widget', handleAddWidget)
    return () => document.removeEventListener('storyboard:canvas:add-widget', handleAddWidget)
  }, [addWidget])

  // Delete selected widget on Delete/Backspace key
  useEffect(() => {
    function handleKeyDown(e) {
      if (!selectedWidgetId) return
      const tag = e.target.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || e.target.isContentEditable) return
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault()
        handleWidgetRemove(selectedWidgetId)
        setSelectedWidgetId(null)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [selectedWidgetId, handleWidgetRemove])

  // Paste handler — same-origin URLs become prototypes, other URLs become link previews, text becomes markdown
  useEffect(() => {
    const baseUrl = window.location.origin + (import.meta.env?.BASE_URL || '/').replace(/\/$/, '')

    async function handlePaste(e) {
      const tag = e.target.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || e.target.isContentEditable) return

      const text = e.clipboardData?.getData('text/plain')?.trim()
      if (!text) return

      e.preventDefault()

      let type, props
      try {
        const parsed = new URL(text)
        const fullBase = baseUrl.endsWith('/') ? baseUrl : baseUrl + '/'
        if (text.startsWith(baseUrl)) {
          // Same-origin URL → prototype embed with the path portion
          const pathPortion = parsed.pathname + parsed.search + parsed.hash
          const basePath = (import.meta.env?.BASE_URL || '/').replace(/\/$/, '')
          const src = basePath ? pathPortion.replace(new RegExp(`^${basePath}`), '') : pathPortion
          type = 'prototype'
          props = { src: src || '/', label: '', width: 800, height: 600 }
        } else {
          type = 'link-preview'
          props = { url: text, title: '' }
        }
      } catch {
        type = 'markdown'
        props = { content: text }
      }

      const pos = getViewportCenter()
      try {
        const result = await addWidgetApi(name, {
          type,
          props,
          position: pos,
        })
        if (result.success && result.widget) {
          saveWidgetPosition(result.widget.id, pos.x, pos.y)
          setLocalWidgets((prev) => [...(prev || []), result.widget])
        }
      } catch (err) {
        console.error('[canvas] Failed to add widget from paste:', err)
      }
    }
    document.addEventListener('paste', handlePaste)
    return () => document.removeEventListener('paste', handlePaste)
  }, [name])

  // Cmd+scroll / trackpad pinch to smooth-zoom the canvas
  // On macOS, pinch-to-zoom fires wheel events with ctrlKey: true and small
  // fractional deltaY values. We accumulate the delta to handle sub-pixel changes.
  const zoomAccum = useRef(0)
  useEffect(() => {
    function handleWheel(e) {
      if (!e.metaKey && !e.ctrlKey) return
      e.preventDefault()
      zoomAccum.current += -e.deltaY
      const step = Math.trunc(zoomAccum.current)
      if (step === 0) return
      zoomAccum.current -= step
      setZoom((z) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, z + step)))
    }
    document.addEventListener('wheel', handleWheel, { passive: false })
    return () => document.removeEventListener('wheel', handleWheel)
  }, [])

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

  // 2. JSON-defined mutable widgets (selectable)
  for (const widget of (localWidgets ?? [])) {
    allChildren.push(
      <div
        key={widget.id}
        id={widget.id}
        onClick={(e) => {
          e.stopPropagation()
          setSelectedWidgetId(widget.id)
        }}
        className={selectedWidgetId === widget.id ? styles.selected : undefined}
      >
        <WidgetRenderer
          widget={widget}
          onUpdate={(updates) => handleWidgetUpdate(widget.id, updates)}
        />
      </div>
    )
  }

  const scale = zoom / 100

  return (
    <>
      <div
        ref={scrollRef}
        className={styles.canvasScroll}
        onClick={() => setSelectedWidgetId(null)}
      >
        <div
          className={styles.canvasZoom}
          style={{
            transform: `scale(${scale})`,
            transformOrigin: '0 0',
            width: `${Math.max(10000, 100 / scale)}vw`,
            height: `${Math.max(10000, 100 / scale)}vh`,
          }}
        >
          <Canvas {...canvasProps}>
            {allChildren}
          </Canvas>
        </div>
      </div>
      <CanvasControls zoom={zoom} onZoomChange={setZoom} onAddWidget={addWidget} />
    </>
  )
}
