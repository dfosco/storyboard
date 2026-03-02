import { useSyncExternalStore } from 'react'
import { getAllFlags, getFlagKeys, toggleFlag, subscribeToHash, getHashSnapshot } from '@dfosco/storyboard-core'
import { CheckIcon, XIcon } from '@primer/octicons-react'
import styles from './DevTools.module.css'

export default function FeatureFlagsPanel({ open, onClose }) {
  useSyncExternalStore(subscribeToHash, getHashSnapshot)

  if (!open) return null

  const flagKeys = getFlagKeys()
  const flags = getAllFlags()

  return (
    <div className={styles.overlay}>
      <div className={styles.overlayBackdrop} onClick={onClose} />
      <div className={styles.panel}>
        <div className={styles.panelHeader}>
          <span className={styles.panelTitle}>Feature Flags</span>
          <button className={styles.panelClose} onClick={onClose} aria-label="Close feature flags panel">
            <XIcon size={16} />
          </button>
        </div>
        <div className={styles.panelBody}>
          {flagKeys.length === 0 ? (
            <div className={styles.noFlags}>No feature flags are configured.</div>
          ) : (
            <div className={styles.flagsList}>
              {flagKeys.map((key) => (
                <button key={key} className={styles.flagPanelItem} onClick={() => toggleFlag(key)}>
                  <span className={styles.flagPanelCheck}>
                    {flags[key]?.current ? <CheckIcon size={16} /> : null}
                  </span>
                  {key}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
