/**
 * Palette Theme tool — theme submenu for the command palette.
 *
 * Returns theme options as children, plus a "Theme settings" entry
 * that navigates to a nested submenu with sync target checkboxes.
 */
export const id = 'palette-theme'

const THEME_SETTINGS_PAGE_ID = 'tool:palette-theme:settings'

export async function handler() {
  const { themeState, setTheme, THEMES, getThemeSyncTargets, setThemeSyncTarget } = await import('../../stores/themeStore.js')

  const isCanvas = typeof window !== 'undefined' && window.location.pathname.includes('/canvas/')

  return {
    getChildren() {
      const current = themeState.theme
      const sync = getThemeSyncTargets()
      return [
        // Theme options
        ...THEMES.map(t => ({
          id: `theme:${t.value}`,
          label: t.name,
          type: 'toggle',
          active: current === t.value,
          execute: () => setTheme(t.value),
        })),
        // "Theme settings" navigates to sync target checkboxes
        {
          id: 'theme:settings',
          label: 'Theme settings',
          navigateTo: THEME_SETTINGS_PAGE_ID,
        },
      ]
    },
    subPages: [
      {
        id: THEME_SETTINGS_PAGE_ID,
        label: 'Theme settings',
        title: 'Theme settings',
        options: buildSyncOptions(),
      },
    ],
  }

  function buildSyncOptions() {
    const sync = getThemeSyncTargets()
    return [
      {
        label: isCanvas ? 'Canvas' : 'Prototype',
        type: 'toggle',
        active: isCanvas ? sync.canvas : sync.prototype,
        execute: () => setThemeSyncTarget(isCanvas ? 'canvas' : 'prototype', isCanvas ? !sync.canvas : !sync.prototype),
      },
      {
        label: 'Tools',
        type: 'toggle',
        active: sync.toolbar,
        execute: () => setThemeSyncTarget('toolbar', !sync.toolbar),
      },
      {
        label: 'Code',
        type: 'toggle',
        active: sync.codeBoxes,
        execute: () => setThemeSyncTarget('codeBoxes', !sync.codeBoxes),
      },
    ]
  }
}
