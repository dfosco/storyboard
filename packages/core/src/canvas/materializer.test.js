import { describe, it, expect } from 'vitest'
import { parseCanvasJsonl, materialize, materializeFromText, serializeEvent } from './materializer.js'

describe('parseCanvasJsonl', () => {
  it('parses multiple JSONL lines', () => {
    const text = '{"event":"canvas_created","title":"Test"}\n{"event":"widget_added","widget":{"id":"w1"}}\n'
    const events = parseCanvasJsonl(text)
    expect(events).toHaveLength(2)
    expect(events[0].event).toBe('canvas_created')
    expect(events[1].event).toBe('widget_added')
  })

  it('skips blank lines', () => {
    const text = '{"event":"canvas_created"}\n\n\n{"event":"widget_added","widget":{"id":"w1"}}\n'
    const events = parseCanvasJsonl(text)
    expect(events).toHaveLength(2)
  })

  it('skips malformed lines', () => {
    const text = '{"event":"canvas_created"}\nnot json\n{"event":"widget_added","widget":{"id":"w1"}}\n'
    const events = parseCanvasJsonl(text)
    expect(events).toHaveLength(2)
  })

  it('returns empty array for empty input', () => {
    expect(parseCanvasJsonl('')).toEqual([])
    expect(parseCanvasJsonl('\n\n')).toEqual([])
  })
})

