import { addDoc, arrayUnion, collection, doc, getDoc, onSnapshot, serverTimestamp, setDoc, updateDoc, type Unsubscribe } from 'firebase/firestore';
import { auth, db } from 'pwa-auth';

import type { GameState, PlayerCommand, Side } from './types.js';

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
    pulse: { host: Date.now(), guest: 0 },
    appliedIds: [],
  });
}

export interface MatchDoc {
  hostId: string;
  guestId: string | null;
  seed: number;
  status?: string;
  snapshot?: GameState;
  rematch?: { host?: boolean; guest?: boolean };
  pulse?: { host?: number; guest?: number };
  appliedIds?: string[];
  forfeit?: { winner: Side; by: Side; at: number };
}

export async function readMatch(code: string): Promise<MatchDoc> {
  const snap = await getDoc(doc(db, 'matches', code));
  if (!snap.exists()) throw new Error('That match code does not exist.');
  return snap.data() as MatchDoc;
}

export async function closeMatch(code: string): Promise<void> {
  await updateDoc(doc(db, 'matches', code), { status: 'abandoned' });
}

export function rematchAgreed(match: { rematch?: { host?: boolean; guest?: boolean } }): boolean {
  return match.rematch?.host === true && match.rematch?.guest === true;
}

export async function offerRematch(code: string, role: 'host' | 'guest'): Promise<void> {
  await updateDoc(doc(db, 'matches', code), { [`rematch.${role}`]: true });
}

export async function clearRematch(code: string): Promise<void> {
  await updateDoc(doc(db, 'matches', code), { rematch: { host: false, guest: false } });
}

export async function joinMatchDoc(code: string, guestId: string): Promise<void> {
  await updateDoc(doc(db, 'matches', code), { guestId });
}

export function watchMatch(
  code: string,
  onData: (data: MatchDoc) => void,
  onError: (message: string) => void,
): Unsubscribe {
  return onSnapshot(doc(db, 'matches', code), (snap) => {
    if (!snap.exists()) {
      onError('That match code does not exist.');
      return;
    }
    onData(snap.data() as MatchDoc);
  }, (error) => onError(error.message));
}

export async function publishSnapshot(code: string, game: GameState, appliedIds?: string[]): Promise<void> {
  const snapshot = JSON.parse(JSON.stringify(game)) as GameState;
  const payload: Record<string, unknown> = {
    snapshot,
    status: snapshot.status,
    winner: snapshot.winner,
  };
  if (appliedIds) payload.appliedIds = appliedIds;
  await updateDoc(doc(db, 'matches', code), payload);
}

export async function pulseMatch(code: string, role: 'host' | 'guest'): Promise<void> {
  await updateDoc(doc(db, 'matches', code), { [`pulse.${role}`]: Date.now() });
}

export async function noteApplied(code: string, id: string): Promise<void> {
  await updateDoc(doc(db, 'matches', code), { appliedIds: arrayUnion(id) });
}

export async function claimForfeit(code: string, winner: Side, by: Side): Promise<void> {
  await updateDoc(doc(db, 'matches', code), { forfeit: { winner, by, at: Date.now() } });
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
  known?: ReadonlySet<string>,
): Unsubscribe {
  let first = true;
  return onSnapshot(collection(db, 'matches', code, 'inputs'), (snap) => {
    const opening = first;
    first = false;
    for (const change of snap.docChanges()) {
      if (change.type !== 'added') continue;
      // Without a known set, the opening snapshot is the backlog and is skipped.
      // With one, only ids the host has not applied are replayed.
      if (opening && !known) continue;
      if (known?.has(change.doc.id)) continue;
      const data = change.doc.data() as { command?: PlayerCommand };
      if (data.command) onCommand(change.doc.id, data.command);
    }
  }, (error) => onError(error.message));
}
