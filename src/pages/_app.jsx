import { Suspense } from 'react'
import { Outlet } from 'react-router-dom'
import { StoryboardProvider, useFeatureFlag } from '@dfosco/storyboard-react'

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
    </StoryboardProvider>
  )
}

function FeatureFlagBanner() {
  const showBanner = useFeatureFlag('show-banner')
  if (!showBanner) return null
  return (
    <div style={{
      padding: '8px 16px',
      backgroundColor: '#1f6feb',
      color: '#ffffff',
      fontSize: '13px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
      textAlign: 'center',
      borderBottom: '1px solid #388bfd',
    }}>
      🚩 Feature flag <strong>show-banner</strong> is enabled — toggle it off in DevTools.
    </div>
  )
}
