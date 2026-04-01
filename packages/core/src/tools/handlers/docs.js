/**
 * Docs tool module — documentation sidepanel toggle.
 */
export const id = 'docs'

// No component needed — sidepanel tools use generic TriggerButton

export async function handler() {
  const { togglePanel } = await import('../../stores/sidePanelStore.js')
  return () => togglePanel('docs')
}
