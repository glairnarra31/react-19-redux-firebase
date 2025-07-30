import { get, size, pick } from 'lodash'
import { unset } from 'lodash/fp'

/**
 * Immutably set a value at a deep path in an object (React 19 compatible)
 * @param {string} path - Dot notation path (e.g., 'users.123.name')
 * @param {any} value - Value to set
 * @param {object} state - Current state object
 * @returns {object} New state object with value set
 * @private
 */
export function setDeepPath(path, value, state) {
  if (!path) return { ...state, ...value }

  const keys = path.split('.')
  const result = { ...state }
  let current = result

  // Navigate to the parent of the target property
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i]
    current[key] = current[key] ? { ...current[key] } : {}
    current = current[key]
  }

  // Set the final value
  current[keys[keys.length - 1]] = value
  return result
}

/**
 * Immutably merge an object at a deep path (React 19 compatible)
 * @param {string} path - Dot notation path
 * @param {object} value - Object to merge
 * @param {object} state - Current state object
 * @returns {object} New state object with merged value
 * @private
 */
export function mergeDeepPath(path, value, state) {
  const existingValue = get(state, path, {})
  const mergedValue = { ...existingValue, ...value }
  return setDeepPath(path, mergedValue, state)
}

/**
 * Create a path array from path string
 * @param {string} path - Path seperated with slashes
 * @returns {Array} Path as Array
 * @private
 */
export function pathToArr(path) {
  return path ? path.split(/\//).filter((p) => !!p) : []
}

/**
 * Trim leading slash from path for use with state
 * @param {string} path - Path seperated with slashes
 * @returns {string} Path seperated with slashes
 * @private
 */
export function getSlashStrPath(path) {
  return pathToArr(path).join('/')
}

/**
 * Convert path with slashes to dot seperated path (for use with lodash get/set)
 * @param {string} path - Path seperated with slashes
 * @returns {string} Path seperated with dots
 * @private
 */
export function getDotStrPath(path) {
  return pathToArr(path).join('.')
}

/**
 * Combine reducers utility (React 19 compatible version).
 * Turns an object whose values are different reducer functions, into a single
 * reducer function. This version includes state change detection to prevent
 * unnecessary re-renders in React 19's concurrent mode.
 * @param {object} reducers An object whose values correspond to different
 * reducer functions that need to be combined into one.
 * @returns {Function} A reducer function that invokes every reducer inside the
 * passed object, and builds a state object with the same shape.
 * @private
 */
export function combineReducers(reducers) {
  // Initialize state shape by calling each reducer once
  const defaultState = {}
  for (const key in reducers) {
    defaultState[key] = reducers[key](undefined, { type: '@@INIT' })
  }

  return (state = defaultState, action) => {
    let hasChanged = false
    const nextState = {}

    for (const key in reducers) {
      const reducer = reducers[key]
      const previousStateForKey = state[key]
      const nextStateForKey = reducer(previousStateForKey, action)

      nextState[key] = nextStateForKey
      hasChanged = hasChanged || nextStateForKey !== previousStateForKey
    }

    return hasChanged ? nextState : state
  }
}

/**
 * Preserve values from redux state change
 * @param {object} state - Redux state
 * @param {Function|boolean|Array} preserveSetting - Setting for which values to preserve
 * from redux state
 * @param {object} nextState - Next redux state
 * @returns {object} State with values preserved
 */
export function preserveValuesFromState(state, preserveSetting, nextState) {
  // Return result of function if preserve is a function
  if (typeof preserveSetting === 'function') {
    return preserveSetting(state, nextState)
  }

  // Return original state if preserve is true
  if (preserveSetting === true) {
    return nextState ? { ...state, ...nextState } : state
  }

  if (Array.isArray(preserveSetting)) {
    return pick(state, preserveSetting) // pick returns a new object
  }

  throw new Error(
    'Invalid preserve parameter. It must be an Object or an Array'
  )
}

/**
 * Recursively unset a property starting at the deep path, and unsetting the parent
 * property if there are no other enumerable properties at that level.
 * @param {string} path - Deep dot path of the property to unset
 * @param {object} obj - Object from which path should be recursivley unset
 * @param {boolean} [isRecursiveCall=false] - Used internally to ensure that
 * the object size check is only performed after one iteration.
 * @returns {object} The object with the property deeply unset
 * @private
 */
export function recursiveUnset(path, obj, isRecursiveCall = false) {
  if (!path) {
    return obj
  }

  if (size(get(obj, path)) > 0 && isRecursiveCall) {
    return obj
  }
  // The object does not have any other properties at this level.  Remove the
  // property.
  const objectWithRemovedKey = unset(path, obj)
  const newPath = path.match(/\./) ? path.replace(/\.[^.]*$/, '') : ''
  return recursiveUnset(newPath, objectWithRemovedKey, true)
}
