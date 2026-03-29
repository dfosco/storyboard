import WidgetWrapper from './WidgetWrapper.jsx'

/**
 * Renders a live JSX export from a .canvas.jsx companion file.
 * Content is read-only (re-renders on HMR), only position is mutable.
 */
export default function ComponentWidget({ exportName, component: Component }) {
  if (!Component) return null

  return (
    <WidgetWrapper label={exportName}>
      <Component />
    </WidgetWrapper>
  )
}
