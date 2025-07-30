/* eslint-disable no-unused-vars */
process.env.NODE_ENV = 'test'

const chai = require('chai')
const sinon = require('sinon')
const chaiAsPromised = require('chai-as-promised')
const sinonChai = require('sinon-chai')
const JSDOM = require('jsdom').JSDOM
const XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest
const WebSocket = require('ws')
// Note: jest-dom extensions removed as they require Jest, we use Chai

// Setup dom for window/document objects
const dom = new JSDOM('<!doctype html><html><body></body></html>')

// Chai Plugins
chai.use(chaiAsPromised)
chai.use(sinonChai)

// Add missing sinon-chai methods
chai.Assertion.addChainableMethod('exactly', function (count) {
  var obj = this._obj
  var calls = obj.callCount || (obj.getCalls ? obj.getCalls().length : 0)
  this.assert(
    calls === count,
    'expected #{this} to have been called exactly #{exp} times, but it was called #{act} times',
    'expected #{this} to not have been called exactly #{exp} times',
    count,
    calls
  )
})

// globals
global.expect = chai.expect
global.sinon = sinon
global.chai = chai
global.window = dom.window
global.document = global.window.document
global.navigator = global.window.navigator
// needed to fix "Error: The XMLHttpRequest compatibility library was not found." from Firebase auth
global.XMLHttpRequest = XMLHttpRequest
// needed to fix: "FIREBASE WARNING: wss:// URL used, but browser isn't known to support websockets.  Trying anyway."
global.WebSocket = WebSocket

// Mock Firebase for tests that don't need real Firebase functionality
const uid = 'Iq5b0qK2NtgggT6U3bU6iZRGyma2'
global.uid = uid
global.existingProfile = {
  existing: 'profileVal'
}

// Create a comprehensive Firebase mock with better return values
const createDatabaseRefMock = (path = 'test-ref') => ({
  push: sinon.stub().returns({
    set: sinon.stub().returns(Promise.resolve()),
    key: 'generated-key'
  }),
  update: sinon.stub().returns(Promise.resolve({ some: 'asdf' })),
  once: sinon.stub().returns(
    Promise.resolve({
      val: () => ({ some: 'asdf' }),
      exists: () => true
    })
  ),
  child: (childPath) => createDatabaseRefMock(`${path}/${childPath}`),
  on: sinon.spy(),
  off: sinon.spy(),
  orderByValue: () => createDatabaseRefMock(path),
  orderByPriority: () => createDatabaseRefMock(path),
  orderByChild: (child) => createDatabaseRefMock(path),
  orderByKey: () => createDatabaseRefMock(path),
  limitToFirst: () => createDatabaseRefMock(path),
  limitToLast: () => createDatabaseRefMock(path),
  equalTo: () => createDatabaseRefMock(path),
  startAt: () => createDatabaseRefMock(path),
  endAt: () => createDatabaseRefMock(path),
  toString: () => path,
  set: sinon.stub().returns(Promise.resolve()),
  remove: sinon.stub().returns(Promise.resolve())
})

const mockFirebase = {
  _: {
    watchers: {},
    authUid: null,
    config: {
      userProfile: 'users',
      enableRedirectHandling: false
    }
  },
  auth: () => ({
    signOut: sinon.stub().returns(Promise.resolve()),
    onAuthStateChanged: sinon.spy((f) => {
      f({ uid: 'asdfasdf' })
    }),
    signInWithEmailAndPassword: sinon
      .stub()
      .returns(Promise.resolve({ uid: 'test' })),
    createUserWithEmailAndPassword: sinon
      .stub()
      .returns(Promise.resolve({ uid: 'test' })),
    signInWithCustomToken: sinon.stub().callsFake((token) => {
      if (token === 'invalidToken') {
        return Promise.reject({ code: 'auth/invalid-custom-token' })
      }
      return Promise.resolve({ uid: 'test' })
    }),
    signInAndRetrieveDataWithCustomToken: sinon.stub().callsFake((token) => {
      if (token === 'invalidToken') {
        return Promise.reject({ code: 'auth/invalid-custom-token' })
      }
      return Promise.resolve({ uid: 'test' })
    }),
    sendPasswordResetEmail: sinon.stub().returns(Promise.resolve()),
    confirmPasswordReset: sinon.stub().returns(Promise.resolve()),
    verifyPasswordResetCode: sinon.stub().returns(Promise.resolve()),
    applyActionCode: sinon.stub().returns(Promise.resolve()),
    updateProfile: sinon.stub().returns(Promise.resolve()),
    currentUser: {
      uid: 'test-user',
      updateProfile: sinon.stub().returns(Promise.resolve()),
      reload: sinon.stub().returns(Promise.resolve()),
      linkWithCredential: sinon.stub().returns(Promise.resolve()),
      getIdToken: sinon.stub().returns(Promise.resolve('fake-token'))
    },
    signInWithPhoneNumber: sinon.stub().returns(Promise.resolve()),
    RecaptchaVerifier: function () {
      return { verify: sinon.stub() }
    },
    ApplicationVerifier: function () {
      this.verify = sinon.stub()
    }
  }),
  database: () => ({
    ref: (path) => createDatabaseRefMock()
  }),
  storage: () => ({
    ref: () => ({
      delete: sinon.spy(() => Promise.resolve()),
      put: sinon.spy(() => Promise.resolve())
    })
  }),
  firestore: () => ({
    doc: (path) => ({
      get: () =>
        Promise.resolve({
          data: () => ({ some: 'obj' }),
          exists: true
        }),
      set: sinon.stub().returns(Promise.resolve()),
      update: sinon.stub().returns(Promise.resolve()),
      delete: sinon.stub().returns(Promise.resolve()),
      onSnapshot: sinon.stub().callsFake((callback) => {
        // Simulate a snapshot
        const snapshot = {
          data: () => ({ some: 'obj' }),
          exists: true,
          id: 'test-doc'
        }
        callback(snapshot)
        // Return unsubscribe function
        return sinon.stub()
      })
    }),
    collection: (path) => ({
      add: sinon.stub().returns(Promise.resolve({ id: 'new-doc' })),
      doc: (id) => mockFirebase.firestore().doc(`${path}/${id}`),
      get: () =>
        Promise.resolve({
          docs: [],
          empty: true,
          size: 0
        }),
      onSnapshot: sinon.stub().callsFake((callback) => {
        // Simulate a collection snapshot
        const snapshot = {
          docs: [],
          empty: true,
          size: 0
        }
        callback(snapshot)
        // Return unsubscribe function
        return sinon.stub()
      }),
      where: () => mockFirebase.firestore().collection(path),
      orderBy: () => mockFirebase.firestore().collection(path),
      limit: () => mockFirebase.firestore().collection(path)
    })
  })
}

global.firebase = mockFirebase
global.Firebase = mockFirebase

const fbConfig = {
  apiKey: 'test',
  authDomain: 'test',
  projectId: 'test',
  databaseURL: 'test',
  storageBucket: 'test',
  messagingSenderId: 'test'
}
global.fbConfig = fbConfig
