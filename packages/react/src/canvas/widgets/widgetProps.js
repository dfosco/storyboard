/**
 * Canvas Widget Props API
 *
 * Every canvas widget receives its data through a structured `props` object
 * stored in .canvas.json. This module defines the prop schema system that
 * widgets use to declare, read, and update their editable properties.
 *
 * ## Prop Categories
 *
 * Widget props are grouped into three categories:
 *
 * ### `content` — User-editable content
 * Text, markdown, URLs — the stuff users type or paste.
 * Updated frequently (every keystroke when editing).
 * Examples: sticky note text, markdown content, embed URL.
 *
 * ### `settings` — Widget configuration
 * One-off choices that affect appearance or behavior.
 * Updated infrequently (user picks from a menu).
 * Examples: sticky note color, markdown width, embed layout.
 *
 * ### `size` — Dimensions
 * Width and height of the widget.
 * Updated via resize handles or explicit input.
 * Examples: markdown block width, prototype embed width/height.
 *
 * ## Storage Format (.canvas.json)
 *
 * Props are stored flat in the widget's `props` object:
 *
 * ```json
 * {
 *   "id": "sticky-1",
 *   "type": "sticky-note",
 *   "position": { "x": 100, "y": 200 },
 *   "props": {
 *     "text": "Hello world",
 *     "color": "yellow"
 *   }
 * }
 * ```
 *
 * ## Widget Contract
 *
 * Every widget component receives:
 *   - `id`       — stable widget identifier
 *   - `props`    — the flat props object (may be null/undefined)
 *   - `onUpdate` — callback to persist prop changes: onUpdate({ key: value })
 *   - `onRemove` — callback to delete the widget
 *
 * `onUpdate` accepts a partial object that is shallow-merged into `props`.
 * Multiple keys can be updated in one call:
 *   onUpdate({ text: 'new text', color: 'blue' })
 *
 * ## Declaring Widget Props (Schema)
 *
 * Each widget type exports a `schema` describing its props.
 * This is used by the toolbar, canvas settings, and future widget inspectors.
 */

/**
 * @typedef {'text' | 'select' | 'number' | 'url' | 'boolean'} PropType
 *
 * @typedef {Object} PropDef
 * @property {PropType} type        — input type for editing
 * @property {string}   label       — human-readable label
 * @property {string}   category    — 'content' | 'settings' | 'size'
 * @property {*}        defaultValue — fallback when prop is missing
 * @property {Array}    [options]   — choices for 'select' type
 * @property {number}   [min]       — minimum for 'number' type
 * @property {number}   [max]       — maximum for 'number' type
 */

/**
 * Read a prop value with fallback to schema default.
 * @param {object} props    — widget props object (may be null)
 * @param {string} key      — prop name
 * @param {object} schema   — widget schema
 * @returns {*}
 */
export function readProp(props, key, schema) {
  const value = props?.[key]
  if (value !== undefined && value !== null) return value
  return schema[key]?.defaultValue ?? null
}

/**
 * Read all props with defaults applied from schema.
 * @param {object} props  — widget props object (may be null)
 * @param {object} schema — widget schema
 * @returns {object}
 */
export function readAllProps(props, schema) {
  const result = {}
  for (const key of Object.keys(schema)) {
    result[key] = readProp(props, key, schema)
  }
  return result
}

/**
 * Get default props for a widget type from its schema.
 * Used when creating new widgets.
 * @param {object} schema — widget schema
 * @returns {object}
 */
export function getDefaults(schema) {
  const result = {}
  for (const [key, def] of Object.entries(schema)) {
    if (def.defaultValue !== undefined) {
      result[key] = def.defaultValue
    }
  }
  return result
}

// ── Widget Schemas ──────────────────────────────────────────────────

export const stickyNoteSchema = {
  text:  { type: 'text',   label: 'Text',  category: 'content', defaultValue: '' },
  color: { type: 'select', label: 'Color', category: 'settings', defaultValue: 'yellow',
           options: ['yellow', 'blue', 'green', 'pink', 'purple', 'orange'] },
}

export const markdownSchema = {
  content: { type: 'text',   label: 'Content', category: 'content', defaultValue: '' },
  width:   { type: 'number', label: 'Width',   category: 'size',    defaultValue: 360, min: 200, max: 1200 },
}

export const prototypeEmbedSchema = {
  src:    { type: 'url',    label: 'URL',    category: 'content',  defaultValue: '' },
  label:  { type: 'text',   label: 'Label',  category: 'settings', defaultValue: '' },
  zoom:   { type: 'number', label: 'Zoom',   category: 'settings', defaultValue: 100, min: 25, max: 200 },
  width:  { type: 'number', label: 'Width',  category: 'size',     defaultValue: 800, min: 200, max: 2000 },
  height: { type: 'number', label: 'Height', category: 'size',     defaultValue: 600, min: 200, max: 1500 },
}

export const linkPreviewSchema = {
  url:   { type: 'url',  label: 'URL',   category: 'content',  defaultValue: '' },
  title: { type: 'text', label: 'Title', category: 'content',  defaultValue: '' },
}

/**
 * Schema registry — maps widget type strings to their schemas.
 */
export const schemas = {
  'sticky-note': stickyNoteSchema,
  'markdown': markdownSchema,
  'prototype': prototypeEmbedSchema,
  'link-preview': linkPreviewSchema,
}
