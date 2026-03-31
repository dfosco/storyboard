/**
 * Tool module registry — maps tool IDs to lazy-loaded code modules.
 *
 * Each tool module exports: { id, component?, handler?, setup?, guard? }
 * All imports are dynamic to enable code splitting.
 */
export const toolModules = {
  create:           () => import('./create.js'),
  theme:            () => import('./theme.js'),
  comments:         () => import('./comments.js'),
  flows:            () => import('./flows.js'),
  docs:             () => import('./docs.js'),
  inspector:        () => import('./inspector.js'),
  devtools:         () => import('./devtools.js'),
  'feature-flags':  () => import('./featureFlags.js'),
}
