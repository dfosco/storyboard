/**
 * Main Toolbar surface — the primary floating bar at bottom-right.
 *
 * Supports all standard render types. Tools appear in reverse JSON order
 * (first in config = leftmost in toolbar). The command menu button is
 * always the rightmost item and is not a tool.
 */
export const id = 'main-toolbar'
export const label = 'Main Toolbar'
export const position = 'bottom-right'
export const renderTypes = ['button', 'menu', 'sidepanel', 'separator']
