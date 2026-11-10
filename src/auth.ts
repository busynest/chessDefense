import {
  getCurrentUser,
  initialize,
  onUserChanged,
  type PwaAuthChangedDetail,
  type PwaEmailVerifiedDetail,
  type PwaUser,
} from 'pwa-auth';

import { firebaseConfig } from './firebase-config.js';
import { store } from './store.js';
import { setUser } from './user/user_state.js';

initialize({
  config: firebaseConfig,
  actionCodeSettings: {
    url: 'https://www.chessdefense.com',
    handleCodeInApp: false,
  },
});

function publish(user: PwaUser | null): void {
  store.dispatch(setUser(user));
}

onUserChanged(publish);

window.addEventListener('pwa-auth-changed', (event: Event) => {
  const detail = (event as CustomEvent<PwaAuthChangedDetail>).detail;
  publish(detail.user);
});

window.addEventListener('pwa-profile-updated', () => {
  publish(getCurrentUser());
});

window.addEventListener('pwa-email-changed', () => {
  publish(getCurrentUser());
});

window.addEventListener('pwa-email-verified', (event: Event) => {
  const detail = (event as CustomEvent<PwaEmailVerifiedDetail>).detail;
  publish(detail.user);
});
