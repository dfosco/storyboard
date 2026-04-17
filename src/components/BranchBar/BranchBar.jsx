/**
 * BranchBar — dark top bar showing current branch on non-main routes.
 * Mounted at app root, shows on /branch-- routes with a dropdown to switch.
 */
import { useState, useEffect } from 'react'
import { useBranches, useSwitchBranch } from './useBranches.js'
import BranchDropdown from './BranchDropdown.jsx'
import css from './BranchBar.module.css'

export default function BranchBar({ basePath }) {
  const { branches, currentBranch, branchBasePath, gitUser } = useBranches(basePath)
  const { switching, switchError, switchBranch } = useSwitchBranch(basePath, branchBasePath)
  const [hidden, setHidden] = useState(false)

  // On /branch-- routes only
  const isOnBranch = currentBranch !== 'main'

  // Listen for chrome hidden (cmd+.)
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setHidden(document.documentElement.classList.contains('storyboard-chrome-hidden'))
    })
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])

  if (!isOnBranch || hidden) return null

  // Never render inside embeds (iframes) — prototypes and story previews
  if (window.self !== window.top) return null

  function hideChrome() {
    window.dispatchEvent(new KeyboardEvent('keydown', {
      key: '.', metaKey: true, bubbles: true,
    }))
  }

  return (
    <div className={css.bar}>
      <div className={css.barInner}>
        <BranchDropdown
          branches={branches}
          currentBranch={currentBranch}
          gitUser={gitUser}
          switching={switching}
          switchError={switchError}
          switchBranch={switchBranch}
          variant="bar"
        />
        <div className={css.barActions}>
          <button className={css.barAction} onClick={hideChrome}>Hide</button>
        </div>
      </div>
    </div>
  )
}
