# React Native Firebase Example

> Example of using @react-native-firebase/app with react-redux-firebase

This example demonstrates how to use the native Firebase modules in React Native with react-redux-firebase's full functionality.

## Prerequisites

- Node.js
- React Native development environment set up
- iOS: Xcode and CocoaPods
- Android: Android Studio and SDK

## Installation

1. **Install dependencies:**
   ```bash
   npm install
   # or
   yarn install
   ```

2. **Install iOS pods (iOS only):**
   ```bash
   cd ios && pod install && cd ..
   ```

3. **Configure Firebase:**
   - Add `google-services.json` to `android/app/` (for Android)
   - Add `GoogleService-Info.plist` to `ios/` (for iOS)
   - Follow the [@react-native-firebase setup guide](https://rnfirebase.io/)

## Run

**iOS:**
```bash
npm run ios
# or
react-native run-ios
```

**Android:**
```bash
npm run android
# or
react-native run-android
```

## Features

This example demonstrates:
- ✅ Firebase Realtime Database with react-redux-firebase
- ✅ Authentication
- ✅ Automatic compatibility with @react-native-firebase
- ✅ Redux integration
- ✅ React hooks (useFirebase, useFirebaseConnect)

## Key Files

- `src/createStore.js` - Redux store setup with @react-native-firebase
- `src/Home.js` - Main component using Firebase hooks
- `src/TodosList.js` - Component demonstrating data fetching

## Documentation

See the main [REACT_NATIVE_FIREBASE.md](../../../REACT_NATIVE_FIREBASE.md) guide for complete documentation on using react-redux-firebase with React Native Firebase.
