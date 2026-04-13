import { describe, expect, it } from 'vitest'
import { isResizable, getFeatures, getWidgetMeta } from './widgetConfig.js'

describe('isResizable', () => {
  // Vitest runs in dev mode by default (import.meta.env.PROD = false)
  // In dev mode, all resize-enabled widgets are resizable
  it('returns true for resize-enabled widgets in dev mode', () => {
    expect(isResizable('sticky-note')).toBe(true)
    expect(isResizable('prototype')).toBe(true)
    expect(isResizable('figma-embed')).toBe(true)
    expect(isResizable('image')).toBe(true)
    expect(isResizable('component')).toBe(true)
  })

  it('returns false for widget types with resize disabled', () => {
    expect(isResizable('markdown')).toBe(false)
    expect(isResizable('link-preview')).toBe(false)
  })

  it('returns false for unknown widget types', () => {
    expect(isResizable('nonexistent')).toBe(false)
  })
})

describe('getFeatures', () => {
  it('returns features array for known widget types', () => {
    const features = getFeatures('sticky-note')
    expect(Array.isArray(features)).toBe(true)
    expect(features.length).toBeGreaterThan(0)
  })

  it('returns empty array for unknown widget types', () => {
    expect(getFeatures('nonexistent')).toEqual([])
  })
})

describe('getWidgetMeta', () => {
  it('returns label and icon for known types', () => {
    const meta = getWidgetMeta('sticky-note')
    expect(meta).toEqual({ label: 'Sticky Note', icon: '📝' })
  })

  it('returns null for unknown types', () => {
    expect(getWidgetMeta('nonexistent')).toBeNull()
  })
})
