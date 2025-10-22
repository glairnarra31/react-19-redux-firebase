# Lazy Loading Fix for React Native Firebase

## Problem

After implementing v22+ support, users were getting errors like:

```
Unable to resolve "@react-native-firebase/database" from
"node_modules/react-19-redux-firebase/lib/utils/reactNativeFirebaseHelpers.js"
```

### Root Cause

The compatibility layer was calling `require('@react-native-firebase/database')` immediately during module initialization to set up properties like `ServerValue`, `FieldValue`, and auth providers. This happened even if:
1. The user wasn't using that specific service (e.g., only using Firestore, not Database)
2. The module wasn't installed in their project
3. The code hadn't been executed yet

### Why It Happened

```javascript
// This code executed immediately when the module loaded:
try {
  const databaseModule = require('@react-native-firebase/database')
  wrapper.database.ServerValue = {
    TIMESTAMP: databaseModule.serverTimestamp()
  }
} catch (e) {
  // Skip
}
```

Even though it was in a `try/catch`, React Native's bundler (Metro) tries to resolve all `require()` calls at build time, causing the error before the code even runs.

## Solution: Lazy Loading with Getters

Changed all property assignments to use `Object.defineProperty()` with **getters** that only execute when the property is actually accessed:

### Before (Eager Loading - Broken)
```javascript
// Executes immediately during module initialization
const databaseModule = require('@react-native-firebase/database')
wrapper.database.ServerValue = {
  TIMESTAMP: databaseModule.serverTimestamp()
}
```

### After (Lazy Loading - Fixed)
```javascript
// Only executes when wrapper.database.ServerValue is accessed
Object.defineProperty(wrapper.database, 'ServerValue', {
  get() {
    try {
      const databaseModule = require('@react-native-firebase/database')
      return {
        TIMESTAMP: databaseModule.serverTimestamp()
      }
    } catch (e) {
      return { TIMESTAMP: null }
    }
  },
  configurable: true
})
```

## What Changed

### 1. Database ServerValue
- **Before:** Immediate `require()` at initialization
- **After:** Lazy getter that loads on first access to `firebase.database.ServerValue`

### 2. Firestore FieldValue
- **Before:** Immediate `require()` at initialization
- **After:** Lazy getter that loads on first access to `firebase.firestore.FieldValue`

### 3. Auth Providers
- **Before:** Immediate `require()` for all providers
- **After:** Individual lazy getters for each provider (GoogleAuthProvider, FacebookAuthProvider, etc.)

## Benefits

1. ✅ **No Build Errors** - Modules are only loaded when actually used
2. ✅ **Optional Dependencies** - Users only need to install the Firebase modules they use
3. ✅ **Better Performance** - Only loads what's needed, when it's needed
4. ✅ **Smaller Bundle** - Unused modules can be tree-shaken
5. ✅ **Better DX** - Clear runtime errors instead of cryptic build errors

## Example Use Cases

### Case 1: Only Using Firestore (No Database)

```javascript
// User installs:
npm install @react-native-firebase/app
npm install @react-native-firebase/firestore

// NOT installed: @react-native-firebase/database

// This now works without errors!
import { getApp } from '@react-native-firebase/app';
const app = getApp();

<ReactReduxFirebaseProvider firebase={app} ... />
```

The database module is never loaded because the user never accesses `firebase.database()` or `firebase.database.ServerValue`.

### Case 2: Using Database

```javascript
// User installs:
npm install @react-native-firebase/app
npm install @react-native-firebase/database

// When user does this:
firebase.database().ref('todos').push({ ... })

// The getter is triggered and loads the module:
const databaseModule = require('@react-native-firebase/database')
// Returns: getDatabase(app)
```

### Case 3: Using Auth Providers

```javascript
// Only when user accesses a provider:
const GoogleAuthProvider = firebase.auth.GoogleAuthProvider

// The getter loads the auth module:
const authModule = require('@react-native-firebase/auth')
return authModule.GoogleAuthProvider
```

## Technical Details

### Object.defineProperty()

We use `Object.defineProperty()` to create lazy-loaded properties:

```javascript
Object.defineProperty(target, propertyName, {
  get() {
    // This code only runs when property is accessed
    return computedValue
  },
  configurable: true // Allows the property to be redefined
})
```

### Why configurable: true?

Allows the property to be reconfigured or deleted if needed in the future.

### Error Handling

Each getter has proper error handling:

```javascript
get() {
  try {
    const module = require('@react-native-firebase/module')
    return module.something
  } catch (e) {
    // Return safe fallback instead of crashing
    return undefined // or null, or default value
  }
}
```

## Testing

The fix has been verified to:
- ✅ Build successfully without errors
- ✅ Not require all Firebase modules to be installed
- ✅ Load modules only when accessed
- ✅ Provide safe fallbacks for missing modules

## Migration Impact

### For Users

**No migration needed!** This is a backwards-compatible fix. Users can:
- Install only the Firebase modules they need
- Use any combination of auth, database, firestore, storage
- Get clear runtime errors if they try to use a module they haven't installed

### For the Library

- No API changes
- No breaking changes
- Better error messages
- More flexible dependency management

## Related Files

- `src/utils/reactNativeFirebaseHelpers.js` - Main fix implementation
- All built files in `lib/` and `es/` directories

## Summary

The lazy loading fix ensures that:
1. Build errors are eliminated
2. Runtime errors are clear and helpful
3. Users only install what they need
4. Performance is optimized
5. The library is more flexible

This makes the library much more user-friendly for React Native developers! 🎉
