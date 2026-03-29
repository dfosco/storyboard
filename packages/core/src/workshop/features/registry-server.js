/**
 * Workshop feature server registry.
 *
 * Server-safe registry that only imports server handlers (no Svelte/UI code).
 * Used by the Vite server plugin to wire API routes.
 *
 * To add a new feature:
 * 1. Create a server.js in features/<name>/
 * 2. Add its server handler here
 */

import { createPrototypesHandler } from './createPrototype/server.js'
import { createCanvasHandler } from '../../canvas/server.js'

/**
 * Server-side feature handlers, keyed by config name.
 */
export const serverFeatures = {
  createPrototype: { serverSetup: createPrototypesHandler },
  createCanvas: { serverSetup: createCanvasHandler },
}
