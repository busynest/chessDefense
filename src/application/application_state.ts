import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { closeDrawer } from 'pwa-auth';

import type { AppThunk } from '../store.js';

export interface AppState {
  page: string;
  offline: boolean;
  snackbarOpened: boolean;
}

const initialState: AppState = {
  page: '',
  offline: false,
  snackbarOpened: false,
};

const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    updatePage(state, action: PayloadAction<string>) {
      state.page = action.payload;
    },
    setOffline(state, action: PayloadAction<boolean>) {
      state.offline = action.payload;
    },
    openSnackbar(state) {
      state.snackbarOpened = true;
    },
    closeSnackbar(state) {
      state.snackbarOpened = false;
    },
  },
});

const { updatePage, setOffline, openSnackbar, closeSnackbar } = appSlice.actions;

export const appReducer = appSlice.reducer;

export const navigate = (path: string): AppThunk => (dispatch) => {
  const page = path === '/' ? 'home' : decodeURIComponent(path.slice(1));
  closeDrawer();
  window.scrollTo(0, 0);
  void dispatch(loadPage(page));
};

const loadPage = (page: string): AppThunk => async (dispatch) => {
  let resolved = page;

  switch (page) {
    case 'home':
      await import('./home.js');
      break;
    case 'feedback':
      await import('./feedback.js');
      break;
    case 'privacy':
    case 'terms':
      resolved = 'privacy';
      await import('./terms.js');
      break;
    case 'settings':
    case 'profile':
      await import('./account-page.js');
      break;
    case 'reset':
      await import('./reset-page.js');
      break;
    default:
      resolved = 'oops';
      await import('./wrong-page.js');
  }

  dispatch(updatePage(resolved));
};

let snackbarTimer = 0;

export const showSnackbar = (): AppThunk => (dispatch) => {
  dispatch(openSnackbar());
  window.clearTimeout(snackbarTimer);
  snackbarTimer = window.setTimeout(() => {
    dispatch(closeSnackbar());
  }, 3000);
};

export const updateOffline = (offline: boolean): AppThunk => (dispatch, getState) => {
  if (offline !== getState().app.offline) {
    dispatch(showSnackbar());
  }
  dispatch(setOffline(offline));
};
