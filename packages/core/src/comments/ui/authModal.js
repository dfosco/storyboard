/**
 * Auth modal — Svelte-based modal for entering a GitHub PAT.
 *
 * Styled with Tachyons + sb-* custom classes for light/dark mode support.
 */

import { mount, unmount } from 'svelte'
import AuthModal from './AuthModal.svelte'
import { getCachedUser, clearToken } from '../auth.js'

const MODAL_ID = 'sb-auth-modal'

/**
 * Open the auth modal. Returns a promise that resolves with the user info
 * on successful sign-in, or null if cancelled.
 * @param {{ initialError?: string|null }} [options]
 * @returns {Promise<{ login: string, avatarUrl: string }|null>}
 */
export function openAuthModal(options = {}) {
  const { initialError = null } = options

  return new Promise((resolve) => {
    const existing = document.getElementById(MODAL_ID)
    if (existing) existing.remove()

    const backdrop = document.createElement('div')
    backdrop.id = MODAL_ID
    backdrop.className = 'sb-auth-backdrop fixed top-0 right-0 bottom-0 left-0 flex items-center justify-center sans-serif'

    let instance = null

    function cleanup() {
      window.removeEventListener('keydown', onKeyDown, true)
      if (instance) { unmount(instance); instance = null }
      backdrop.remove()
    }

    function onKeyDown(e) {
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        cleanup()
        resolve(null)
      }
    }

    // Close on backdrop click
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) {
        cleanup()
        resolve(null)
      }
    })

    window.addEventListener('keydown', onKeyDown, true)
    document.body.appendChild(backdrop)

    instance = mount(AuthModal, {
      target: backdrop,
      props: {
        initialError,
        onDone: (user) => {
          cleanup()
          resolve(user)
        },
        onClose: () => {
          cleanup()
          resolve(null)
        },
      },
    })
  })
}

/**
 * Open a sign-out confirmation. Clears token immediately.
 */
export function signOut() {
  const user = getCachedUser()
  clearToken()
  console.log(`[storyboard] Signed out${user ? ` (was ${user.login})` : ''}`)
}
