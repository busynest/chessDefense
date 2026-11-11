import { configureStore, type ThunkAction, type UnknownAction } from '@reduxjs/toolkit';
import type { AnyAction, Store } from 'redux';

import { appReducer } from './application/application_state.js';
import { gameReducer } from './game/game_state.js';
import { prefsReducer, savePrefs } from './prefs/prefs_state.js';
import { userReducer } from './user/user_state.js';

export const store = configureStore({
  reducer: {
    app: appReducer,
    user: userReducer,
    game: gameReducer,
    prefs: prefsReducer,
  },
});

store.subscribe(() => {
  savePrefs(store.getState().prefs);
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export type AppThunk<Return = void> = ThunkAction<Return, RootState, undefined, UnknownAction>;

/**
 * pwa-helpers' published `connect` signature still asks for Redux 4's `AnyAction`.
 * The runtime store is the Redux 5 / RTK store above; this view keeps the mixin typed.
 */
export const connectStore = store as unknown as Store<RootState, AnyAction>;
