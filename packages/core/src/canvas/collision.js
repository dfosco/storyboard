/**
 * Canvas Collision Detection — Find collision-free positions for widgets.
 *
 * When placing or moving widgets, this module checks for overlaps with
 * existing widgets and adjusts the position until no collisions remain.
 */

/**
 * Default widget sizes by type (from widgets.config.json).
 */
export const DEFAULT_SIZES = {
  'sticky-note': { width: 270, height: 170 },
  'markdown': { width: 530, height: 240 },
  'prototype': { width: 800, height: 600 },
  'figma-embed': { width: 800, height: 450 },
  'codepen-embed': { width: 800, height: 450 },
  'image': { width: 400, height: 300 },
  'link-preview': { width: 320, height: 200 },
  'component': { width: 300, height: 200 },
  'story': { width: 780, height: 420 },
}

/**
 * Get the bounding box of a widget.
 * @param {object} widget - Widget with position and props
 * @returns {{ x: number, y: number, width: number, height: number }}
 */
export function getWidgetBounds(widget) {
  const { position = { x: 0, y: 0 }, props = {}, type } = widget
  const defaults = DEFAULT_SIZES[type] || { width: 270, height: 170 }
  return {
    x: position.x,
    y: position.y,
    width: props.width ?? defaults.width,
    height: props.height ?? defaults.height,
  }
}

/**
 * Check if two rectangles overlap.
 * @param {{ x: number, y: number, width: number, height: number }} a
 * @param {{ x: number, y: number, width: number, height: number }} b
 * @returns {boolean}
 */
export function rectsOverlap(a, b) {
  return !(
    a.x + a.width <= b.x ||  // a is to the left of b
    b.x + b.width <= a.x ||  // b is to the left of a
    a.y + a.height <= b.y || // a is above b
    b.y + b.height <= a.y    // b is above a
  )
}

/**
 * Check if a proposed position collides with any existing widget.
 * @param {{ x: number, y: number, width: number, height: number }} rect - Proposed bounds
 * @param {object[]} widgets - Existing widgets array
 * @param {string} [excludeId] - Widget ID to exclude (for move operations)
 * @returns {object[]} - All colliding widgets (empty array if none)
 */
export function findCollisions(rect, widgets, excludeId = null) {
  const colliders = []
  for (const widget of widgets) {
    if (excludeId && widget.id === excludeId) continue
    const bounds = getWidgetBounds(widget)
    if (rectsOverlap(rect, bounds)) {
      colliders.push(widget)
    }
  }
  return colliders
}

/**
 * Check if a proposed position collides with any existing widget.
 * Returns the first colliding widget (for backwards compatibility).
 * @param {{ x: number, y: number, width: number, height: number }} rect - Proposed bounds
 * @param {object[]} widgets - Existing widgets array
 * @param {string} [excludeId] - Widget ID to exclude (for move operations)
 * @returns {object|null} - The first colliding widget, or null if no collision
 */
export function findCollision(rect, widgets, excludeId = null) {
  const colliders = findCollisions(rect, widgets, excludeId)
  return colliders.length > 0 ? colliders[0] : null
}

/**
 * Snap a value to grid.
 * @param {number} value
 * @param {number} gridSize
 * @returns {number}
 */
export function snapToGrid(value, gridSize) {
  return Math.round(value / gridSize) * gridSize
}

/**
 * Find a collision-free position for a widget.
 *
 * Strategy:
 * 1. Try the initial position
 * 2. If collision, find the max endX among all colliders and move past it
 * 3. Repeat until no collisions or maxIterations exhausted
 * 4. If horizontal resolution exhausted, fall back to moving down
 * 5. Snap final position to grid
 *
 * @param {object} options
 * @param {number} options.x - Initial X position
 * @param {number} options.y - Initial Y position
 * @param {number} options.width - Widget width
 * @param {number} options.height - Widget height
 * @param {object[]} options.widgets - Existing widgets array
 * @param {string} [options.excludeId] - Widget ID to exclude (for move operations)
 * @param {number} [options.gridSize=24] - Grid size for snapping
 * @param {number} [options.gap] - Gap between widgets (defaults to gridSize)
 * @param {number} [options.maxIterations=50] - Max collision resolution attempts
 * @returns {{ x: number, y: number, adjusted: boolean }}
 */
export function findFreePosition({
  x,
  y,
  width,
  height,
  widgets,
  excludeId = null,
  gridSize = 24,
  gap = null,
  maxIterations = 50,
}) {
  const spacing = gap ?? gridSize
  let currentX = x
  let currentY = y
  let adjusted = false

  // Phase 1: Try moving right past all colliders
  for (let i = 0; i < maxIterations; i++) {
    const rect = { x: currentX, y: currentY, width, height }
    const colliders = findCollisions(rect, widgets, excludeId)

    if (colliders.length === 0) {
      return {
        x: snapToGrid(currentX, gridSize),
        y: snapToGrid(currentY, gridSize),
        adjusted,
      }
    }

    // Jump past the rightmost edge of all colliders
    let maxEndX = 0
    for (const c of colliders) {
      const b = getWidgetBounds(c)
      const endX = b.x + b.width
      if (endX > maxEndX) maxEndX = endX
    }
    currentX = maxEndX + spacing
    adjusted = true
  }

  // Phase 2: Reset X, try moving down
  currentX = x

  for (let i = 0; i < maxIterations; i++) {
    const rect = { x: currentX, y: currentY, width, height }
    const colliders = findCollisions(rect, widgets, excludeId)

    if (colliders.length === 0) {
      return {
        x: snapToGrid(currentX, gridSize),
        y: snapToGrid(currentY, gridSize),
        adjusted,
      }
    }

    // Jump past the bottommost edge of all colliders
    let maxEndY = 0
    for (const c of colliders) {
      const b = getWidgetBounds(c)
      const endY = b.y + b.height
      if (endY > maxEndY) maxEndY = endY
    }
    currentY = maxEndY + spacing
    adjusted = true
  }

  // Fallback: return the last attempted position (snapped)
  return {
    x: snapToGrid(currentX, gridSize),
    y: snapToGrid(currentY, gridSize),
    adjusted,
  }
}

/**
 * Resolve collision for a widget being placed or moved.
 * Convenience wrapper that extracts size from widget type/props.
 *
 * @param {object} options
 * @param {number} options.x - Target X position
 * @param {number} options.y - Target Y position
 * @param {string} options.type - Widget type
 * @param {object} [options.props={}] - Widget props (may contain width/height)
 * @param {object[]} options.widgets - Existing widgets array
 * @param {string} [options.excludeId] - Widget ID to exclude
 * @param {number} [options.gridSize=24] - Grid size
 * @returns {{ x: number, y: number, adjusted: boolean }}
 */
export function resolvePosition({
  x,
  y,
  type,
  props = {},
  widgets,
  excludeId = null,
  gridSize = 24,
}) {
  const defaults = DEFAULT_SIZES[type] || { width: 270, height: 170 }
  const width = props.width ?? defaults.width
  const height = props.height ?? defaults.height

  return findFreePosition({
    x,
    y,
    width,
    height,
    widgets,
    excludeId,
    gridSize,
  })
}
