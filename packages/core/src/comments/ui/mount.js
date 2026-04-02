/**
 * Mount the comments system — keyboard shortcut, cursor overlay, click-to-comment.
 *
 * Call mountComments() once at app startup (after initCommentsConfig).
 */

import { getCommentsConfig, isCommentsEnabled } from '../config.js'
import { isAuthenticated, getCachedUser } from '../auth.js'
import { toggleCommentMode, setCommentMode, isCommentModeActive, subscribeToCommentMode } from '../commentMode.js'
import { fetchRouteCommentsSummary, fetchCommentDetail, moveComment, createComment } from '../api.js'
import { getCachedComments, setCachedComments, clearCachedComments, savePendingComment, getPendingComments, removePendingComment } from '../commentCache.js'
import { showComposer } from './composer.js'
import { openAuthModal } from './authModal.js'
import { showCommentWindow, closeCommentWindow } from './commentWindow.js'
import './comment-layout.css'
import './comments.css'

const INVALID_PAT_ERROR_MESSAGE = 'GitHub PAT is invalid or expired. Please sign in again.'
const TOKEN_ACCESS_ERROR_MESSAGE =
  `Token doesn't have access to repository discussions. ` +
  'Fine-grained tokens need "Discussions: Read and write". ' +
  'Classic tokens need the "repo" scope.'

let banner = null
let overlay = null
let activeComposer = null
let renderedPins = []
let cachedDiscussion = null

function esc(str) {
  const d = document.createElement('div')
  d.textContent = str ?? ''
  return d.innerHTML
}

function ensureOverlay() {
  if (overlay) return overlay

  overlay = document.createElement('div')
  overlay.className = 'sb-comment-overlay'
  document.body.appendChild(overlay)

  // Click handler for placing comments lives on the overlay itself
  overlay.addEventListener('click', (e) => {
    if (!isCommentModeActive()) return
    if (e.target.closest('.sb-composer') || e.target.closest('.sb-comment-pin') || e.target.closest('.sb-comment-window')) return
    handleOverlayClick(e)
  })

  return overlay
}

function showBanner() {
  if (banner) return
  banner = document.createElement('div')
  banner.className = 'sb-banner fixed flex items-center pe-none sans-serif sb-shadow'
  banner.innerHTML = `
    Comment mode — click to place a comment. Press
    <kbd class="sb-kbd">C</kbd> or
    <kbd class="sb-kbd">Esc</kbd> to exit.
  `
  document.body.appendChild(banner)
}

function hideBanner() {
  if (!banner) return
  banner.remove()
  banner = null
}

function getCurrentRoute() {
  return window.location.pathname
}

function getAuthErrorMessage(err) {
  const message = typeof err === 'string'
    ? err
    : (typeof err?.message === 'string' ? err.message : String(err ?? ''))

  if (message.includes('invalid or expired')) {
    return INVALID_PAT_ERROR_MESSAGE
  }

  if (message.includes('Not authenticated — no GitHub PAT found')) {
    return 'Not authenticated — no GitHub PAT found. Please sign in.'
  }

  if (
    message.includes('Resource not accessible by personal access token') ||
    message.includes('insufficient') ||
    message.includes("doesn't have access")
  ) {
    return TOKEN_ACCESS_ERROR_MESSAGE
  }

  if (message.includes('Could not resolve to a Repository with the name')) {
    const config = getCommentsConfig()
    const repo = config?.repo?.owner && config?.repo?.name
      ? `${config.repo.owner}/${config.repo.name}`
      : 'the configured repository'

    return `Token cannot access repository \`${repo}\`. Please set the PAT repository access to \`${repo}\` and include Discussions read/write (classic tokens need repo scope).`
  }

  return null
}

async function promptReauthForAuthError(err) {
  const errorMessage = getAuthErrorMessage(err)
  if (!errorMessage) return false

  setCommentMode(false)
  openAuthModal({ initialError: errorMessage })
  return true
}

function clearPins() {
  for (const pin of renderedPins) pin.remove()
  renderedPins = []
}

function reloadComments() {
  clearCachedComments(getCurrentRoute())
  loadAndRenderComments()
}

/**
 * Render an optimistic pin immediately after the user submits a comment.
 * Returns callbacks to mark it as succeeded or failed.
 */
