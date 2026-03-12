/**
 * Deep merges two objects. Source values take priority over target.
 * Arrays are replaced, not concatenated.
 */
function deepMerge(target, source) {
  const result = { ...target }
  
  for (const key of Object.keys(source)) {
    const sourceValue = source[key]
    const targetValue = target[key]
    
    if (
      sourceValue !== null &&
      typeof sourceValue === 'object' &&
      !Array.isArray(sourceValue) &&
      targetValue !== null &&
      typeof targetValue === 'object' &&
      !Array.isArray(targetValue)
    ) {
      result[key] = deepMerge(targetValue, sourceValue)
    } else {
      result[key] = sourceValue
    }
  }
  
  return result
}

/**
 * Module-level data index, seeded by init().
 * Shape: { flows: {}, objects: {}, records: {} }
 */
let dataIndex = { flows: {}, objects: {}, records: {}, prototypes: {} }

/**
 * Seed the data index. Call once at app startup before any load functions.
 * The Vite data plugin calls this automatically via the generated virtual module.
 *
 * @param {{ flows?: object, scenes?: object, objects: object, records: object, prototypes?: object }} index
 */
export function init(index) {
  if (!index || typeof index !== 'object') {
    throw new Error('[storyboard-core] init() requires { flows, objects, records }')
  }
  dataIndex = {
    flows: index.flows || index.scenes || {},
    objects: index.objects || {},
    records: index.records || {},
    prototypes: index.prototypes || {},
  }
}

/**
 * Loads a data file by name and type from the data index.
 * Data is pre-parsed at build time — returns a deep clone to prevent mutation.
 * @param {string} name - Data file name (e.g., "jane-doe", "default")
 * @param {string} [type] - Data type: "scenes", "objects", or "records". If omitted, searches all types.
 * @returns {object} Parsed file contents
 */
function loadDataFile(name, type) {
  if (type && dataIndex[type]?.[name] != null) {
    return dataIndex[type][name]
  }

  // Search all types if no specific type given
  if (!type) {
    for (const t of ['flows', 'objects', 'records']) {
      if (dataIndex[t]?.[name] != null) {
        return dataIndex[t][name]
      }
    }
  }

  // Case-insensitive fallback for flows
  if (type === 'flows' || !type) {
    const lower = name.toLowerCase()
    for (const key of Object.keys(dataIndex.flows)) {
      if (key.toLowerCase() === lower) {
        return dataIndex.flows[key]
      }
    }
  }

  const available = Object.keys(dataIndex[type] || {})
  const scopedHints = available.filter(k => k.includes('/')).slice(0, 5)
  const hint = scopedHints.length > 0
    ? `\n  Scoped names in index: ${scopedHints.join(', ')}`
    : ''
  throw new Error(`Data file not found: ${name}${type ? ` (type: ${type})` : ''}${hint}`)
}

/**
 * Recursively resolves $ref objects within data.
 * A $ref is a name resolved from the data index (objects first, then any type).
 *
 * @param {*} node - Current data node
 * @param {Set} seen - Tracks visited names to prevent circular refs
 * @returns {*} Resolved data
 */
function resolveRefs(node, seen = new Set()) {
  if (node === null || typeof node !== 'object') return node
  if (Array.isArray(node)) {
    return node.map((item) => resolveRefs(item, seen))
  }

  // Handle $ref replacement
  if (node.$ref && typeof node.$ref === 'string') {
    const refName = node.$ref
    if (seen.has(refName)) {
      throw new Error(`Circular $ref detected: ${refName}`)
    }
    seen.add(refName)
    const refData = loadDataFile(refName, 'objects')
    return resolveRefs(refData, seen)
  }

  // Recurse into object values
  const result = {}
  for (const [key, value] of Object.entries(node)) {
    result[key] = resolveRefs(value, seen)
  }
  return result
}

/**
 * Returns the names of all registered flows.
 * @returns {string[]}
 */
export function listFlows() {
  return Object.keys(dataIndex.flows)
}

/** @deprecated Use listFlows() */
export const listScenes = listFlows

/**
 * Checks whether a flow file exists for the given name.
 * @param {string} flowName - e.g., "Overview"
 * @returns {boolean}
 */
export function flowExists(flowName) {
  if (dataIndex.flows[flowName] != null) return true
  const lower = flowName.toLowerCase()
  for (const key of Object.keys(dataIndex.flows)) {
    if (key.toLowerCase() === lower) return true
  }
  return false
}

/** @deprecated Use flowExists() */
export const sceneExists = flowExists

/**
 * Loads a flow file and resolves $global and $ref references.
 *
 * - $global: array of data names merged into root (flow wins on conflicts)
 * - $ref: inline object replacement at any nesting level
 *
 * @param {string} flowName - Name of the flow (e.g., "default")
 * @returns {object} Resolved flow data
 */
