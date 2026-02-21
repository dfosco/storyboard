import { Suspense } from 'react'
import { Outlet } from 'react-router-dom'
import { StoryboardProvider, useFeatureFlag } from '@dfosco/storyboard-react'
import { registerMode, syncModeClasses } from '@dfosco/storyboard-core'
import '@dfosco/storyboard-core/modes.css'
import appStyles from './_app.module.css'

// Register default modes
registerMode('prototype', { label: 'Prototype' })
registerMode('present', { label: 'Present' })
registerMode('canvas', { label: 'Canvas' })
registerMode('inspect', { label: 'Inspect' })

// Apply classes for whichever mode is active on page load
syncModeClasses()

function PageLoading() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: 'var(--bgColor-default, #0d1117)',
    }}>
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" style={{ animation: 'spin 0.8s linear infinite' }}>
        <circle cx="12" cy="12" r="10" stroke="var(--fgColor-muted, #484f58)" strokeWidth="2.5" opacity="0.25" />
        <path d="M12 2a10 10 0 0 1 10 10" stroke="var(--fgColor-default, #e6edf3)" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

export default function App() {
  return (
    <StoryboardProvider>
      <FeatureFlagBanner />
      <Suspense fallback={<PageLoading />}>
        <Outlet />
      </Suspense>
      <ModeSwitch />
      <ToolbarShell />
    </StoryboardProvider>
  )
}

function FeatureFlagBanner() {
  const showBanner = useFeatureFlag('show-banner')
  if (!showBanner) return null
  return (
    <div className={appStyles.banner}>
      🚩 Feature flag <strong>show-banner</strong> is enabled — toggle it off in DevTools.
    </div>
  )
}
