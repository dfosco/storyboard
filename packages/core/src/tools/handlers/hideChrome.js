/**
 * Hide Chrome tool — toolbar button that toggles toolbar/branch bar visibility.
 */
export const id = 'hide-chrome'

export async function component() {
  const mod = await import('../../HideChromeTrigger.svelte')
  return mod.default
}
