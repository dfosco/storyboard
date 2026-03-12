import { useState, useEffect, useCallback } from 'react'
import { loadFlow, getFlagKeys } from '@dfosco/storyboard-core'
import { BeakerIcon, InfoIcon, SyncIcon, XIcon, ScreenFullIcon, ZapIcon } from '@primer/octicons-react'
import styles from './DevTools.module.css'
import FeatureFlagsPanel from './FeatureFlagsPanel.jsx'

function getFlowName() {
  const p = new URLSearchParams(window.location.search)
  return p.get('flow') || p.get('scene') || 'default'
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
  const [panelOpen, setPanelOpen] = useState(false)
  const [flagsPanelOpen, setFlagsPanelOpen] = useState(false)
  const [sceneData, setSceneData] = useState(null)
  const [sceneError, setSceneError] = useState(null)

  // Close menu on outside click — use mousedown so it fires before
  // React re-renders remove the clicked element from the DOM
  useEffect(() => {
    if (!menuOpen) return
    function handleMouseDown(e) {
      if (!e.target.closest(`.${styles.wrapper}`)) {
        setMenuOpen(false)
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
          setFlagsPanelOpen(false)
          setMenuOpen(false)
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [visible])

  const openMenu = useCallback(() => {
    setMenuOpen((v) => !v)
  }, [])

  const handleShowFlowInfo = useCallback(() => {
    setMenuOpen(false)
    setPanelOpen(true)
    setSceneError(null)
    try {
      setSceneData(loadFlow(getFlowName()))
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

  const handleOpenFlagsPanel = useCallback(() => {
    setMenuOpen(false)
    setFlagsPanelOpen(true)
  }, [])

  if (!visible) return null

  const hasFlags = getFlagKeys().length > 0

  return (
    <>
      {/* Flow info overlay panel */}
      {panelOpen && (
        <div className={styles.overlay}>
          <div className={styles.overlayBackdrop} onClick={() => setPanelOpen(false)} />
          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <span className={styles.panelTitle}>Flow: {getFlowName()}</span>
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
      <FeatureFlagsPanel open={flagsPanelOpen} onClose={() => setFlagsPanelOpen(false)} />

      {/* Floating toolbar */}
      <div className={styles.wrapper}>
        {menuOpen && (
          <div className={styles.menu}>
            <button className={styles.menuItem} onClick={handleViewfinder}>
              <ScreenFullIcon size={16} /> See viewfinder
            </button>
            <button className={styles.menuItem} onClick={handleShowFlowInfo}>
              <InfoIcon size={16} /> Show flow info
            </button>
            <button className={styles.menuItem} onClick={handleResetParams}>
              <SyncIcon size={16} /> Reset all params
            </button>
            {hasFlags && (
              <>
                <div className={styles.separator} />
                <button className={styles.menuItem} onClick={handleOpenFlagsPanel}>
                  <ZapIcon size={16} /> Feature Flags
                </button>
              </>
            )}
            <div className={styles.shortcutHint}>
              Press <code>⌘ + .</code> to hide
            </div>
          </div>
        )}
        <button className={styles.trigger} aria-label="Storyboard DevTools" onClick={openMenu}>
          <BeakerIcon className={styles.triggerIcon} size={16} />
        </button>
      </div>
    </>
  )
}
