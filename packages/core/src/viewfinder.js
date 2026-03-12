import { loadFlow, listFlows, listPrototypes, getPrototypeMetadata } from './loader.js'

/**
 * Deterministic hash from a string — used for seeding generative placeholders.
 * @param {string} str
 * @returns {number}
 */
export function hash(str) {
  let h = 0
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h + str.charCodeAt(i)) | 0
  }
  return Math.abs(h)
}

/**
 * Resolve the target route path for a flow.
 *
 * 1. If flow name matches a known route (case-insensitive), use that route
 * 2. If flow data has a top-level `route`, or `meta.route` / `sceneMeta.route`, use that
 * 3. Fall back to root "/"
 *
 * @param {string} flowName
 * @param {string[]} knownRoutes - Array of route names (e.g. ["Dashboard", "Repositories"])
 * @returns {string} Full path with ?flow= param
 */
export function resolveFlowRoute(flowName, knownRoutes = []) {
  // Case-insensitive match against known routes
  for (const route of knownRoutes) {
    if (route.toLowerCase() === flowName.toLowerCase()) {
      // Flow name matches the route — no ?flow= needed,
      // StoryboardProvider auto-matches by page name
      return `/${route}`
    }
  }

  // Check for explicit route: top-level `route`, then meta.route, then legacy sceneMeta.route
  try {
    const data = loadFlow(flowName)
    const route = data?.route || data?.meta?.route || data?.flowMeta?.route || data?.sceneMeta?.route
    if (route) {
      const normalized = route.startsWith('/') ? route : `/${route}`
      return `${normalized}?flow=${encodeURIComponent(flowName)}`
    }
  } catch {
    // ignore load errors
  }

  return `/?flow=${encodeURIComponent(flowName)}`
}

/** @deprecated Use resolveFlowRoute() */
export const resolveSceneRoute = resolveFlowRoute

/**
 * Get meta for a flow (title, description, author, etc).
 *
 * @param {string} flowName
 * @returns {{ title?: string, description?: string, author?: string | string[] } | null}
 */
export function getFlowMeta(flowName) {
  try {
    const data = loadFlow(flowName)
    return data?.meta || data?.flowMeta || data?.sceneMeta || null
  } catch {
    return null
  }
}

/** @deprecated Use getFlowMeta() */
export const getSceneMeta = getFlowMeta

/**
 * Build a structured prototype index grouping flows by prototype.
 *
 * Returns an object with:
 * - prototypes: array of prototype entries with metadata and their flows
 * - globalFlows: flows not belonging to any prototype
 *
 * @param {string[]} [knownRoutes] - Array of known route names
 * @returns {{ prototypes: Array, globalFlows: Array }}
 */
export function buildPrototypeIndex(knownRoutes = []) {
  const flows = listFlows()
  const protoMap = {}
  const globalFlows = []

  // Seed from .prototype.json metadata (even prototypes with no flows appear)
  for (const name of listPrototypes()) {
    const raw = getPrototypeMetadata(name)
    const meta = raw?.meta || raw || {}
    protoMap[name] = {
      name: meta.title || name,
      dirName: name,
      description: meta.description || null,
      author: meta.author || null,
      gitAuthor: raw?.gitAuthor || null,
      icon: meta.icon || null,
      team: meta.team || null,
      tags: meta.tags || null,
      flows: [],
    }
  }

  for (const flowName of flows) {
    const slashIdx = flowName.indexOf('/')
    if (slashIdx > 0) {
      const protoName = flowName.substring(0, slashIdx)
      const shortName = flowName.substring(slashIdx + 1)

      if (!protoMap[protoName]) {
        protoMap[protoName] = {
          name: protoName,
          dirName: protoName,
          description: null,
          author: null,
          gitAuthor: null,
          icon: null,
          team: null,
          tags: null,
          flows: [],
        }
      }

      protoMap[protoName].flows.push({
        key: flowName,
        name: shortName,
        route: resolveFlowRoute(flowName, knownRoutes),
        meta: getFlowMeta(flowName),
      })
    } else {
      globalFlows.push({
        key: flowName,
        name: flowName,
        route: resolveFlowRoute(flowName, knownRoutes),
        meta: getFlowMeta(flowName),
      })
    }
  }

  return {
    prototypes: Object.values(protoMap),
    globalFlows,
  }
}
