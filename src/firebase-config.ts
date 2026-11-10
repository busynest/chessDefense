import type { FirebaseOptions } from 'firebase/app';

declare global {
  interface Window {
    process?: { env?: { NODE_ENV?: string; FIREBASE_CONFIG?: string } };
  }
}

/**
 * The config boot.js chose. Localhost gets the development file, which points
 * the Realtime Database at the emulator. Every other host gets production.
 */
function bootedConfig(): FirebaseOptions {
  const raw = window.process?.env?.FIREBASE_CONFIG;
  if (!raw) throw new Error('boot.js must set FIREBASE_CONFIG before the app module.');
  return JSON.parse(raw) as FirebaseOptions;
}

export const firebaseConfig: FirebaseOptions = bootedConfig();
export const firebaseConfigAttribute = JSON.stringify(firebaseConfig);
