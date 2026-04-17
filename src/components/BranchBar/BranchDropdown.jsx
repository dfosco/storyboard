/**
 * BranchDropdown — shared dropdown menu for switching branches.
 * Used by both BranchBar (top bar) and ViewfinderNew (header button).
 */
import { useState } from 'react'
import { GitBranchIcon, ChevronDownIcon } from '@primer/octicons-react'
import { Menu } from '@base-ui/react/menu'
import css from './BranchBar.module.css'

export default function BranchDropdown({
  branches,
  currentBranch,
  gitUser,
  switching,
  switchError,
  switchBranch,
  variant = 'default', // 'default' (viewfinder) or 'bar' (branch bar)
}) {
  const [showAll, setShowAll] = useState(false)

  if (!branches || branches.length === 0) return null

  const twoWeeksAgo = Date.now() - 14 * 24 * 60 * 60 * 1000

  const myBranches = gitUser
    ? branches.filter(b => b.author === gitUser || b.branch === currentBranch)
    : branches.filter(b => b.branch === currentBranch)

  const otherBranches = branches.filter(b => !myBranches.some(m => m.branch === b.branch))

  const recentBranches = showAll
    ? [...otherBranches].sort((a, b) => (a.branch || '').localeCompare(b.branch || ''))
    : otherBranches
        .filter(b => !b.lastModified || new Date(b.lastModified).getTime() > twoWeeksAgo)
        .sort((a, b) => (a.branch || '').localeCompare(b.branch || ''))

  const triggerClass = variant === 'bar' ? css.barTrigger : css.branchBtn

  return (
    <Menu.Root>
      <Menu.Trigger className={triggerClass} disabled={!!switching}>
        <GitBranchIcon size={variant === 'bar' ? 12 : 14} />
        <span className={css.branchBtnText}>
          {switching ? `Switching to ${switching}…` : currentBranch}
        </span>
        {!switching && <ChevronDownIcon size={12} />}
        {switching && <span className={css.spinner} />}
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner className={css.branchPositioner} side="bottom" align={variant === 'bar' ? 'center' : 'end'} sideOffset={4}>
          <Menu.Popup className={css.branchPopup}>
            {switchError && (
              <div className={css.branchError}>{switchError}</div>
            )}

            {myBranches.length > 0 && (
              <>
                <div className={css.branchSectionLabel}>My branches</div>
                {myBranches.map(b => (
                  <Menu.Item
                    key={b.branch}
                    className={`${css.branchItem}${b.branch === currentBranch ? ` ${css.branchItemActive}` : ''}`}
                    onClick={() => switchBranch(b.branch, b.folder)}
                  >
                    <GitBranchIcon size={12} />
                    {b.branch}
                  </Menu.Item>
                ))}
              </>
            )}

            {myBranches.length > 0 && recentBranches.length > 0 && (
              <div className={css.branchSeparator} />
            )}

            {recentBranches.length > 0 && (
              <>
                <div className={css.branchSectionLabel}>
                  {showAll ? 'All branches' : 'Recent branches'}
                </div>
                <Menu.Viewport className={css.branchViewport}>
                  {recentBranches.map(b => (
                    <Menu.Item
                      key={b.branch}
                      className={`${css.branchItem}${b.branch === currentBranch ? ` ${css.branchItemActive}` : ''}`}
                      onClick={() => switchBranch(b.branch, b.folder)}
                    >
                      <GitBranchIcon size={12} />
                      {b.branch}
                    </Menu.Item>
                  ))}
                </Menu.Viewport>
              </>
            )}

            {!showAll && otherBranches.length > recentBranches.length && (
              <>
                <div className={css.branchSeparator} />
                <button
                  className={css.branchShowAll}
                  onClick={(e) => { e.stopPropagation(); setShowAll(true) }}
                >
                  See all branches ({otherBranches.length})
                </button>
              </>
            )}
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  )
}
