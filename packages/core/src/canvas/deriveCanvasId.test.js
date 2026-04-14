import { describe, it, expect } from 'vitest'
import { deriveCanvasId } from './server.js'

describe('deriveCanvasId', () => {
  it('returns basename for flat canvas in src/canvas/', () => {
    expect(deriveCanvasId('src/canvas/design-overview.canvas.jsonl')).toBe('design-overview')
  })

  it('returns path-based ID for canvas inside a .folder/', () => {
    expect(deriveCanvasId('src/canvas/research.folder/interviews.canvas.jsonl')).toBe('research/interviews')
  })

  it('strips .folder suffix from path', () => {
    expect(deriveCanvasId('src/canvas/ux.folder/onboarding.canvas.jsonl')).toBe('ux/onboarding')
  })

  it('handles nested subdirectories inside a .folder/', () => {
    expect(deriveCanvasId('src/canvas/team.folder/sub/deep.canvas.jsonl')).toBe('team/sub/deep')
  })

  it('returns path-based ID for prototype-scoped canvas', () => {
    expect(deriveCanvasId('src/prototypes/Dashboard/overview.canvas.jsonl')).toBe('Dashboard/overview')
  })

  it('handles prototype inside a .folder/', () => {
    expect(deriveCanvasId('src/prototypes/main.folder/Dashboard/overview.canvas.jsonl')).toBe('Dashboard/overview')
  })

  it('returns basename for canvas outside src/canvas/ and src/prototypes/', () => {
    expect(deriveCanvasId('other/place/my.canvas.jsonl')).toBe('my')
  })

  it('returns null for non-canvas files', () => {
    expect(deriveCanvasId('src/canvas/readme.md')).toBeNull()
  })

  it('duplicate basenames in different folders get distinct IDs', () => {
    const id1 = deriveCanvasId('src/canvas/alpha.folder/overview.canvas.jsonl')
    const id2 = deriveCanvasId('src/canvas/beta.folder/overview.canvas.jsonl')
    expect(id1).toBe('alpha/overview')
    expect(id2).toBe('beta/overview')
    expect(id1).not.toBe(id2)
  })

  it('normalizes backslashes to forward slashes', () => {
    expect(deriveCanvasId('src\\canvas\\research.folder\\interviews.canvas.jsonl')).toBe('research/interviews')
  })
})
