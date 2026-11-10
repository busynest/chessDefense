import type { FirebaseOptions } from 'firebase/app';

/** Existing Chess Defense web app config. Client keys only; nothing new is invented. */
export const firebaseConfig: FirebaseOptions = {
  apiKey: 'AIzaSyAWXOpxGc_GbTYckgNPpRhEWzOpeRxMAOg',
  authDomain: 'chess-defense.firebaseapp.com',
  databaseURL: 'https://chess-defense.firebaseio.com',
  projectId: 'chess-defense',
  storageBucket: 'chess-defense.appspot.com',
  messagingSenderId: '1056334501744',
  appId: '1:1056334501744:web:7d256ce8e20946d4e1a1b5',
};

export const firebaseConfigAttribute = JSON.stringify(firebaseConfig);
