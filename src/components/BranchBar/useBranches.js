/**
 * useBranches — shared hook for branch data across BranchBar and BranchDropdown.
 * Fetches live branch list from /_storyboard/worktrees API on mount.
 */
import { useState, useEffect, useMemo, useCallback } from 'react'

const isLocalDev = typeof window !== 'undefined' && window.__SB_LOCAL_DEV__ === true

export function useBranches(basePath) {
  const [branches, setBranches] = useState(() => {
    if (typeof window !== 'undefined' && Array.isArray(window.__SB_BRANCHES__)) {
      return window.__SB_BRANCHES__
    }
    return null
  })

  const [gitUser, setGitUser] = useState(null)

  useEffect(() => {
    const apiBase = (basePath || '/').replace(/\/$/, '')

    fetch(`${apiBase}/_storyboard/git-user`).then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.name) setGitUser(data.name) })
      .catch(() => {})

    // Always fetch live branch list
    fetch(`${apiBase}/_storyboard/worktrees`).then(r => r.ok ? r.json() : null)
      .then(data => { if (Array.isArray(data) && data.length > 0) setBranches(data) })
      .catch(() => {})
  }, [basePath])

  const currentBranch = useMemo(() => {
    const m = (basePath || '').match(/\/branch--([^/]+)\/?$/)
    return m ? m[1] : 'main'
  }, [basePath])

  const branchBasePath = (basePath || '/').replace(/\/branch--[^/]*\/$/, '/')

  return { branches, currentBranch, branchBasePath, gitUser }
}

export function useSwitchBranch(basePath, branchBasePath) {
  const [switching, setSwitching] = useState(null)
  const [switchError, setSwitchError] = useState(null)

  const switchBranch = useCallback(async (branch, folder) => {
    if (switching) return
    setSwitching(branch)
    setSwitchError(null)

    if (!isLocalDev) {
      // Prod: direct navigation
      window.location.href = `${branchBasePath}${folder || (branch === 'main' ? '' : `branch--${branch}/`)}`
      return
    }

    // Dev: call switch-branch API to spin up server
    const apiBase = (basePath || '/').replace(/\/$/, '')
    try {
      const res = await fetch(`${apiBase}/_storyboard/switch-branch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ branch }),
      })
      const data = await res.json()
      if (res.ok && data.url) {
        window.location.href = data.url
      } else {
        setSwitchError(data.error || 'Failed to switch')
        setSwitching(null)
      }
    } catch (e) {
      setSwitchError(e.message || 'Server not reachable')
      setSwitching(null)
    }
  }, [basePath, branchBasePath, switching])

  return { switching, switchError, switchBranch }
}
