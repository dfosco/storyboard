/**
 * Theme tool module — theme switcher menu.
 */
export const id = 'theme'

export async function component() {
  const mod = await import('../ThemeMenuButton.svelte')
  return mod.default
}
