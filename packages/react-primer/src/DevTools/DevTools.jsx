import { useState, useEffect, useCallback, useSyncExternalStore } from 'react'
import { loadScene, getAllFlags, toggleFlag, getFlagKeys, subscribeToHash, getHashSnapshot } from '@dfosco/storyboard-core'
import { BeakerIcon, InfoIcon, SyncIcon, XIcon, ScreenFullIcon, CheckIcon, ZapIcon, ArrowLeftIcon } from '@primer/octicons-react'
import styles from './DevTools.module.css'

function getSceneName() {
  return new URLSearchParams(window.location.search).get('scene') || 'default'
}

/**
 * Storyboard DevTools — a floating toolbar for development.
 *
 * Uses a custom dropdown menu (no Primer ActionMenu) so that
 * view-swapping and flag toggling don't auto-close the panel.
 */
export default function DevTools() {
  const [visible, setVisible] = useState(true)
  const [menuOpen, setMenuOpen] = useState(false)
  const [menuView, setMenuView] = useState('main') // 'main' | 'flags'
  const [panelOpen, setPanelOpen] = useState(false)
  const [sceneData, setSceneData] = useState(null)
  const [sceneError, setSceneError] = useState(null)

  // Subscribe to hash for flag reactivity
  useSyncExternalStore(subscribeToHash, getHashSnapshot)

  // Close menu on outside click — use mousedown so it fires before
  // React re-renders remove the clicked element from the DOM
  useEffect(() => {
    if (!menuOpen) return
    function handleMouseDown(e) {
      if (!e.target.closest(`.${styles.wrapper}`)) {
        setMenuOpen(false)
        setMenuView('main')
      }
    }
    document.addEventListener('mousedown', handleMouseDown)
    return () => document.removeEventListener('mousedown', handleMouseDown)
  }, [menuOpen])

  // Cmd+. keyboard shortcut to toggle toolbar
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === '.' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setVisible((v) => !v)
        if (visible) {
          setPanelOpen(false)
          setMenuOpen(false)
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [visible])

  const openMenu = useCallback(() => {
    setMenuOpen((v) => !v)
    setMenuView('main')
  }, [])

  const handleShowSceneInfo = useCallback(() => {
    setMenuOpen(false)
    setPanelOpen(true)
    setSceneError(null)
    try {
      setSceneData(loadScene(getSceneName()))
    } catch (err) {
      setSceneError(err.message)
    }
  }, [])

  const handleResetParams = useCallback(() => {
    window.location.hash = ''
    setMenuOpen(false)
  }, [])

  const handleViewfinder = useCallback(() => {
    setMenuOpen(false)
    window.location.href = (document.querySelector('base')?.href || '/') + 'viewfinder'
  }, [])

  if (!visible) return null

  const flagKeys = getFlagKeys()
  const flags = getAllFlags()

  return (
    <>
      {/* Scene info overlay panel */}
      {panelOpen && (
        <div className={styles.overlay}>
          <div className={styles.overlayBackdrop} onClick={() => setPanelOpen(false)} />
          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <span className={styles.panelTitle}>Scene: {getSceneName()}</span>
              <button className={styles.panelClose} onClick={() => setPanelOpen(false)} aria-label="Close panel">
                <XIcon size={16} />
              </button>
            </div>
            <div className={styles.panelBody}>
              {sceneError && <span className={styles.error}>{sceneError}</span>}
              {!sceneError && sceneData && (
                <pre className={styles.codeBlock}>{JSON.stringify(sceneData, null, 2)}</pre>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Floating toolbar */}
      <div className={styles.wrapper}>
        {menuOpen && (
          <div className={styles.menu}>
            {menuView === 'main' ? (
              <>
                <button className={styles.menuItem} onClick={handleViewfinder}>
                  <ScreenFullIcon size={16} /> See viewfinder
                </button>
                <button className={styles.menuItem} onClick={handleShowSceneInfo}>
                  <InfoIcon size={16} /> Show scene info
                </button>
                <button className={styles.menuItem} onClick={handleResetParams}>
                  <SyncIcon size={16} /> Reset all params
                </button>
                {flagKeys.length > 0 && (
                  <>
                    <div className={styles.separator} />
                    <button className={styles.menuItem} onClick={() => setMenuView('flags')}>
                      <ZapIcon size={16} /> Feature Flags
                    </button>
                  </>
                )}
                <div className={styles.shortcutHint}>
                  Press <code>⌘ + .</code> to hide
                </div>
              </>
            ) : (
              <>
                <button className={styles.menuItem} onClick={() => setMenuView('main')}>
                  <ArrowLeftIcon size={16} /> Back
                </button>
                <div className={styles.separator} />
                {flagKeys.map((key) => (
                  <button key={key} className={styles.menuItem} onClick={() => toggleFlag(key)}>
                    <span className={styles.flagIcon}>
                      {flags[key]?.current ? <CheckIcon size={16} /> : null}
                    </span>
                    {key}
                  </button>
                ))}
              </>
            )}
          </div>
        )}
        <button className={styles.trigger} aria-label="Storyboard DevTools" onClick={openMenu}>
          <BeakerIcon className={styles.triggerIcon} size={16} />
        </button>
      </div>
    </>
  )
}
