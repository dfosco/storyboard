import { useState, useEffect, useCallback, useRef, useSyncExternalStore } from 'react'
import { ActionMenu, ActionList } from '@primer/react'
import { loadScene, getAllFlags, toggleFlag, getFlagKeys, subscribeToHash, getHashSnapshot } from '@dfosco/storyboard-core'
import { BeakerIcon, InfoIcon, SyncIcon, XIcon, ScreenFullIcon, CheckIcon, ZapIcon, ArrowLeftIcon } from '@primer/octicons-react'
import styles from './DevTools.module.css'

function getSceneName() {
  return new URLSearchParams(window.location.search).get('scene') || 'default'
}

/**
 * Storyboard DevTools — a floating toolbar for development.
 *
 * Features:
 *  - Floating button (bottom-center) that opens a menu
 *  - "Show scene info" — translucent overlay panel with resolved scene JSON
 *  - "Reset all params" — clears all URL hash session params
 *  - Cmd+. (Mac) / Ctrl+. (other) toggles the toolbar visibility
 */
export default function DevTools() {
  const [visible, setVisible] = useState(true)
  const [panelOpen, setPanelOpen] = useState(false)
  const [sceneData, setSceneData] = useState(null)
  const [sceneError, setSceneError] = useState(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [menuView, setMenuView] = useState('main') // 'main' | 'flags'
  const keepOpenRef = useRef(false)

  const handleOpenChange = useCallback((open) => {
    if (!open && keepOpenRef.current) {
      keepOpenRef.current = false
      return
    }
    setMenuOpen(open)
    if (!open) setMenuView('main')
  }, [])

  const switchToFlags = useCallback(() => {
    keepOpenRef.current = true
    setMenuView('flags')
  }, [])

  const switchToMain = useCallback(() => {
    keepOpenRef.current = true
    setMenuView('main')
  }, [])

  const handleToggleFlag = useCallback((key) => {
    keepOpenRef.current = true
    toggleFlag(key)
  }, [])

  // Cmd+. keyboard shortcut to toggle toolbar
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === '.' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setVisible((v) => !v)
        if (visible) {
          setPanelOpen(false)
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [visible])

  const handleShowSceneInfo = useCallback(() => {
    const sceneName = getSceneName()
    setPanelOpen(true)
    setSceneError(null)

    try {
      setSceneData(loadScene(sceneName))
    } catch (err) {
      setSceneError(err.message)
    }
  }, [])

  const handleResetParams = useCallback(() => {
    window.location.hash = ''
  }, [])

  const handleViewfinder = useCallback(() => {
    window.location.href = (document.querySelector('base')?.href || '/') + 'viewfinder'
  }, [])

  if (!visible) return null

  return (
    <>
      {/* Scene info overlay panel */}
      {panelOpen && (
        <div className={styles.overlay}>
          <div
            className={styles.overlayBackdrop}
            onClick={() => setPanelOpen(false)}
          />
          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <span className={styles.panelTitle}>
                Scene: {getSceneName()}
              </span>
              <button
                className={styles.panelClose}
                onClick={() => setPanelOpen(false)}
                aria-label="Close panel"
              >
                <XIcon size={16} />
              </button>
            </div>
            <div className={styles.panelBody}>
              {sceneError && (
                <span className={styles.error}>{sceneError}</span>
              )}
              {!sceneError && sceneData && (
                <pre className={styles.codeBlock}>
                  {JSON.stringify(sceneData, null, 2)}
                </pre>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Floating toolbar */}
      <div className={styles.wrapper}>
        <ActionMenu open={menuOpen} onOpenChange={handleOpenChange}>
          <ActionMenu.Anchor>
            <button
              className={styles.trigger}
              aria-label="Storyboard DevTools"
            >
              <BeakerIcon className={styles.triggerIcon} size={16} />
            </button>
          </ActionMenu.Anchor>
          <ActionMenu.Overlay align="center" side="outside-top" sideOffset={16}>
            <ActionList>
              {menuView === 'main' ? (
                <MainMenuItems
                  onViewfinder={handleViewfinder}
                  onShowSceneInfo={handleShowSceneInfo}
                  onResetParams={handleResetParams}
                  onFeatureFlags={switchToFlags}
                />
              ) : (
                <FlagMenuItems onBack={switchToMain} onToggle={handleToggleFlag} />
              )}
            </ActionList>
          </ActionMenu.Overlay>
        </ActionMenu>
      </div>
    </>
  )
}

/**
 * Main menu items for the DevTools dropdown.
 */
function MainMenuItems({ onViewfinder, onShowSceneInfo, onResetParams, onFeatureFlags }) {
  const flagKeys = getFlagKeys()

  return (
    <>
      <ActionList.Item onSelect={onViewfinder}>
        <ActionList.LeadingVisual>
          <ScreenFullIcon size={16} />
        </ActionList.LeadingVisual>
        See viewfinder
      </ActionList.Item>
      <ActionList.Item onSelect={onShowSceneInfo}>
        <ActionList.LeadingVisual>
          <InfoIcon size={16} />
        </ActionList.LeadingVisual>
        Show scene info
      </ActionList.Item>
      <ActionList.Item onSelect={onResetParams}>
        <ActionList.LeadingVisual>
          <SyncIcon size={16} />
        </ActionList.LeadingVisual>
        Reset all params
      </ActionList.Item>
      {flagKeys.length > 0 && (
        <>
          <ActionList.Divider />
          <ActionList.Item onSelect={onFeatureFlags}>
            <ActionList.LeadingVisual>
              <ZapIcon size={16} />
            </ActionList.LeadingVisual>
            Feature Flags
          </ActionList.Item>
        </>
      )}
      <div className={styles.shortcutHint}>
        Press <code>⌘ + .</code> to hide
      </div>
    </>
  )
}

/**
 * Feature flag toggle list — replaces the main menu when active.
 */
function FlagMenuItems({ onBack, onToggle }) {
  const flagKeys = getFlagKeys()
  useSyncExternalStore(subscribeToHash, getHashSnapshot)
  const flags = getAllFlags()

  return (
    <>
      <ActionList.Item onSelect={onBack}>
        <ActionList.LeadingVisual>
          <ArrowLeftIcon size={16} />
        </ActionList.LeadingVisual>
        Back
      </ActionList.Item>
      <ActionList.Divider />
      {flagKeys.map((key) => (
        <ActionList.Item key={key} onSelect={() => onToggle(key)}>
          <ActionList.LeadingVisual>
            {flags[key]?.current ? <CheckIcon size={16} /> : <span style={{ width: 16 }} />}
          </ActionList.LeadingVisual>
          {key}
        </ActionList.Item>
      ))}
    </>
  )
}