function renderOptimisticPin(ov, xPct, yPct, text, user) {
  const pendingId = `pending-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const pin = document.createElement('div')
  pin.className = 'sb-comment-pin sb-comment-pin-pending absolute br-100 sb-bg pointer sb-shadow pe-auto overflow-hidden'
  pin.style.left = `${xPct}%`
  pin.style.top = `${yPct}%`
  pin.title = `${user?.login ?? 'you'}: ${text.slice(0, 80)}`

  pin.innerHTML = user?.avatarUrl
    ? `<img class="br-100 db sb-pin-img" src="${esc(user.avatarUrl)}" alt="${esc(user.login)}" draggable="false" />`
    : ''

  ov.appendChild(pin)
  renderedPins.push(pin)

  return {
    pendingId,
    succeed: () => {
      pin.classList.remove('sb-comment-pin-pending')
    },
    fail: () => {
      pin.classList.remove('sb-comment-pin-pending')
      pin.classList.add('sb-comment-pin-failed')
      pin.title = `⚠ Failed to post — click to retry: ${text.slice(0, 60)}`

      // Save to localStorage for persistence
      const route = getCurrentRoute()
      savePendingComment(route, { id: pendingId, x: xPct, y: yPct, text, author: user })

      // Click to retry
      pin.addEventListener('click', async (e) => {
        e.stopPropagation()
        pin.classList.remove('sb-comment-pin-failed')
        pin.classList.add('sb-comment-pin-pending')
        pin.title = 'Retrying…'
        try {
          await createComment(route, xPct, yPct, text)
          removePendingComment(route, pendingId)
          pin.classList.remove('sb-comment-pin-pending')
          reloadComments()
        } catch (err) {
          if (await promptReauthForAuthError(err)) return
          pin.classList.remove('sb-comment-pin-pending')
          pin.classList.add('sb-comment-pin-failed')
          pin.title = `⚠ Failed to post — click to retry: ${text.slice(0, 60)}`
        }
      })
    },
  }
}

/**
 * Render pins for pending (failed) comments from localStorage.
 */
function renderPendingPins(ov) {
  const route = getCurrentRoute()
  const pending = getPendingComments(route)
  for (const p of pending) {
    const pin = document.createElement('div')
    pin.className = 'sb-comment-pin sb-comment-pin-failed absolute br-100 sb-bg pointer sb-shadow pe-auto overflow-hidden'
    pin.style.left = `${p.x}%`
    pin.style.top = `${p.y}%`
    pin.title = `⚠ Failed to post — click to retry: ${p.text?.slice(0, 60) ?? ''}`

    pin.innerHTML = p.author?.avatarUrl
      ? `<img class="br-100 db sb-pin-img" src="${esc(p.author.avatarUrl)}" alt="${esc(p.author.login)}" draggable="false" />`
      : ''

    pin.addEventListener('click', async (e) => {
      e.stopPropagation()
      pin.classList.remove('sb-comment-pin-failed')
      pin.classList.add('sb-comment-pin-pending')
      pin.title = 'Retrying…'
      try {
        await createComment(route, p.x, p.y, p.text)
        removePendingComment(route, p.id)
        pin.remove()
        reloadComments()
      } catch (err) {
        if (await promptReauthForAuthError(err)) return
        pin.classList.remove('sb-comment-pin-pending')
        pin.classList.add('sb-comment-pin-failed')
        pin.title = `⚠ Failed to post — click to retry: ${p.text?.slice(0, 60) ?? ''}`
      }
    })

    ov.appendChild(pin)
    renderedPins.push(pin)
  }
}

function renderPin(ov, comment, index) {
  const hue = Math.round((index * 137.5) % 360)
  const pin = document.createElement('div')
  pin.className = 'sb-comment-pin absolute br-100 sb-bg pointer sb-shadow pe-auto overflow-hidden'
  pin.style.left = `${comment.meta?.x ?? 0}%`
  pin.style.top = `${comment.meta?.y ?? 0}%`
  pin.style.setProperty('--sb--pin-hue', String(hue))

  if (comment.meta?.resolved) pin.setAttribute('data-resolved', 'true')
  pin.title = `${comment.author?.login ?? 'unknown'}: ${comment.text?.slice(0, 80) ?? ''}`

  pin.innerHTML = comment.author?.avatarUrl
    ? `<img class="br-100 db sb-pin-img" src="${esc(comment.author.avatarUrl)}" alt="${esc(comment.author.login)}" draggable="false" />`
    : ''

  pin._commentId = comment.id
  comment._rawBody = comment.body

  let dragged = false

  pin.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return
    dragged = false
    const startX = e.clientX
    const startY = e.clientY
    const startLeftPct = parseFloat(pin.style.left)
    const startTopPct = parseFloat(pin.style.top)

    const onMove = (ev) => {
      const dx = ev.clientX - startX
      const dy = ev.clientY - startY
      if (!dragged && Math.abs(dx) < 4 && Math.abs(dy) < 4) return
      dragged = true
      const xPct = Math.round((startLeftPct + (dx / window.innerWidth) * 100) * 10) / 10
      const docHeight = document.documentElement.scrollHeight
      const yPct = Math.round((startTopPct + (dy / docHeight) * 100) * 10) / 10
      pin.style.left = `${xPct}%`
      pin.style.top = `${yPct}%`
    }

    const onUp = async (ev) => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
      if (!dragged) return

      const dx = ev.clientX - startX
      const dy = ev.clientY - startY
      const xPct = Math.round((startLeftPct + (dx / window.innerWidth) * 100) * 10) / 10
      const docHeight = document.documentElement.scrollHeight
      const yPct = Math.round((startTopPct + (dy / docHeight) * 100) * 10) / 10
      comment.meta = { ...comment.meta, x: xPct, y: yPct }

      try {
        await moveComment(comment.id, comment._rawBody ?? comment.body ?? '', xPct, yPct)
        comment._rawBody = null
        clearCachedComments(getCurrentRoute())
      } catch (err) {
        if (await promptReauthForAuthError(err)) return
        console.error('[storyboard] Failed to move pin:', err)
      }
    }

    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
    e.preventDefault()
  })

  pin.addEventListener('click', async (e) => {
    e.stopPropagation()
    if (dragged) return
    if (activeComposer) {
      activeComposer.destroy()
      activeComposer = null
    }
    // Lazy-load full comment detail (replies, reactions, createdAt)
    try {
      const detail = await fetchCommentDetail(comment.id)
      if (detail) {
        detail._rawBody = detail.body
        showCommentWindow(ov, detail, cachedDiscussion, {
          onClose: () => {},
          onMove: () => reloadComments(),
        })
      }
    } catch (err) {
      console.warn('[storyboard] Could not load comment detail:', err.message)
      // Fall back to summary data
      showCommentWindow(ov, comment, cachedDiscussion, {
        onClose: () => {},
        onMove: () => reloadComments(),
      })
    }
  })

  ov.appendChild(pin)
  renderedPins.push(pin)
  return pin
}

function renderCachedPins() {
  if (!cachedDiscussion?.comments?.length) return
  const ov = ensureOverlay()
  clearPins()
  cachedDiscussion.comments.forEach((comment, i) => {
    if (comment.meta?.x != null && comment.meta?.y != null) {
      renderPin(ov, comment, i)
    }
  })
  renderPendingPins(ov)
}

async function loadAndRenderComments() {
  if (!isAuthenticated()) return
  const ov = ensureOverlay()
  const route = getCurrentRoute()

  // 1. Render from cache — skip API if cache is fresh
  const cached = getCachedComments(route)
  if (cached) {
    cachedDiscussion = cached
    renderCachedPins()
    return
  }

  // 2. Cache miss/expired — fetch lightweight summary
  try {
    const discussion = await fetchRouteCommentsSummary(route)
    cachedDiscussion = discussion
    if (discussion) {
      setCachedComments(route, discussion)
    }
    clearPins()
    if (!discussion?.comments?.length) {
      renderPendingPins(ov)
      return
    }

    discussion.comments.forEach((comment, i) => {
      if (comment.meta?.x != null && comment.meta?.y != null) {
        renderPin(ov, comment, i)
      }
    })
    renderPendingPins(ov)

    autoOpenCommentFromUrl(ov, discussion)
  } catch (err) {
    if (await promptReauthForAuthError(err)) return
    console.warn('[storyboard] Could not load comments:', err.message)
  }
}

async function autoOpenCommentFromUrl(ov, discussion) {
  const commentId = new URLSearchParams(window.location.search).get('comment')
  if (!commentId || !discussion?.comments?.length) return

  const comment = discussion.comments.find(c => c.id === commentId)
  if (!comment) return

  if (comment.meta?.y != null) {
    const docHeight = document.documentElement.scrollHeight
    const yPx = (comment.meta.y / 100) * docHeight
    const viewTop = window.scrollY
    const viewBottom = viewTop + window.innerHeight
    if (yPx < viewTop || yPx > viewBottom) {
      const scrollTarget = Math.max(0, yPx - window.innerHeight / 3)
      window.scrollTo({ top: scrollTarget, behavior: 'smooth' })
    }
  }

  // Lazy-load full detail before opening window
  try {
    const detail = await fetchCommentDetail(commentId)
    if (detail) {
      detail._rawBody = detail.body
      showCommentWindow(ov, detail, discussion, {
        onClose: () => {},
        onMove: () => reloadComments(),
      })
      return
    }
  } catch (err) {
    if (await promptReauthForAuthError(err)) return
    console.warn('[storyboard] Could not load comment detail:', err.message)
  }

  // Fallback to summary data
  comment._rawBody = comment.body
  showCommentWindow(ov, comment, discussion, {
    onClose: () => {},
    onMove: () => reloadComments(),
  })
}

function handleOverlayClick(e) {
  if (!isCommentModeActive()) return
  if (e.target.closest('.sb-composer') || e.target.closest('.sb-comment-pin') || e.target.closest('.sb-comment-window')) return

  closeCommentWindow()

  // x as percentage of viewport width, y as percentage of full document height
  const xPct = Math.round((e.clientX / window.innerWidth) * 1000) / 10
  const docHeight = document.documentElement.scrollHeight
  const yPct = Math.round(((e.clientY + window.scrollY) / docHeight) * 1000) / 10

  // Move existing composer instead of destroying and recreating
  if (activeComposer) {
    activeComposer.moveTo(xPct, yPct)
    return
  }

  const ov = ensureOverlay()
  const route = getCurrentRoute()
  activeComposer = showComposer(ov, xPct, yPct, route, {
    onCancel: () => { activeComposer = null },
    onSubmitOptimistic: (text, x, y) => {
      activeComposer = null
      const user = getCachedUser()
      const opt = renderOptimisticPin(ov, x, y, text, user)
      // Fire API call in background
      createComment(route, x, y, text)
        .then(() => {
          opt.succeed()
          reloadComments()
        })
        .catch(async (err) => {
          console.error('[storyboard] Failed to post comment:', err)
          if (await promptReauthForAuthError(err)) return
          opt.fail()
        })
    },
  })
}

function setBodyCommentMode(active) {
  if (active) {
    document.body.classList.add('sb-comment-mode')
    showBanner()
    ensureOverlay()
    renderCachedPins()
    loadAndRenderComments()
  } else {
    document.body.classList.remove('sb-comment-mode')
    hideBanner()
    if (activeComposer) {
      activeComposer.destroy()
      activeComposer = null
    }
    closeCommentWindow()
    clearPins()
    if (overlay) {
      overlay.remove()
      overlay = null
    }
  }
}

let _mounted = false

/**
 * Mount the comments system — registers keyboard shortcuts, cursor overlay, and click handler.
 * Initializes Alpine.js for comments UI components.
 * Safe to call multiple times (idempotent).
 */
export function mountComments() {
  if (_mounted) return
  _mounted = true

  subscribeToCommentMode(setBodyCommentMode)

  window.addEventListener('keydown', (e) => {
    const tag = e.target.tagName
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || e.target.isContentEditable) {
      return
    }

    if (e.key === 'c' && !e.metaKey && !e.ctrlKey && !e.altKey) {
      if (!isCommentsEnabled()) return
      e.preventDefault()

      if (!isCommentModeActive() && !isAuthenticated()) {
        openAuthModal()
        return
      }

      toggleCommentMode()
    }

    if (e.key === 'Escape') {
      if (isCommentModeActive()) {
        e.preventDefault()
        setCommentMode(false)
      }
    }
  })

  if (isCommentsEnabled() && isAuthenticated()) {
    const commentId = new URLSearchParams(window.location.search).get('comment')
    if (commentId) {
      setCommentMode(true)
    }
  }
}
