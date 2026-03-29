import StickyNote from './StickyNote.jsx'
import MarkdownBlock from './MarkdownBlock.jsx'
import PrototypeEmbed from './PrototypeEmbed.jsx'

/**
 * Maps widget type strings to their React components.
 * Each component receives: { id, props, onUpdate, onRemove }
 */
export const widgetRegistry = {
  'sticky-note': StickyNote,
  'markdown': MarkdownBlock,
  'prototype': PrototypeEmbed,
}

/**
 * Resolve a widget type string to its component.
 * Returns null for unknown types.
 */
export function getWidgetComponent(type) {
  return widgetRegistry[type] ?? null
}
