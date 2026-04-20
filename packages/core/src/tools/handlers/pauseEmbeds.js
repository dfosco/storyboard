/**
 * Performance Mode — command palette toggle, canvas routes only.
 *
 * Dispatches a custom event that CanvasPage listens to, which toggles
 * the performanceMode canvas setting (persisted to JSONL).
 */
export const id = 'pause-embeds'

export async function handler() {
  return {
    getChildren() {
      return [{
        id: 'core/toggle-performance-mode',
        label: 'Toggle performance mode',
        type: 'default',
        execute: () => {
          document.dispatchEvent(new CustomEvent('storyboard:canvas:toggle-performance-mode'))
        },
      }]
    },
  }
}
