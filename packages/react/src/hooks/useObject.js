import { useMemo, useSyncExternalStore } from 'react'
import { loadObject } from '@dfosco/storyboard-core'
import { getByPath, deepClone, setByPath } from '@dfosco/storyboard-core'
import { getParam, getAllParams } from '@dfosco/storyboard-core'
import { isHideMode, getShadow, getAllShadows } from '@dfosco/storyboard-core'
import { subscribeToHash, getHashSnapshot } from '@dfosco/storyboard-core'
import { subscribeToStorage, getStorageSnapshot } from '@dfosco/storyboard-core'

/**
 * Load an object data file directly by name, without going through a scene.
 * Supports dot-notation path access and URL hash overrides.
 *
 * Hash override convention: object.{objectName}.{field}=value
 *
 * @param {string} objectName - Name of the object file (e.g., "jane-doe")
 * @param {string} [path] - Optional dot-notation path (e.g., "profile.name")
 * @returns {*} The resolved value, or undefined if loading fails
 *
 * @example
 * const user = useObject('jane-doe')
 * const name = useObject('jane-doe', 'profile.name')
 *
 * // Override via URL hash: #object.jane-doe.name=Alice
 */
export function useObject(objectName, path) {
  const hashString = useSyncExternalStore(subscribeToHash, getHashSnapshot)
  const storageString = useSyncExternalStore(subscribeToStorage, getStorageSnapshot)

  return useMemo(() => {
    let data
    try {
      data = loadObject(objectName)
    } catch (err) {
      console.error(`[useObject] ${err.message}`)
      return undefined
    }

    const hidden = isHideMode()
    const readParam = hidden ? getShadow : getParam
    const readAllParams = hidden ? getAllShadows : getAllParams

    // Apply overrides scoped to this object
    const prefix = `object.${objectName}.`
    const allParams = readAllParams()
    const overrideKeys = Object.keys(allParams).filter(k => k.startsWith(prefix))

    if (overrideKeys.length > 0) {
      data = deepClone(data)
      for (const key of overrideKeys) {
        const fieldPath = key.slice(prefix.length)
        setByPath(data, fieldPath, allParams[key])
      }
    }

    if (!path) return data

    // Exact match for this sub-path override
    const exactKey = `${prefix}${path}`
    const exact = readParam(exactKey)
    if (exact !== null) return exact

    // Child overrides under the sub-path
    const subPrefix = exactKey + '.'
    const childKeys = overrideKeys.filter(k => k.startsWith(subPrefix))
    const baseValue = getByPath(data, path)

    if (childKeys.length > 0 && baseValue !== undefined) {
      const merged = deepClone(baseValue)
      for (const key of childKeys) {
        const relativePath = key.slice(subPrefix.length)
        setByPath(merged, relativePath, allParams[key])
      }
      return merged
    }

    if (baseValue === undefined) {
      console.warn(`[useObject] Path "${path}" not found in object "${objectName}".`)
      return undefined
    }

    return baseValue
  }, [objectName, path, hashString, storageString]) // eslint-disable-line react-hooks/exhaustive-deps
}
