# Using react-redux-firebase with @react-native-firebase

This library now has built-in support for **@react-native-firebase** (v6+ and v22+), allowing you to use native Firebase modules in React Native with full react-redux-firebase functionality.

## Overview

The library automatically detects when you're using `@react-native-firebase` and creates a compatibility layer that makes it work seamlessly with the existing react-redux-firebase API. Both the legacy API (v6-v21) and the modern modular API (v22+) are supported.

## Installation

### 1. Install Dependencies

```bash
# Core dependencies
npm install react-redux-firebase redux react-redux

# React Native Firebase - install only the modules you need
npm install @react-native-firebase/app
npm install @react-native-firebase/auth
npm install @react-native-firebase/database
npm install @react-native-firebase/firestore  # if using Firestore
npm install @react-native-firebase/storage   # if using Storage

# For redux-firestore (optional, if using Firestore)
npm install redux-firestore
```

### 2. Configure Native Modules

Follow the [@react-native-firebase installation guide](https://rnfirebase.io/) to:
- Add `google-services.json` (Android) or `GoogleService-Info.plist` (iOS)
- Configure your native projects
- Run `pod install` for iOS

## Usage

### Basic Setup (v22+ Modular API - Recommended)

```jsx
import React from 'react';
import { Provider } from 'react-redux';
import { createStore, combineReducers } from 'redux';
import { ReactReduxFirebaseProvider, firebaseReducer } from 'react-redux-firebase';
import { getApp } from '@react-native-firebase/app';
import { getAuth } from '@react-native-firebase/auth';
import { getDatabase } from '@react-native-firebase/database';

// Get the default Firebase app instance
// Firebase is auto-initialized from native config files
const app = getApp();

// react-redux-firebase config
const rrfConfig = {
  userProfile: 'users',
  enableRedirectHandling: false, // Required for React Native
};

// Create Redux store
const rootReducer = combineReducers({
  firebase: firebaseReducer,
});

const store = createStore(rootReducer);

// Setup react-redux-firebase
const rrfProps = {
  firebase: app, // Pass the Firebase app instance
  config: rrfConfig,
  dispatch: store.dispatch,
};

function App() {
  return (
    <Provider store={store}>
      <ReactReduxFirebaseProvider {...rrfProps}>
        <YourMainComponent />
      </ReactReduxFirebaseProvider>
    </Provider>
  );
}

export default App;
```

### Legacy Setup (v6-v21 API)

If you're using an older version of @react-native-firebase:

```jsx
import React from 'react';
import { Provider } from 'react-redux';
import { createStore, combineReducers } from 'redux';
import { ReactReduxFirebaseProvider, firebaseReducer } from 'react-redux-firebase';
import firebase from '@react-native-firebase/app';

// Import the services you need
import '@react-native-firebase/auth';
import '@react-native-firebase/database';

const rrfConfig = {
  userProfile: 'users',
  enableRedirectHandling: false,
};

const rootReducer = combineReducers({
  firebase: firebaseReducer,
});

const store = createStore(rootReducer);

const rrfProps = {
  firebase, // Pass the default export
  config: rrfConfig,
  dispatch: store.dispatch,
};

function App() {
  return (
    <Provider store={store}>
      <ReactReduxFirebaseProvider {...rrfProps}>
        <YourMainComponent />
      </ReactReduxFirebaseProvider>
    </Provider>
  );
}

export default App;
```

### With Firestore (v22+ Modular API)

```jsx
import React from 'react';
import { Provider } from 'react-redux';
import { createStore, combineReducers } from 'redux';
import { ReactReduxFirebaseProvider, firebaseReducer } from 'react-redux-firebase';
import { createFirestoreInstance, firestoreReducer } from 'redux-firestore';
import { getApp } from '@react-native-firebase/app';
import { getAuth } from '@react-native-firebase/auth';
import { getDatabase } from '@react-native-firebase/database';
import { getFirestore } from '@react-native-firebase/firestore';

const app = getApp();

const rrfConfig = {
  userProfile: 'users',
  useFirestoreForProfile: true,
  enableRedirectHandling: false,
};

const rootReducer = combineReducers({
  firebase: firebaseReducer,
  firestore: firestoreReducer,
});

const store = createStore(rootReducer);

const rrfProps = {
  firebase: app,
  config: rrfConfig,
  dispatch: store.dispatch,
  createFirestoreInstance,
};

function App() {
  return (
    <Provider store={store}>
      <ReactReduxFirebaseProvider {...rrfProps}>
        <YourMainComponent />
      </ReactReduxFirebaseProvider>
    </Provider>
  );
}

export default App;
```

**Note:** The compatibility layer will automatically use `getAuth(app)`, `getDatabase(app)`, etc. when needed, so you don't need to pass them explicitly.

## Using Firebase in Components

The API remains the same as with the web SDK:

```jsx
import React from 'react';
import { View, Text, Button } from 'react-native';
import { useFirebase, useFirebaseConnect } from 'react-redux-firebase';
import { useSelector } from 'react-redux';

function TodoList() {
  const firebase = useFirebase();

  // Listen to todos in Realtime Database
  useFirebaseConnect([
    { path: 'todos' }
  ]);

  // Get todos from Redux state
  const todos = useSelector(state => state.firebase.data.todos);

  const addTodo = () => {
    firebase.push('todos', {
      text: 'New todo',
      completed: false,
    });
  };

  const login = async () => {
    try {
      await firebase.login({
        email: 'user@example.com',
        password: 'password123',
      });
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  return (
    <View>
      <Button title="Add Todo" onPress={addTodo} />
      <Button title="Login" onPress={login} />
      {/* Render todos */}
    </View>
  );
}

export default TodoList;
```

## Configuration Options

### Required for React Native

```javascript
const rrfConfig = {
  // REQUIRED: Disable redirect handling (not supported in React Native)
  enableRedirectHandling: false,

  // Your other config options
  userProfile: 'users',
  useFirestoreForProfile: true,
};
```

### All Available Options

See the main [react-redux-firebase configuration docs](http://react-redux-firebase.com/docs/api/ReactReduxFirebaseProvider.html) for all configuration options. Most work the same with React Native Firebase.

## Differences from Web SDK

### 1. No Manual Initialization

With `@react-native-firebase/app`, you **don't** need to call `initializeApp()` in JavaScript. Firebase is automatically initialized from your native configuration files (`google-services.json` / `GoogleService-Info.plist`).

### 2. Import Services as Side Effects

```javascript
// Import services to register them
import '@react-native-firebase/auth';
import '@react-native-firebase/database';
import '@react-native-firebase/firestore';
```

### 3. No Redirect Authentication

OAuth redirect flows don't work in React Native. Use popup-style authentication or other React Native-specific auth methods:

```javascript
// This won't work in React Native
firebase.login({ provider: 'google', type: 'redirect' });

// Use popup or native methods instead
firebase.login({ provider: 'google', type: 'popup' });
```

### 4. Native Performance

All Firebase operations use native modules, providing better performance and offline support compared to the web SDK.

## Authentication

### Email/Password

```javascript
// Sign up
await firebase.createUser(
  { email: 'user@example.com', password: 'password123' },
  { username: 'johndoe', displayName: 'John Doe' }
);

// Login
await firebase.login({
  email: 'user@example.com',
  password: 'password123',
});

// Logout
await firebase.logout();
```

### Social Authentication

For Google, Facebook, etc., use the native authentication methods provided by `@react-native-firebase/auth`:

```javascript
import auth from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

// Configure Google Sign-In
GoogleSignin.configure({
  webClientId: 'YOUR_WEB_CLIENT_ID',
});

// Sign in with Google
async function signInWithGoogle() {
  const { idToken } = await GoogleSignin.signIn();
  const googleCredential = auth.GoogleAuthProvider.credential(idToken);
  return auth().signInWithCredential(googleCredential);
}
```

## Firestore

```jsx
import { useFirestoreConnect } from 'react-redux-firebase';
import { useSelector } from 'react-redux';

function MyComponent() {
  // Listen to Firestore collection
  useFirestoreConnect([
    { collection: 'todos' }
  ]);

  const todos = useSelector(state => state.firestore.data.todos);

  return (
    // Render todos
  );
}
```

## Storage

```javascript
import { useFirebase } from 'react-redux-firebase';

function MyComponent() {
  const firebase = useFirebase();

  const uploadImage = async (uri, filename) => {
    await firebase.uploadFile('images', {
      uri,
      name: filename,
    }, 'images/metadata');
  };

  return (
    // Your component
  );
}
```

## Debugging

Enable debug logging:

```javascript
// In your app entry point
import database from '@react-native-firebase/database';

if (__DEV__) {
  database().setLogLevel('debug');
}
```

## Example App

Check out the complete example at `examples/complete/react-native-firebase/` for a full working implementation.

## Troubleshooting

### "Module not found: @react-native-firebase/database"

Make sure you've installed the module and imported it:
```bash
npm install @react-native-firebase/database
```
```javascript
import '@react-native-firebase/database';
```

### "Default app has not been initialized"

Ensure your `google-services.json` (Android) or `GoogleService-Info.plist` (iOS) is properly configured and located in the correct directory.

### Authentication Issues

Remember to set `enableRedirectHandling: false` in your config:
```javascript
const rrfConfig = {
  enableRedirectHandling: false,
  // ... other config
};
```

## Migration from Web SDK

If you're migrating from the Firebase web SDK to @react-native-firebase:

### Before (Web SDK):
```javascript
import firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/database';

firebase.initializeApp({
  apiKey: "...",
  authDomain: "...",
  // ... config
});

<ReactReduxFirebaseProvider firebase={firebase} ... />
```

### After (@react-native-firebase):
```javascript
import firebase from '@react-native-firebase/app';
import '@react-native-firebase/auth';
import '@react-native-firebase/database';

// No initializeApp needed - configured natively

<ReactReduxFirebaseProvider firebase={firebase} ... />
```

## Resources

- [@react-native-firebase Documentation](https://rnfirebase.io/)
- [react-redux-firebase Documentation](http://react-redux-firebase.com/)
- [Example App](./examples/complete/react-native-firebase/)

## Support

If you encounter issues:
1. Check that all native modules are properly installed
2. Ensure `enableRedirectHandling: false` is set
3. Verify your native Firebase configuration files
4. Check the [@react-native-firebase troubleshooting guide](https://rnfirebase.io/faqs-and-tips)
5. Open an issue on [GitHub](https://github.com/prescottprue/react-redux-firebase/issues)
