/**
 * Shared set of file paths currently being written by the canvas server.
 * The data plugin checks this to skip reload for in-flight writes.
 */
export const canvasWritesInFlight = new Set()
