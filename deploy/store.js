import { createStore, compose, applyMiddleware, combineReducers } from 'redux';
import thunk from 'redux-thunk';
import { lazyReducerEnhancer } from 'pwa-helpers/lazy-reducer-enhancer';
import { app } from './application/application_state';
import { drawer } from './interface/drawer_state';
import { settings } from './interface/settings_state';
import { mutual } from './interface/public_state';
const devCompose = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;
export const store = createStore(state => state, devCompose(lazyReducerEnhancer(combineReducers), applyMiddleware(thunk)));
store.addReducers({
    app,
    drawer,
    settings,
    mutual
});
