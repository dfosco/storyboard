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
 * 2. If flow data has a `flowMeta.route` or `sceneMeta.route` or `route` key, use that
 * 3. Fall back to root "/"
 *
 * @param {string} flowName
 * @param {string[]} knownRoutes - Array of route names (e.g. ["Dashboard", "Repositories"])
 * @returns {string} Full path with ?scene= param
 */
export function resolveFlowRoute(flowName, knownRoutes = []) {
  // Case-insensitive match against known routes
  for (const route of knownRoutes) {
    if (route.toLowerCase() === flowName.toLowerCase()) {
      // Flow name matches the route — no ?scene= needed,
      // StoryboardProvider auto-matches by page name
      return `/${route}`
    }
  }

  // Check for explicit route in flowMeta/sceneMeta or top-level route key
  try {
    const data = loadFlow(flowName)
    const route = data?.flowMeta?.route || data?.sceneMeta?.route || data?.route
    if (route) {
      const normalized = route.startsWith('/') ? route : `/${route}`
      return `${normalized}?scene=${encodeURIComponent(flowName)}`
    }
  } catch {
    // ignore load errors
  }

  return `/?scene=${encodeURIComponent(flowName)}`
}

/** @deprecated Use resolveFlowRoute() */
export const resolveSceneRoute = resolveFlowRoute

/**
 * Get flowMeta for a flow (route, author, etc).
 *
 * @param {string} flowName
 * @returns {{ route?: string, author?: string | string[] } | null}
 */
export function getFlowMeta(flowName) {
  try {
    const data = loadFlow(flowName)
    return data?.flowMeta || data?.sceneMeta || null
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
    const meta = getPrototypeMetadata(name)
    protoMap[name] = {
      name: meta?.name || name,
      dirName: name,
      description: meta?.description || null,
      author: meta?.author || null,
      icon: meta?.icon || null,
      team: meta?.team || null,
      tags: meta?.tags || null,
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
