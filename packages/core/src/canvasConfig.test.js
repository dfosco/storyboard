import { describe, it, expect, beforeEach } from 'vitest'
import { initCanvasConfig, getPasteRules, _resetCanvasConfig } from './canvasConfig.js'

describe('canvasConfig', () => {
  beforeEach(() => {
    _resetCanvasConfig()
  })

  it('returns empty array by default', () => {
    expect(getPasteRules()).toEqual([])
  })

  it('stores paste rules from config', () => {
    const rules = [
      { pattern: 'youtube\\.com', type: 'link-preview', props: { url: '$url' } },
    ]
    initCanvasConfig({ pasteRules: rules })
    expect(getPasteRules()).toEqual(rules)
  })

  it('handles missing pasteRules gracefully', () => {
    initCanvasConfig({})
    expect(getPasteRules()).toEqual([])
  })

  it('handles undefined config', () => {
    initCanvasConfig()
    expect(getPasteRules()).toEqual([])
  })

  it('handles non-array pasteRules', () => {
    initCanvasConfig({ pasteRules: 'not-an-array' })
    expect(getPasteRules()).toEqual([])
  })

  it('resets on _resetCanvasConfig', () => {
    initCanvasConfig({ pasteRules: [{ pattern: '.', type: 'test' }] })
    expect(getPasteRules()).toHaveLength(1)
    _resetCanvasConfig()
    expect(getPasteRules()).toEqual([])
  })
})
