/**
 * Pause/Resume embed refreshes — command palette only, canvas routes.
 *
 * Toggles `storyboard-embeds-paused` on <html>. Embed widgets read this
 * class and freeze their iframe src when paused (unless interactive).
 */
export const id = 'pause-embeds'

export async function handler() {
  return {
    getChildren() {
      const paused = document.documentElement.classList.contains('storyboard-embeds-paused')
      return [{
        id: 'core/toggle-pause-embeds',
        label: paused ? 'Resume embed refreshes' : 'Pause embed refreshes',
        type: 'default',
        execute: () => {
          const isPaused = document.documentElement.classList.contains('storyboard-embeds-paused')
          document.documentElement.classList.toggle('storyboard-embeds-paused', !isPaused)
        },
      }]
    },
  }
}
