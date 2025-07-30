import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux'
import createStore from './store'

const store = createStore()

const Page = () => (
  <div>Hello World</div>
)

const ConnectedPage = firebaseConnect()(Page)

const App = () => (
  <Provider store={store}>
    <ConnectedPage />
  </Provider>
);

const container = document.querySelector('#app');
const root = createRoot(container);
root.render(<App/>);
