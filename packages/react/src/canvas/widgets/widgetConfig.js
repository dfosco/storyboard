/**
 * Widget Config Loader
 *
 * Reads widgets.config.json from @dfosco/storyboard-core and builds
 * schema objects compatible with the existing readProp/readAllProps/getDefaults API.
 *
 * The config is the single source of truth for widget definitions —
 * prop schemas, feature lists, labels, and icons all come from here.
 *
 * Supports `$variable` references in string values, resolved from
 * the top-level `variables` object in widgets.config.json.
 */
import widgetsConfig from '@dfosco/storyboard-core/widgets.config.json'

/** Variables defined in config — used to resolve `$key` references. */
const variables = widgetsConfig.variables || {}

/**
 * Resolve `$variable` references in a string value.
 * Returns the original value if it's not a string or doesn't start with `$`.
 */
function resolveVar(value) {
  if (typeof value !== 'string' || !value.startsWith('$')) return value
  const key = value.slice(1)
  return variables[key] ?? value
}

/**
 * Resolve all string values in a feature object, including nested items.
 */
function resolveFeature(feature) {
  const resolved = {}
  for (const [key, val] of Object.entries(feature)) {
    if (key === 'items' && Array.isArray(val)) {
      resolved[key] = val.map((item) => {
        const r = {}
        for (const [k, v] of Object.entries(item)) r[k] = resolveVar(v)
        return r
      })
    } else {
      resolved[key] = resolveVar(val)
    }
  }
  return resolved
}

/**
 * Convert a config prop definition to the schema shape used by widgetProps.js.
 * Config uses `"default"`, schema uses `"defaultValue"`.
 */
function configPropToSchema(propDef) {
  const schema = {
    type: propDef.type,
    label: propDef.label,
    category: propDef.category,
  }
  if (propDef.default !== undefined) schema.defaultValue = propDef.default
  if (propDef.options) schema.options = propDef.options
  if (propDef.min !== undefined) schema.min = propDef.min
  if (propDef.max !== undefined) schema.max = propDef.max
  return schema
}

/**
 * Build schema objects for all widget types from the config.
 * Returns the same shape as the old hardcoded schemas in widgetProps.js.
 */
function buildSchemas() {
  const result = {}
  for (const [type, def] of Object.entries(widgetsConfig.widgets)) {
    const schema = {}
    for (const [key, propDef] of Object.entries(def.props || {})) {
      schema[key] = configPropToSchema(propDef)
    }
    result[type] = schema
  }
  return result
}

/**
 * Build resolved widget type entries with variables expanded in features.
 */
function buildWidgetTypes() {
  const result = {}
  for (const [type, def] of Object.entries(widgetsConfig.widgets)) {
    result[type] = {
      ...def,
      features: (def.features || []).map(resolveFeature),
    }
  }
  return result
}

/** All widget schemas, keyed by type string. */
export const schemas = buildSchemas()

/** Full widget config entries (with resolved variables), keyed by type string. */
export const widgetTypes = buildWidgetTypes()

/**
 * Get the feature list for a widget type.
 * In production, only features with `prod: true` are returned.
 * In dev, all features are returned.
 * @param {string} type — widget type string
 * @returns {Array} features array from config (variables resolved), or empty array
 */
export function getFeatures(type) {
  const features = widgetTypes[type]?.features ?? []
  if (import.meta.env?.PROD) {
    return features.filter(f => f.prod)
  }
  return features
}

/**
 * Check if a widget type supports resize in the current environment.
 * Returns false if resize is disabled, or if in production and prod is not true.
 * @param {string} type — widget type string
 * @returns {boolean}
 */
export function isResizable(type) {
  const resize = widgetTypes[type]?.resize
  if (!resize?.enabled) return false
  if (import.meta.env?.PROD && !resize.prod) return false
  return true
}

/**
 * Get the display metadata (label, icon) for a widget type.
 * @param {string} type — widget type string
 * @returns {{ label: string, icon: string } | null}
 */
export function getWidgetMeta(type) {
  const def = widgetTypes[type]
  if (!def) return null
  return { label: def.label, icon: def.icon }
}

/**
 * Get all widget types as an array of { type, label, icon } for menus.
 * Excludes link-preview, image, and figma-embed which are created via paste only.
 */
export function getMenuWidgetTypes() {
  return Object.entries(widgetTypes)
    .filter(([type]) => type !== 'link-preview' && type !== 'image' && type !== 'figma-embed')
    .map(([type, def]) => ({ type, label: def.label, icon: def.icon }))
}
