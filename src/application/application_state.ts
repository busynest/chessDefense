
import { Action, Reducer, ActionCreator }   from 'redux';
import { ThunkAction }                      from 'redux-thunk';
import { store, RootState, RootAction }     from '../store';
import { closeDrawer }                      from '../interface/drawer_state';

export const UPDATE_PAGE          = 'UPDATE_PAGE';
export const UPDATE_OFFLINE       = 'UPDATE_OFFLINE';
export const OPEN_SNACKBAR        = 'OPEN_SNACKBAR';
export const CLOSE_SNACKBAR       = 'CLOSE_SNACKBAR';

export interface AppState {
    page:             string,
    offline:          boolean,
    snackbarOpened:   boolean,
    opened:           boolean
  };

/*
declare global {
  interface HTMLElementTagNameMap {
      'application-shell': AppState;
  }
}
*/

export interface setPage        extends Action<'UPDATE_PAGE'>           { page: string };
export interface setOffline     extends Action<'UPDATE_OFFLINE'>        { offline: boolean };
export interface setSnackbar    extends Action<'OPEN_SNACKBAR'>         {  };
export interface setSnackbars   extends Action<'CLOSE_SNACKBAR'>        {  };

export type AppAction =
    setPage
 |  setOffline
 |  setSnackbar
 |  setSnackbars;

export type ThunkResult = ThunkAction<void, RootState, undefined, AppAction>;


// --- REDUCER ---


const INITIAL_STATE = {
  page:           '',
  offline:        false,
  snackbarOpened: false,
  opened:         false
};

export const app: Reducer<AppState, RootAction> = (state = INITIAL_STATE, action) => {
    
  switch ( action.type ) {
    
    case UPDATE_PAGE:         return { ...state, page: action.page };

    case UPDATE_OFFLINE:      return { ...state, offline: action.offline };
    
    case OPEN_SNACKBAR:       return { ...state, snackbarOpened: true };

    case CLOSE_SNACKBAR:      return { ...state, snackbarOpened: false };
      
    default:
      return state;
  }
}


// --- ACTIONS ---


export const navigate: ActionCreator<ThunkResult> = (path: string) => (dispatch) => {

  const page = path === '/' ? 'home' : decodeURIComponent( path.slice(1) );

  if( page === "home" && window.location.hash ) {
   // store.dispatch( _profile(window.location.hash) );
   // NAVIGATION
    /*
      URL.hash,
      URL.host,
      URL.hostname,
      URL.href,
      URL.origin,
      URL.password,
      URL.pathname,
      URL.port,
      URL.protocol,
      URL.search,
      URL.searchParams,
      URL.username,
      URL.toString(),
      URL.toJSON()
    */
  }

  store.dispatch( closeDrawer() );      // Close Drawer on Navigation
  window.scrollTo(0,0);                 // Scroll to top on Navigation
  dispatch(loadPage(page));             // Load page on Navigation

};

// LOAD PAGE
const loadPage: ActionCreator<ThunkResult> = (page: string) => async (dispatch) => {
  switch(page) {

    case 'home':
      import('./home');
      break;

    case 'feedback':
      import('./feedback');
      break;

    case 'privacy':
      import('./terms');
      break;

    case 'settings':
      import('../interface/settings');
      break;  

    case 'profile':
      import('../interface/profile');
      break;
      
    case 'reset':
      import('../interface/reset');
      break;
  
    default:
      page = 'oops';
      await import('./wrong-page');
  }

  dispatch(updatePage(page));
}

// UPDATE PAGE
const updatePage: ActionCreator<setPage> = (page: string) => {
  return {
    type: UPDATE_PAGE,
    page
  };
}

// SHOW SNACKBAR
let snackbarTimer: number;

export const showSnackbar: ActionCreator<ThunkResult> = () => (dispatch) => {
  dispatch({
    type: OPEN_SNACKBAR
  });
  clearTimeout(snackbarTimer);
  snackbarTimer = window.setTimeout(() =>
    dispatch({ type: CLOSE_SNACKBAR }), 3000);
};

// UPDATE OFFLINE
export const updateOffline: ActionCreator<ThunkResult> = (offline: boolean) => (dispatch, getState) => {
  // Show the snackbar only if offline status changes.
  if (offline !== getState().app!.offline) {
    dispatch(showSnackbar());
  }
  dispatch({
    type: UPDATE_OFFLINE,
    offline
  });
};