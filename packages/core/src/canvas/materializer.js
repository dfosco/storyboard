/**
 * Canvas JSONL Materializer
 *
 * Pure, framework-agnostic module that replays a stream of canvas events
 * into a materialized canvas state object. Zero dependencies.
 *
 * Event types:
 *   canvas_created   — full initial state (first line)
 *   widget_added     — append a widget
 *   widget_updated   — patch widget props
 *   widget_moved     — update widget position
 *   widget_removed   — remove a widget by id
 *   settings_updated — patch canvas-level settings
 *   source_updated   — replace the sources array
 *   widgets_replaced — replace the entire widgets array (bulk update)
 */

/**
 * Split a text blob into top-level JSON object snippets.
 * Supports strict JSONL and accidentally concatenated objects.
 *
 * @param {string} text
 * @returns {string[]}
 */
function splitJsonObjects(text) {
  const chunks = []
  let start = -1
  let depth = 0
  let inString = false
  let escaped = false

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]

    if (inString) {
      if (escaped) {
        escaped = false
      } else if (ch === '\\') {
        escaped = true
      } else if (ch === '"') {
        inString = false
      }
      continue
    }

    if (ch === '"') {
      inString = true
      continue
    }

    if (ch === '{') {
      if (depth === 0) start = i
      depth++
      continue
    }

    if (ch === '}') {
      if (depth > 0) depth--
      if (depth === 0 && start >= 0) {
        chunks.push(text.slice(start, i + 1))
        start = -1
      }
    }
  }

  return chunks
}

/**
 * Parse canvas event text into an array of event objects.
 * Blank lines and malformed JSON snippets are skipped.
 *
 * @param {string} text - Raw canvas event file contents
 * @returns {object[]} Parsed event objects
 */
export function parseCanvasJsonl(text) {
  const events = []
  for (const snippet of splitJsonObjects(text || '')) {
    try {
      events.push(JSON.parse(snippet))
    } catch {
      // Skip malformed snippets
    }
  }
  return events
}

/**
 * Materialize a canvas state from an ordered array of events.
 *
 * @param {object[]} events - Array of event objects (first should be canvas_created)
 * @returns {object} Materialized canvas state
 */
export function materialize(events) {
  let state = {}

  for (const evt of events) {
    switch (evt.event) {
      case 'canvas_created': {
        // Strip event metadata, keep everything else as initial state
        const initial = { ...evt }
        delete initial.event
        delete initial.timestamp
        state = initial
        break
      }

      case 'widget_added': {
        if (!state.widgets) state.widgets = []
        state.widgets = [...state.widgets, evt.widget]
        break
      }

      case 'widget_updated': {
        state.widgets = (state.widgets || []).map((w) =>
          w.id === evt.widgetId
            ? { ...w, props: { ...w.props, ...evt.props } }
            : w,
        )
        break
      }

      case 'widget_moved': {
        state.widgets = (state.widgets || []).map((w) =>
          w.id === evt.widgetId ? { ...w, position: evt.position } : w,
        )
        break
      }

      case 'widget_removed': {
        state.widgets = (state.widgets || []).filter(
          (w) => w.id !== evt.widgetId,
        )
        break
      }

      case 'settings_updated': {
        if (evt.settings) {
          const { ...rest } = state
          Object.assign(rest, evt.settings)
          state = rest
        }
        break
      }

      case 'source_updated': {
        state.sources = evt.sources
        break
      }

      case 'widgets_replaced': {
        state.widgets = evt.widgets
        break
      }

      // Unknown events are silently ignored (forward compatibility)
    }
  }

  return state
}

/**
 * Convenience: parse JSONL text and materialize in one step.
 *
 * @param {string} text - Raw JSONL file contents
 * @returns {object} Materialized canvas state
 */
export function materializeFromText(text) {
  return materialize(parseCanvasJsonl(text))
}

/**
 * Serialize a single event object to a JSONL line (no trailing newline).
 *
 * @param {object} event - Event object
 * @returns {string} Single-line JSON string
 */
export function serializeEvent(event) {
  return JSON.stringify(event)
}
