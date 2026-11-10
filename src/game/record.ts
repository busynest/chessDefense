import { doc, getDoc, increment, serverTimestamp, setDoc, collection, addDoc } from 'firebase/firestore';
import { db } from 'pwa-auth';

export interface Career {
  wins: number;
  losses: number;
  draws: number;
}

export async function loadCareer(uid: string): Promise<Career> {
  if (!db) return { wins: 0, losses: 0, draws: 0 };
  const snap = await getDoc(doc(db, 'users', uid));
  const data = snap.data() as Partial<Career> | undefined;
  return {
    wins: data?.wins ?? 0,
    losses: data?.losses ?? 0,
    draws: data?.draws ?? 0,
  };
}

/** Each signed-in player writes only their own record. Local hot-seat is not recorded. */
export async function recordResult(uid: string, result: 'win' | 'loss' | 'draw', mode: string, wave: number): Promise<void> {
  await setDoc(doc(db, 'users', uid), {
    wins: increment(result === 'win' ? 1 : 0),
    losses: increment(result === 'loss' ? 1 : 0),
    draws: increment(result === 'draw' ? 1 : 0),
  }, { merge: true });
  await addDoc(collection(db, 'users', uid, 'history'), {
    result,
    mode,
    wave,
    at: serverTimestamp(),
  });
}
