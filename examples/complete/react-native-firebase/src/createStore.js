import { compose, createStore } from 'redux'
import { reactReduxFirebase } from 'react-redux-firebase'
// v22+ modular imports (recommended)
import { getApp } from '@react-native-firebase/app'
import { getAuth } from '@react-native-firebase/auth'
import { getDatabase } from '@react-native-firebase/database'
import makeRootReducer from './reducers'

// for more config options, visit http://react-redux-firebase.com/docs/api/compose.html
const reduxFirebaseConfig = {
  userProfile: 'users', // save users profiles to 'users' collection
  enableRedirectHandling: false // Required for React Native
}

export default (initialState = { firebase: {} }) => {
  // Note: With @react-native-firebase/app v22+, Firebase is automatically initialized
  // from google-services.json (Android) or GoogleService-Info.plist (iOS)
  // Get the default app instance
  const app = getApp()

  const store = createStore(
    makeRootReducer(),
    initialState, // initial state
    compose(
      reactReduxFirebase(app, reduxFirebaseConfig) // pass Firebase app instance
    )
  )
  return store
}
