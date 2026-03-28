/**
 * Tests for mount.js — comment overlay, banner, and body comment-mode logic.
 *
 * Heavy UI deps are mocked; we test DOM-level behavior of the
 * exported mountComments() plus the internal helpers it exercises.
 */

import { vi } from 'vitest'

// ---- Mocks (must be before importing mount.js) ----

vi.mock('../api.js', () => ({
  fetchRouteCommentsSummary: vi.fn(),
  fetchCommentDetail: vi.fn(),
  moveComment: vi.fn(),
  createComment: vi.fn(),
}))

vi.mock('../commentCache.js', () => ({
  getCachedComments: vi.fn(() => null),
  setCachedComments: vi.fn(),
  clearCachedComments: vi.fn(),
  savePendingComment: vi.fn(),
  getPendingComments: vi.fn(() => []),
  removePendingComment: vi.fn(),
}))

vi.mock('./composer.js', () => ({
  showComposer: vi.fn(),
}))

vi.mock('./authModal.js', () => ({
  openAuthModal: vi.fn(),
}))

vi.mock('./commentWindow.js', () => ({
  showCommentWindow: vi.fn(),
  closeCommentWindow: vi.fn(),
}))

describe('mount.js', () => {
  // mountComments() is idempotent via a module-level _mounted flag, so we
  // must re-import the module fresh for each test to reset that flag.
  // All sibling modules must also be re-imported so they share the same instances.
  let mountComments
  let setCommentMode
  let isCommentModeActive // eslint-disable-line no-unused-vars
  let initCommentsConfig
  let setToken
  let clearToken

  beforeEach(async () => {
    // Reset DOM
    document.body.innerHTML = ''
    document.body.className = ''
    document.body.style.cssText = ''

    // Fresh import to reset _mounted flag and all module-level state
    vi.resetModules()

    // Re-mock after resetModules
    vi.doMock('../api.js', () => ({
      fetchRouteCommentsSummary: vi.fn(),
      fetchCommentDetail: vi.fn(),
      moveComment: vi.fn(),
      createComment: vi.fn(),
    }))
    vi.doMock('../commentCache.js', () => ({
      getCachedComments: vi.fn(() => null),
      setCachedComments: vi.fn(),
      clearCachedComments: vi.fn(),
      savePendingComment: vi.fn(),
      getPendingComments: vi.fn(() => []),
      removePendingComment: vi.fn(),
    }))
    vi.doMock('./composer.js', () => ({ showComposer: vi.fn() }))
    vi.doMock('./authModal.js', () => ({ openAuthModal: vi.fn() }))
    vi.doMock('./commentWindow.js', () => ({
      showCommentWindow: vi.fn(),
      closeCommentWindow: vi.fn(),
    }))

    // Import everything fresh so mount.js and its deps share the same instances
    const mountMod = await import('./mount.js')
    const commentModeMod = await import('../commentMode.js')
    const configMod = await import('../config.js')
    const authMod = await import('../auth.js')

    mountComments = mountMod.mountComments
    setCommentMode = commentModeMod.setCommentMode
    isCommentModeActive = commentModeMod.isCommentModeActive
    initCommentsConfig = configMod.initCommentsConfig
    setToken = authMod.setToken
    clearToken = authMod.clearToken

    // Reset storyboard state
    setCommentMode(false)
    clearToken()
    initCommentsConfig(null)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('ensureOverlay (via setBodyCommentMode)', () => {
    it('does not set position:relative on document.body', () => {
      initCommentsConfig({ comments: { repo: { owner: 'o', name: 'r' } } })
      setToken('ghp_test')
      mountComments()

      // Activate comment mode — triggers ensureOverlay internally
      setCommentMode(true)

      // body should NOT get position:relative forced on it
      expect(document.body.style.position).not.toBe('relative')
    })

    it('appends overlay to document.body when comment mode activates', () => {
      initCommentsConfig({ comments: { repo: { owner: 'o', name: 'r' } } })
      setToken('ghp_test')
      mountComments()

      setCommentMode(true)

      const overlay = document.body.querySelector('.sb-comment-overlay')
      expect(overlay).not.toBeNull()
      expect(overlay.parentElement).toBe(document.body)
    })

    it('removes overlay when comment mode deactivates', () => {
      initCommentsConfig({ comments: { repo: { owner: 'o', name: 'r' } } })
      setToken('ghp_test')
      mountComments()

      setCommentMode(true)
      expect(document.body.querySelector('.sb-comment-overlay')).not.toBeNull()

      setCommentMode(false)
      expect(document.body.querySelector('.sb-comment-overlay')).toBeNull()
    })
  })

  describe('banner', () => {
    it('shows banner when comment mode activates', () => {
      initCommentsConfig({ comments: { repo: { owner: 'o', name: 'r' } } })
      setToken('ghp_test')
      mountComments()

      setCommentMode(true)

      const banner = document.body.querySelector('.sb-banner')
      expect(banner).not.toBeNull()
      expect(banner.textContent).toContain('Comment mode')
    })

    it('removes banner when comment mode deactivates', () => {
      initCommentsConfig({ comments: { repo: { owner: 'o', name: 'r' } } })
      setToken('ghp_test')
      mountComments()

      setCommentMode(true)
      setCommentMode(false)

      expect(document.body.querySelector('.sb-banner')).toBeNull()
    })
  })

  describe('body class', () => {
    it('adds sb-comment-mode class when comment mode activates', () => {
      initCommentsConfig({ comments: { repo: { owner: 'o', name: 'r' } } })
      setToken('ghp_test')
      mountComments()

      setCommentMode(true)
      expect(document.body.classList.contains('sb-comment-mode')).toBe(true)
    })

    it('removes sb-comment-mode class when comment mode deactivates', () => {
      initCommentsConfig({ comments: { repo: { owner: 'o', name: 'r' } } })
      setToken('ghp_test')
      mountComments()

      setCommentMode(true)
      setCommentMode(false)
      expect(document.body.classList.contains('sb-comment-mode')).toBe(false)
    })
  })

  describe('mountComments idempotency', () => {
    it('is safe to call multiple times', () => {
      mountComments()
      mountComments()
      mountComments()
      // No error thrown — _mounted guard prevents double init
    })
  })
})
