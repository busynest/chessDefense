import { addDoc, collection, doc, getDoc, onSnapshot, serverTimestamp, setDoc, updateDoc, type Unsubscribe } from 'firebase/firestore';
import { auth, db } from 'pwa-auth';

import type { GameState, PlayerCommand } from './types.js';

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function matchCode(): string {
  let code = '';
  for (let i = 0; i < 4; i += 1) code += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  return code;
}

export function signedInUid(): string | null {
  if (!auth) return null;
  return auth.currentUser?.uid ?? null;
}

export async function createMatchDoc(code: string, hostId: string, seed: number): Promise<void> {
  await setDoc(doc(db, 'matches', code), {
    hostId,
    guestId: null,
    seed,
    status: 'lobby',
    createdAt: serverTimestamp(),
  });
}

export async function readMatch(code: string): Promise<{ hostId: string; guestId: string | null; seed: number }> {
  const snap = await getDoc(doc(db, 'matches', code));
  if (!snap.exists()) throw new Error('That match code does not exist.');
  return snap.data() as { hostId: string; guestId: string | null; seed: number };
}

export async function joinMatchDoc(code: string, guestId: string): Promise<void> {
  await updateDoc(doc(db, 'matches', code), { guestId });
}

export function watchMatch(
  code: string,
  onData: (data: { hostId: string; guestId: string | null; seed: number; snapshot?: GameState }) => void,
  onError: (message: string) => void,
): Unsubscribe {
  return onSnapshot(doc(db, 'matches', code), (snap) => {
    if (!snap.exists()) {
      onError('That match code does not exist.');
      return;
    }
    onData(snap.data() as { hostId: string; guestId: string | null; seed: number; snapshot?: GameState });
  }, (error) => onError(error.message));
}

export async function publishSnapshot(code: string, game: GameState): Promise<void> {
  await updateDoc(doc(db, 'matches', code), {
    snapshot: game,
    status: game.status,
    winner: game.winner,
  });
}

export async function sendCommand(code: string, uid: string, command: PlayerCommand): Promise<void> {
  await addDoc(collection(db, 'matches', code, 'inputs'), {
    uid,
    command,
    at: serverTimestamp(),
  });
}

export function watchInputs(
  code: string,
  onCommand: (id: string, command: PlayerCommand) => void,
  onError: (message: string) => void,
): Unsubscribe {
  return onSnapshot(collection(db, 'matches', code, 'inputs'), (snap) => {
    for (const change of snap.docChanges()) {
      if (change.type !== 'added') continue;
      const data = change.doc.data() as { command?: PlayerCommand };
      if (data.command) onCommand(change.doc.id, data.command);
    }
  }, (error) => onError(error.message));
}
