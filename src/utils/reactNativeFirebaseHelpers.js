/**
 * React Native Firebase compatibility helpers
 * This module provides utilities to make @react-native-firebase/app compatible
 * with the react-redux-firebase library (supports v6+ and v22+ modular API)
 */

/**
 * Detects if the passed firebase instance is from @react-native-firebase
 * @param {object} firebase - Firebase instance to check
 * @returns {boolean} True if this is a React Native Firebase instance
 */
export function isReactNativeFirebase(firebase) {
  // v22+ modular API: Check if it's a FirebaseApp instance with native modules
  if (
    firebase &&
    firebase.name !== undefined &&
    firebase.options !== undefined &&
    firebase.utils &&
    typeof firebase.utils === 'function'
  ) {
    return true
  }

  // v6-v21 API: Check if it has app() function that returns an app with native modules
  if (
    firebase &&
    typeof firebase.app === 'function'
  ) {
    try {
      const app = firebase.app()
      if (app && (app.native || (app.utils && typeof app.utils === 'function'))) {
        return true
      }
    } catch (e) {
      // Continue to other checks
    }
  }

  // Legacy check for older versions
  if (
    firebase &&
    firebase.SDK_VERSION &&
    typeof firebase.auth === 'function' &&
    typeof firebase.database === 'function'
  ) {
    try {
      const authModule = firebase.auth()
      if (authModule && authModule.constructor && authModule.constructor.name) {
        return true
      }
    } catch (e) {
      // If we can't call auth(), it's likely not properly initialized
      return false
    }
  }

  return false
}

/**
 * Creates a compat-style wrapper for @react-native-firebase
 * This ensures the library's existing code works without modification
 * Supports both v6-v21 API and v22+ modular API
 * @param {object} rnFirebase - React Native Firebase instance or app
 * @returns {object} Compat-style Firebase wrapper
 */
