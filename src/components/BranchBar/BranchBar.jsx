/**
 * BranchBar — dark top bar showing current branch on non-main routes.
 *
 * Dev: shows branch name as a static label (use CLI to switch branches).
 * Prod: same label (dropdown switching deferred to ViewfinderNew).
 */
import { useState, useEffect, useMemo } from 'react'
import { GitBranchIcon } from '@primer/octicons-react'
import css from './BranchBar.module.css'

export default function BranchBar({ basePath }) {
  const [hidden, setHidden] = useState(false)

  const currentBranch = useMemo(() => {
    const m = (basePath || '').match(/\/branch--([^/]+)\/?$/)
    return m ? m[1] : 'main'
  }, [basePath])

  const isOnBranch = currentBranch !== 'main'

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setHidden(document.documentElement.classList.contains('storyboard-chrome-hidden'))
    })
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])

  if (!isOnBranch || hidden) return null

  function hideChrome() {
    window.dispatchEvent(new KeyboardEvent('keydown', {
      key: '.', metaKey: true, bubbles: true,
    }))
  }

  return (
    <div className={css.bar} data-branch-bar>
      <div className={css.barInner}>
        <span className={css.barLabel}>
          <GitBranchIcon size={12} />
          <span className={css.barBranchName}>{currentBranch}</span>
        </span>
        <div className={css.barActions}>
          <button className={css.barAction} onClick={hideChrome}>Hide</button>
        </div>
      </div>
    </div>
  )
}
