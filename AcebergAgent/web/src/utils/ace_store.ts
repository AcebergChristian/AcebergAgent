// store.js
import { createStore } from 'redux';
import combineReducer from './ace_reducer';

const store = createStore(combineReducer);

export default store;