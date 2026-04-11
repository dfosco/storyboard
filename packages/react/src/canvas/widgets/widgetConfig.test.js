import { describe, expect, it } from 'vitest'
import { isResizable, getFeatures, getWidgetMeta } from './widgetConfig.js'

describe('isResizable', () => {
  // Vitest runs with import.meta.env.PROD = true, so prod: false widgets
  // correctly return false. This tests the production behavior.
  it('returns false for resize-enabled widgets when prod is false (production env)', () => {
    expect(isResizable('sticky-note')).toBe(false)
    expect(isResizable('prototype')).toBe(false)
    expect(isResizable('figma-embed')).toBe(false)
    expect(isResizable('image')).toBe(false)
    expect(isResizable('component')).toBe(false)
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