export function loadFlow(flowName = 'default') {
  let flowData

  try {
    flowData = structuredClone(loadDataFile(flowName, 'flows'))
  } catch {
    const available = listFlows()
    const related = available.filter(k =>
      k.endsWith('/' + flowName) || k.startsWith(flowName + '/')
    )
    const hint = related.length > 0
      ? ` Did you mean: ${related.join(', ')}?`
      : ''
    throw new Error(`Failed to load flow: ${flowName}.${hint}`)
  }

  // Handle $global: root-level merge from referenced data files
  if (Array.isArray(flowData.$global)) {
    const globalNames = flowData.$global
    delete flowData.$global

    let mergedGlobals = {}
    for (const name of globalNames) {
      try {
        let globalData = loadDataFile(name)
        globalData = resolveRefs(globalData)
        mergedGlobals = deepMerge(mergedGlobals, globalData)
      } catch (err) {
        console.warn(`Failed to load $global: ${name}`, err)
      }
    }

    flowData = deepMerge(mergedGlobals, flowData)
  }

  flowData = resolveRefs(flowData)

  // Single clone at the boundary — resolveRefs builds new objects internally,
  // so the index data is safe. Clone here to prevent consumer mutation.
  return structuredClone(flowData)
}

/** @deprecated Use loadFlow() */
export const loadScene = loadFlow

/**
 * Loads a record collection by name.
 * @param {string} recordName - Name of the record file (e.g., "posts")
 * @returns {Array} Parsed record collection
 */
export function loadRecord(recordName) {
  const data = dataIndex.records[recordName]
  if (data == null) {
    const available = Object.keys(dataIndex.records)
    const related = available.filter(k =>
      k.endsWith('/' + recordName) || k.startsWith(recordName + '/')
    )
    const hint = related.length > 0
      ? ` Did you mean: ${related.join(', ')}?`
      : ''
    throw new Error(`Record not found: ${recordName}.${hint}`)
  }
  if (!Array.isArray(data)) {
    throw new Error(`Record "${recordName}" must be an array, got ${typeof data}`)
  }
  return structuredClone(data)
}

/**
 * Finds a single record entry by id within a collection.
 * @param {string} recordName - Record collection name (e.g., "posts")
 * @param {string} id - The id to match
 * @returns {object|null} The matched entry, or null
 */
export function findRecord(recordName, id) {
  const records = loadRecord(recordName)
  return records.find((entry) => entry.id === id) ?? null
}

/**
 * Loads an object data file by name, resolves any nested $ref references,
 * and returns a deep clone.
 *
 * @param {string} objectName - Name of the object file (e.g., "jane-doe")
 * @returns {object|Array} Resolved object data
 */
export function loadObject(objectName) {
  const data = loadDataFile(objectName, 'objects')
  const resolved = resolveRefs(structuredClone(data))
  return resolved
}

/**
 * Resolve a flow name within a prototype scope.
 * Tries the scoped name first ({scope}/{name}), then falls back to the plain name.
 *
 * @param {string|null} scope - Prototype name (e.g. "Dashboard"), or null for global-only
 * @param {string} name - Flow name (e.g. "default" or "Dashboard/signup")
 * @returns {string} The resolved flow name that exists in the index
 */
export function resolveFlowName(scope, name) {
  if (scope) {
    const scoped = `${scope}/${name}`
    if (flowExists(scoped)) return scoped
  }
  if (flowExists(name)) return name
  // Return the scoped name for better error messages even if it doesn't exist
  return scope ? `${scope}/${name}` : name
}

/**
 * Resolve a record name within a prototype scope.
 * Tries the scoped name first ({scope}/{name}), then falls back to the plain name.
 *
 * @param {string|null} scope - Prototype name (e.g. "Dashboard"), or null for global-only
 * @param {string} name - Record name (e.g. "posts")
 * @returns {string} The resolved record name that exists in the index
 */
export function resolveRecordName(scope, name) {
  if (scope) {
    const scoped = `${scope}/${name}`
    if (dataIndex.records[scoped] != null) return scoped
  }
  if (dataIndex.records[name] != null) return name
  return scope ? `${scope}/${name}` : name
}

/**
 * Returns the names of all registered prototypes.
 * @returns {string[]}
 */
export function listPrototypes() {
  return Object.keys(dataIndex.prototypes)
}

/**
 * Returns prototype metadata by name.
 * @param {string} name - Prototype name (e.g. "Example")
 * @returns {object|null} Metadata from the .prototype.json file, or null
 */
export function getPrototypeMetadata(name) {
  return dataIndex.prototypes[name] ?? null
}

export { deepMerge }
