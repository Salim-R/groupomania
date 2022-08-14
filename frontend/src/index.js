import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import "./styles/index.scss";
import rootReducer from './reducers/';
import { Provider } from 'react-redux';
import { applyMiddleware, legacy_createStore as createStore } from 'redux';
import { composeWithDevTools } from 'redux-devtools-extension';
import thunk from 'redux-thunk';
import logger from 'redux-logger';
import { getUsers } from './actions/users.actions';
import { getPosts } from './actions/post.actions';

const store = createStore(
  rootReducer, composeWithDevTools(applyMiddleware(logger, thunk))
)
store.dispatch(getUsers());
store.dispatch(getPosts());
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <Provider store={store}>

    <App />

  </Provider>
);


