/**
 * ThemeSync component stories.
 * ThemeSync is invisible — it bridges storyboard-core theme store with Primer.
 * This story confirms it renders without errors.
 */
import ThemeSync from './ThemeSync.jsx'

export function Default() {
  return (
    <div style={{ padding: '1.5rem' }}>
      <p>ThemeSync is an invisible component that syncs the storyboard theme with Primer.</p>
      <ThemeSync />
    </div>
  )
}
