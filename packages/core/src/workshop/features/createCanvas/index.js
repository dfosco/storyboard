/**
 * Create Canvas feature — create new canvases from the Workshop panel.
 */

export { createCanvasHandler as serverSetup } from '../../../canvas/server.js'
import CreateCanvasForm from './CreateCanvasForm.svelte'

export const name = 'createCanvas'
export const label = 'Create canvas'
export const icon = '🎨'
export const overlayId = 'createCanvas'
export const overlay = CreateCanvasForm