export function createReactNativeCompatWrapper(rnFirebase) {
  // If it's already wrapped or is a compat object, return as-is
  if (rnFirebase._reactNativeFirebaseCompatWrapped) {
    return rnFirebase
  }

  // Determine if this is v22+ modular API (FirebaseApp instance) or legacy API
  const isModularAPI = rnFirebase && rnFirebase.name !== undefined && rnFirebase.options !== undefined

  // Get the app instance
  const firebaseApp = isModularAPI
    ? rnFirebase
    : (typeof rnFirebase.app === 'function' ? rnFirebase.app() : rnFirebase)

  // Cache service instances to avoid recreating them on every call
  const serviceCache = {}

  // For v22+ modular API, we use the getAuth, getDatabase, etc. functions
  // and cache the instances to avoid deprecation warnings from default exports
  const wrapper = {
    _reactNativeFirebaseCompatWrapped: true,
    app: firebaseApp,

    // Auth service accessor
    auth() {
      if (isModularAPI) {
        // v22+ modular: Use getAuth() and cache the instance
        if (!serviceCache.auth) {
          try {
            // eslint-disable-next-line global-require
            const authModule = require('@react-native-firebase/auth')
            // Use getAuth if available, otherwise fall back to default
            serviceCache.auth = authModule.getAuth
              ? authModule.getAuth(firebaseApp)
              : authModule.default(firebaseApp)
          } catch (e) {
            throw new Error(
              '@react-native-firebase/auth module not found. ' +
              'Please install it: npm install @react-native-firebase/auth'
            )
          }
        }
        return serviceCache.auth
      }
      return rnFirebase.auth()
    },

    // Database service accessor
    database() {
      if (isModularAPI) {
        if (!serviceCache.database) {
          try {
            // eslint-disable-next-line global-require
            const databaseModule = require('@react-native-firebase/database')
            serviceCache.database = databaseModule.getDatabase
              ? databaseModule.getDatabase(firebaseApp)
              : databaseModule.default(firebaseApp)
          } catch (e) {
            throw new Error(
              '@react-native-firebase/database module not found. ' +
              'Please install it: npm install @react-native-firebase/database'
            )
          }
        }
        return serviceCache.database
      }
      return rnFirebase.database()
    },

    // Firestore service accessor
    firestore() {
      if (isModularAPI) {
        if (!serviceCache.firestore) {
          try {
            // eslint-disable-next-line global-require
            const firestoreModule = require('@react-native-firebase/firestore')
            serviceCache.firestore = firestoreModule.getFirestore
              ? firestoreModule.getFirestore(firebaseApp)
              : firestoreModule.default(firebaseApp)
          } catch (e) {
            throw new Error(
              '@react-native-firebase/firestore module not found. ' +
              'Please install it: npm install @react-native-firebase/firestore'
            )
          }
        }
        return serviceCache.firestore
      }
      return rnFirebase.firestore()
    },

    // Storage service accessor
    storage() {
      if (isModularAPI) {
        if (!serviceCache.storage) {
          try {
            // eslint-disable-next-line global-require
            const storageModule = require('@react-native-firebase/storage')
            serviceCache.storage = storageModule.getStorage
              ? storageModule.getStorage(firebaseApp)
              : storageModule.default(firebaseApp)
          } catch (e) {
            throw new Error(
              '@react-native-firebase/storage module not found. ' +
              'Please install it: npm install @react-native-firebase/storage'
            )
          }
        }
        return serviceCache.storage
      }
      return rnFirebase.storage()
    }
  }

  // Add database ServerValue for timestamps (lazy initialization)
  if (!isModularAPI) {
    // For legacy API, we can set it directly
    try {
      wrapper.database.ServerValue = {
        TIMESTAMP: rnFirebase.database.ServerValue.TIMESTAMP
      }
    } catch (e) {
      // Skip if not available
    }
  } else {
    // For modular API v22+, ServerValue is available on the database instance itself
    Object.defineProperty(wrapper.database, 'ServerValue', {
      get() {
        try {
          // Get the cached database instance
          const dbInstance = wrapper.database()
          // In v22, ServerValue is on the database instance
          return dbInstance.ServerValue || { TIMESTAMP: null }
        } catch (e) {
          return { TIMESTAMP: null }
        }
      },
      configurable: true
    })
  }

  // Add firestore FieldValue for timestamps (lazy initialization)
  if (!isModularAPI) {
    // For legacy API, we can set it directly
    try {
      wrapper.firestore.FieldValue = {
        serverTimestamp: () => rnFirebase.firestore.FieldValue.serverTimestamp()
      }
    } catch (e) {
      // Skip if not available
    }
  } else {
    // For modular API v22+, FieldValue is available on the firestore instance itself
    Object.defineProperty(wrapper.firestore, 'FieldValue', {
      get() {
        try {
          // Get the cached firestore instance
          const fsInstance = wrapper.firestore()
          // In v22, FieldValue is on the firestore instance
          return fsInstance.FieldValue || { serverTimestamp: () => null }
        } catch (e) {
          return { serverTimestamp: () => null }
        }
      },
      configurable: true
    })
  }

  // Add auth providers (lazy initialization)
  if (!isModularAPI) {
    // For legacy API, set providers directly if available
    if (rnFirebase.auth.GoogleAuthProvider) {
      wrapper.auth.GoogleAuthProvider = rnFirebase.auth.GoogleAuthProvider
    }
    if (rnFirebase.auth.FacebookAuthProvider) {
      wrapper.auth.FacebookAuthProvider = rnFirebase.auth.FacebookAuthProvider
    }
    if (rnFirebase.auth.TwitterAuthProvider) {
      wrapper.auth.TwitterAuthProvider = rnFirebase.auth.TwitterAuthProvider
    }
    if (rnFirebase.auth.GithubAuthProvider) {
      wrapper.auth.GithubAuthProvider = rnFirebase.auth.GithubAuthProvider
    }
    if (rnFirebase.auth.OAuthProvider) {
      wrapper.auth.OAuthProvider = rnFirebase.auth.OAuthProvider
    }
    if (rnFirebase.auth.PhoneAuthProvider) {
      wrapper.auth.PhoneAuthProvider = rnFirebase.auth.PhoneAuthProvider
    }
    if (rnFirebase.auth.EmailAuthProvider) {
      wrapper.auth.EmailAuthProvider = rnFirebase.auth.EmailAuthProvider
    }
  } else {
    // For modular API, use getters to lazy-load providers
    const providerNames = [
      'GoogleAuthProvider',
      'FacebookAuthProvider',
      'TwitterAuthProvider',
      'GithubAuthProvider',
      'OAuthProvider',
      'PhoneAuthProvider',
      'EmailAuthProvider'
    ]

    providerNames.forEach((providerName) => {
      Object.defineProperty(wrapper.auth, providerName, {
        get() {
          try {
            // eslint-disable-next-line global-require
            const authModule = require('@react-native-firebase/auth')
            return authModule[providerName]
          } catch (e) {
            return undefined
          }
        },
        configurable: true
      })
    })
  }

  // Copy over any additional properties from the original instance (for legacy API)
  if (!isModularAPI) {
    Object.keys(rnFirebase).forEach((key) => {
      if (!wrapper[key] && key !== 'app') {
        wrapper[key] = rnFirebase[key]
      }
    })
  }

  return wrapper
}

/**
 * Gets the appropriate firebase instance, wrapping RN Firebase if needed
 * @param {object} firebase - Firebase instance (could be web SDK or RN Firebase)
 * @returns {object} Firebase instance ready to use with react-redux-firebase
 */
export function getCompatibleFirebaseInstance(firebase) {
  if (isReactNativeFirebase(firebase)) {
    return createReactNativeCompatWrapper(firebase)
  }
  return firebase
}