describe('materialize', () => {
  it('materializes a canvas_created event', () => {
    const events = [
      { event: 'canvas_created', timestamp: '2026-01-01', title: 'Test', grid: true, gridSize: 24, widgets: [] },
    ]
    const state = materialize(events)
    expect(state.title).toBe('Test')
    expect(state.grid).toBe(true)
    expect(state.gridSize).toBe(24)
    expect(state.widgets).toEqual([])
    // event metadata should be stripped
    expect(state.event).toBeUndefined()
    expect(state.timestamp).toBeUndefined()
  })

  it('applies widget_added events', () => {
    const events = [
      { event: 'canvas_created', timestamp: '2026-01-01', title: 'Test', widgets: [] },
      { event: 'widget_added', timestamp: '2026-01-02', widget: { id: 'w1', type: 'sticky-note', position: { x: 0, y: 0 }, props: { text: 'Hello', color: 'yellow' } } },
      { event: 'widget_added', timestamp: '2026-01-03', widget: { id: 'w2', type: 'markdown', position: { x: 100, y: 100 }, props: { content: '# Test' } } },
    ]
    const state = materialize(events)
    expect(state.widgets).toHaveLength(2)
    expect(state.widgets[0].id).toBe('w1')
    expect(state.widgets[1].id).toBe('w2')
  })

  it('applies widget_updated events', () => {
    const events = [
      { event: 'canvas_created', timestamp: '2026-01-01', title: 'Test', widgets: [
        { id: 'w1', type: 'sticky-note', position: { x: 0, y: 0 }, props: { text: 'Original', color: 'yellow' } },
      ] },
      { event: 'widget_updated', timestamp: '2026-01-02', widgetId: 'w1', props: { text: 'Updated' } },
    ]
    const state = materialize(events)
    expect(state.widgets[0].props.text).toBe('Updated')
    expect(state.widgets[0].props.color).toBe('yellow') // unchanged props preserved
  })

  it('applies widget_moved events', () => {
    const events = [
      { event: 'canvas_created', timestamp: '2026-01-01', title: 'Test', widgets: [
        { id: 'w1', type: 'sticky-note', position: { x: 0, y: 0 }, props: {} },
      ] },
      { event: 'widget_moved', timestamp: '2026-01-02', widgetId: 'w1', position: { x: 300, y: 400 } },
    ]
    const state = materialize(events)
    expect(state.widgets[0].position).toEqual({ x: 300, y: 400 })
  })

  it('applies widget_removed events', () => {
    const events = [
      { event: 'canvas_created', timestamp: '2026-01-01', title: 'Test', widgets: [
        { id: 'w1', type: 'sticky-note', position: { x: 0, y: 0 }, props: {} },
        { id: 'w2', type: 'markdown', position: { x: 100, y: 100 }, props: {} },
      ] },
      { event: 'widget_removed', timestamp: '2026-01-02', widgetId: 'w1' },
    ]
    const state = materialize(events)
    expect(state.widgets).toHaveLength(1)
    expect(state.widgets[0].id).toBe('w2')
  })

  it('applies settings_updated events', () => {
    const events = [
      { event: 'canvas_created', timestamp: '2026-01-01', title: 'Test', grid: true, gridSize: 24, widgets: [] },
      { event: 'settings_updated', timestamp: '2026-01-02', settings: { gridSize: 12, title: 'Updated Title' } },
    ]
    const state = materialize(events)
    expect(state.gridSize).toBe(12)
    expect(state.title).toBe('Updated Title')
    expect(state.grid).toBe(true) // unchanged setting preserved
  })

  it('applies source_updated events', () => {
    const events = [
      { event: 'canvas_created', timestamp: '2026-01-01', title: 'Test', sources: [{ export: 'A' }], widgets: [] },
      { event: 'source_updated', timestamp: '2026-01-02', sources: [{ export: 'B' }, { export: 'C' }] },
    ]
    const state = materialize(events)
    expect(state.sources).toEqual([{ export: 'B' }, { export: 'C' }])
  })

  it('applies widgets_replaced events (bulk update)', () => {
    const events = [
      { event: 'canvas_created', timestamp: '2026-01-01', title: 'Test', widgets: [
        { id: 'w1', type: 'sticky-note', position: { x: 0, y: 0 }, props: {} },
      ] },
      { event: 'widgets_replaced', timestamp: '2026-01-02', widgets: [
        { id: 'w1', type: 'sticky-note', position: { x: 50, y: 50 }, props: {} },
        { id: 'w3', type: 'markdown', position: { x: 200, y: 200 }, props: {} },
      ] },
    ]
    const state = materialize(events)
    expect(state.widgets).toHaveLength(2)
    expect(state.widgets[0].position).toEqual({ x: 50, y: 50 })
    expect(state.widgets[1].id).toBe('w3')
  })

  it('returns empty object for empty event stream', () => {
    expect(materialize([])).toEqual({})
  })

  it('silently ignores unknown event types', () => {
    const events = [
      { event: 'canvas_created', timestamp: '2026-01-01', title: 'Test', widgets: [] },
      { event: 'future_event', timestamp: '2026-01-02', data: 'whatever' },
    ]
    const state = materialize(events)
    expect(state.title).toBe('Test')
  })

  it('handles a full lifecycle: create, add, update, move, remove', () => {
    const events = [
      { event: 'canvas_created', timestamp: '1', title: 'Canvas', grid: true, gridSize: 24, colorMode: 'auto', widgets: [] },
      { event: 'widget_added', timestamp: '2', widget: { id: 'w1', type: 'sticky-note', position: { x: 0, y: 0 }, props: { text: 'Hello', color: 'yellow' } } },
      { event: 'widget_added', timestamp: '3', widget: { id: 'w2', type: 'markdown', position: { x: 100, y: 0 }, props: { content: '# Title' } } },
      { event: 'widget_updated', timestamp: '4', widgetId: 'w1', props: { text: 'Updated hello' } },
      { event: 'widget_moved', timestamp: '5', widgetId: 'w2', position: { x: 200, y: 300 } },
      { event: 'widget_added', timestamp: '6', widget: { id: 'w3', type: 'sticky-note', position: { x: 400, y: 0 }, props: { text: 'Temp', color: 'red' } } },
      { event: 'widget_removed', timestamp: '7', widgetId: 'w3' },
      { event: 'settings_updated', timestamp: '8', settings: { gridSize: 12 } },
    ]
    const state = materialize(events)
    expect(state.title).toBe('Canvas')
    expect(state.gridSize).toBe(12)
    expect(state.widgets).toHaveLength(2)
    expect(state.widgets[0]).toEqual({ id: 'w1', type: 'sticky-note', position: { x: 0, y: 0 }, props: { text: 'Updated hello', color: 'yellow' } })
    expect(state.widgets[1]).toEqual({ id: 'w2', type: 'markdown', position: { x: 200, y: 300 }, props: { content: '# Title' } })
  })
})

describe('materializeFromText', () => {
  it('parses and materializes in one step', () => {
    const text = '{"event":"canvas_created","timestamp":"2026-01-01","title":"Test","widgets":[]}\n{"event":"widget_added","timestamp":"2026-01-02","widget":{"id":"w1","type":"sticky-note","position":{"x":0,"y":0},"props":{"text":"Hello"}}}\n'
    const state = materializeFromText(text)
    expect(state.title).toBe('Test')
    expect(state.widgets).toHaveLength(1)
    expect(state.widgets[0].props.text).toBe('Hello')
  })
})

describe('serializeEvent', () => {
  it('serializes an event to a single line', () => {
    const event = { event: 'widget_added', timestamp: '2026-01-01', widget: { id: 'w1' } }
    const line = serializeEvent(event)
    expect(line).not.toContain('\n')
    expect(JSON.parse(line)).toEqual(event)
  })
})
