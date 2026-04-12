import {
  normalizeAutosyncScope,
  matchesAutosyncScope,
  filterFilesForAutosyncScope,
  isRetryablePushError,
  getAutosyncWorktreeDirName,
} from './server.js'

describe('autosync scope helpers', () => {
  it('normalizes unknown scope to canvas', () => {
    expect(normalizeAutosyncScope('unknown')).toBe('canvas')
    expect(normalizeAutosyncScope(undefined)).toBe('canvas')
  })

  it('matches canvas scope files', () => {
    expect(matchesAutosyncScope('canvas', 'src/canvas/widgets.canvas.jsonl')).toBe(true)
    expect(matchesAutosyncScope('canvas', 'src/canvas/notes.txt')).toBe(true)
    expect(matchesAutosyncScope('canvas', 'src/prototypes/demo/default.flow.json')).toBe(false)
  })

  it('matches prototype scope files', () => {
    expect(matchesAutosyncScope('prototype', 'src/prototypes/demo/default.flow.json')).toBe(true)
    expect(matchesAutosyncScope('prototype', 'src/canvas/widgets.canvas.jsonl')).toBe(false)
  })

  it('filters changed files by selected scope', () => {
    const files = [
      'src/canvas/board.canvas.jsonl',
      'src/prototypes/demo/default.flow.json',
      'README.md',
    ]

    expect(filterFilesForAutosyncScope('canvas', files)).toEqual([
      'src/canvas/board.canvas.jsonl',
    ])
    expect(filterFilesForAutosyncScope('prototype', files)).toEqual([
      'src/prototypes/demo/default.flow.json',
    ])
  })

  it('detects retryable push failures', () => {
    expect(isRetryablePushError('failed to push some refs')).toBe(true)
    expect(isRetryablePushError('non-fast-forward')).toBe(true)
    expect(isRetryablePushError('hint: Updates were rejected because the tip of your current branch is behind')).toBe(true)
    expect(isRetryablePushError('fetch first')).toBe(true)
    expect(isRetryablePushError('some other git error')).toBe(false)
  })

  it('sanitizes autosync worktree dir names', () => {
    expect(getAutosyncWorktreeDirName('feature/my-branch')).toBe('feature-my-branch')
    expect(getAutosyncWorktreeDirName('3.11.0')).toBe('3.11.0')
    expect(getAutosyncWorktreeDirName('')).toBe('branch')
  })
})
