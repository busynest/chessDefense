import { store } from '../store';
import { closeDrawer } from '../interface/drawer_state';
export const UPDATE_PAGE = 'UPDATE_PAGE';
export const UPDATE_OFFLINE = 'UPDATE_OFFLINE';
export const OPEN_SNACKBAR = 'OPEN_SNACKBAR';
export const CLOSE_SNACKBAR = 'CLOSE_SNACKBAR';
;
;
;
;
;
const INITIAL_STATE = {
    page: '',
    offline: false,
    snackbarOpened: false,
    opened: false
};
export const app = (state = INITIAL_STATE, action) => {
    switch (action.type) {
        case UPDATE_PAGE: return Object.assign(Object.assign({}, state), { page: action.page });
        case UPDATE_OFFLINE: return Object.assign(Object.assign({}, state), { offline: action.offline });
        case OPEN_SNACKBAR: return Object.assign(Object.assign({}, state), { snackbarOpened: true });
        case CLOSE_SNACKBAR: return Object.assign(Object.assign({}, state), { snackbarOpened: false });
        default:
            return state;
    }
};
export const navigate = (path) => (dispatch) => {
    const page = path === '/' ? 'home' : decodeURIComponent(path.slice(1));
    if (page === "home" && window.location.hash) {
    }
    store.dispatch(closeDrawer());
    window.scrollTo(0, 0);
    dispatch(loadPage(page));
};
const loadPage = (page) => async (dispatch) => {
    switch (page) {
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
};
const updatePage = (page) => {
    return {
        type: UPDATE_PAGE,
        page
    };
};
let snackbarTimer;
export const showSnackbar = () => (dispatch) => {
    dispatch({
        type: OPEN_SNACKBAR
    });
    clearTimeout(snackbarTimer);
    snackbarTimer = window.setTimeout(() => dispatch({ type: CLOSE_SNACKBAR }), 3000);
};
export const updateOffline = (offline) => (dispatch, getState) => {
    if (offline !== getState().app.offline) {
        dispatch(showSnackbar());
    }
    dispatch({
        type: UPDATE_OFFLINE,
        offline
    });
};
