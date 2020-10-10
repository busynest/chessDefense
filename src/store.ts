
declare global {
  interface Window {
    process?: Object;
    __REDUX_DEVTOOLS_EXTENSION_COMPOSE__?: typeof compose;
  }
}

import {
  createStore,
  compose,
  applyMiddleware,
  combineReducers,
  Reducer,
  StoreEnhancer
} from 'redux';

import thunk, { ThunkMiddleware } from 'redux-thunk';
import { lazyReducerEnhancer }    from 'pwa-helpers/lazy-reducer-enhancer';

import {
  app,
  AppAction,
  AppState
} from './application/application_state';

import { drawer } from './interface/drawer_state';
import { drawerState, drawerAction } from './interface/drawer_state';

import {
  settings,
  profileAction,
  profileState
} from './interface/settings_state';

import {
  mutual,
  publicAction,
  publicState
} from './interface/public_state';


// Overall state extends static states and partials lazy states.
export interface RootState {
  app?:           AppState;
  drawer?:        drawerState;
  settings?:      profileState;
  mutual?:        publicState;
}

export type RootAction =
  AppAction
| drawerAction
| profileAction
| publicAction ;

// Sets up a Chrome extension for time travel debugging.
// See https://github.com/zalmoxisus/redux-devtools-extension for more information.
const devCompose: <Ext0, Ext1, StateExt0, StateExt1>(
  f1: StoreEnhancer<Ext0, StateExt0>, f2: StoreEnhancer<Ext1, StateExt1>
) => StoreEnhancer<Ext0 & Ext1, StateExt0 & StateExt1> =
 window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

 export const store = createStore(
  state => state as Reducer<RootState, RootAction>,
  devCompose(
      lazyReducerEnhancer(combineReducers),
      applyMiddleware(thunk as ThunkMiddleware<RootState, RootAction>)
  )
);

store.addReducers({
  app,
  drawer,
  settings,
  mutual
 });