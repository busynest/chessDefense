/**
 * Two-player match against the Firebase Emulator Suite.
 * Run with `npm run test:online` so Auth and Firestore are already up.
 *
 * Host and guest are two Firebase apps, the same split as two browsers.
 * The host steps the simulation. The guest only writes commands and reads snapshots.
 */
import assert from 'node:assert/strict';

import { initializeApp } from 'firebase/app';
import { connectAuthEmulator, createUserWithEmailAndPassword, getAuth, signOut } from 'firebase/auth';
import {
  addDoc,
  collection,
  connectFirestoreEmulator,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';

import { applyCommand, tryPlaceBlock } from '../out/game/commands.js';
import { forfeitState, linkPhase, RECONNECT_MS, STALE_MS, transit, unseenIds } from '../out/game/link.js';
import { rematchAgreed } from '../out/game/online.js';
import { createMatch } from '../out/game/setup.js';
import { step } from '../out/game/simulate.js';
import { BLOCKS, overchargeCost } from '../out/game/units.js';

const config = {
  apiKey: 'demo-contractors-centre',
  authDomain: 'localhost',
  projectId: 'contractors-centre',
  databaseURL: 'http://127.0.0.1:9000?ns=emulationui',
};
const code = 'EML1';

function appFor(name) {
  const app = initializeApp(config, name);
  const auth = getAuth(app);
  const db = getFirestore(app);
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  connectFirestoreEmulator(db, '127.0.0.1', 8088);
  return { auth, db };
}

async function user(client, email) {
  const cred = await createUserWithEmailAndPassword(client.auth, email, 'local-match-1');
  return cred.user;
}

function tower(state, side, kind) {
  const found = state.towers.find((piece) => piece.side === side && piece.kind === kind && piece.hp > 0);
  if (!found) throw new Error(`missing ${side} ${kind}`);
  return found;
}

function applyGuest(state, command) {
  if (command.side !== 'black') return { state, ok: false };
  const result = applyCommand(state, command);
  if (!result.ok) return { state, ok: false };
  return { state: result.state, ok: true };
}

function listen(db, match = code) {
  const queue = [];
  let live = false;
  let opened;
  const ready = new Promise((resolve) => { opened = resolve; });
  const stop = onSnapshot(collection(db, 'matches', match, 'inputs'), (snap) => {
    if (!live) {
      live = true;
      opened();
      return;
    }
    for (const change of snap.docChanges()) {
      if (change.type !== 'added') continue;
      const command = change.doc.data().command;
      if (command) queue.push(command);
    }
  });
  return {
    ready,
    stop,
    async next() {
      const start = Date.now();
      while (queue.length === 0) {
        if (Date.now() - start > 8000) throw new Error('guest command did not arrive');
        await new Promise((resolve) => setTimeout(resolve, 30));
      }
      return queue.shift();
    },
  };
}

async function send(db, uid, command, match = code) {
  await addDoc(collection(db, 'matches', match, 'inputs'), {
    uid,
    command,
    at: serverTimestamp(),
  });
}

async function publish(db, state, match = code) {
  await updateDoc(doc(db, 'matches', match), {
    snapshot: state,
    status: state.status,
    winner: state.winner,
  });
}

function watch(db, match = code) {
  let data = null;
  const stop = onSnapshot(doc(db, 'matches', match), (snap) => {
    data = snap.data();
  });
  return {
    stop,
    async until(check) {
      const start = Date.now();
      while (!data || !check(data)) {
        if (Date.now() - start > 8000) throw new Error('snapshot did not update');
        await new Promise((resolve) => setTimeout(resolve, 30));
      }
      return data;
    },
  };
}

const host = appFor('host');
const guest = appFor('guest');
const hostUser = await user(host, 'host@emulator.test');
const guestUser = await user(guest, 'guest@emulator.test');

await setDoc(doc(host.db, 'matches', code), {
  hostId: hostUser.uid,
  guestId: null,
  seed: 7,
  status: 'lobby',
  createdAt: serverTimestamp(),
});
await updateDoc(doc(guest.db, 'matches', code), { guestId: guestUser.uid });

let state = createMatch({ mode: 'online', difficulty: 'normal', seed: 7, humanSide: 'white' });
await publish(host.db, state);

const guestView = watch(guest.db);
const joined = await guestView.until((data) => data.snapshot && data.guestId === guestUser.uid);
assert.equal(joined.snapshot.tick, state.tick);
assert.equal(joined.status, 'playing');

const stalePawn = tower(state, 'black', 'pawn');
await send(guest.db, guestUser.uid, { type: 'upgrade', side: 'black', file: stalePawn.file, rank: stalePawn.rank });
const inputs = listen(host.db);
await inputs.ready;
await new Promise((resolve) => setTimeout(resolve, 400));
assert.equal(tower(state, 'black', 'pawn').level, 1);

const pawn = tower(state, 'black', 'pawn');
state.gold.black = 80;
await send(guest.db, guestUser.uid, { type: 'upgrade', side: 'black', file: pawn.file, rank: pawn.rank });
const upgrade = await inputs.next();
const upgraded = applyGuest(state, upgrade);
assert.equal(upgraded.ok, true);
state = upgraded.state;
assert.equal(tower(state, 'black', 'pawn').level, 2);
await publish(host.db, state);
await guestView.until((data) => data.snapshot.towers.some((piece) => piece.side === 'black' && piece.kind === 'pawn' && piece.level === 2));

await send(guest.db, guestUser.uid, { type: 'upgrade', side: 'white', file: 0, rank: 1 });
const rejected = await inputs.next();
const ignored = applyGuest(state, rejected);
assert.equal(ignored.ok, false);
assert.equal(tower(state, 'white', 'pawn').level, 1);

await send(guest.db, guestUser.uid, { type: 'block', side: 'black', x: 4, y: 9 });
const wall = await inputs.next();
const walled = applyGuest(state, wall);
assert.equal(walled.ok, true);
state = walled.state;
assert.equal(state.blocks.filter((block) => block.side === 'black' && block.hp > 0).length, 1);
state.blocks = state.blocks.filter((block) => block.side !== 'black');
state.gold.black = 8000;
const lanes = [1, 5, 9, 13];
for (const y of [9, 10, 11]) {
  for (let x = 0; x < 16; x += 1) {
    if (lanes.includes(x)) continue;
    const placed = tryPlaceBlock(state, 'black', x, y);
    if (!placed.ok) throw new Error(placed.reason);
    state = placed.state;
  }
}
assert.equal(state.blocks.filter((block) => block.side === 'black' && block.hp > 0).length, BLOCKS.max);
await send(guest.db, guestUser.uid, { type: 'block', side: 'black', x: 1, y: 9 });
const overCap = await inputs.next();
const refused = applyGuest(state, overCap);
assert.equal(refused.ok, false);
assert.equal(refused.state.blocks.filter((block) => block.side === 'black' && block.hp > 0).length, BLOCKS.max);

const wounded = tower(state, 'black', 'pawn');
wounded.hp = Math.max(1, wounded.hp - 40);
const hurt = wounded.hp;
await publish(host.db, state);
await send(guest.db, guestUser.uid, { type: 'repair', side: 'black', file: wounded.file, rank: wounded.rank });
const repair = await inputs.next();
const mended = applyGuest(state, repair);
assert.equal(mended.ok, true);
state = mended.state;
assert.ok(tower(state, 'black', 'pawn').hp > hurt);

const charging = tower(state, 'black', 'rook');
charging.level = 3;
state.gold.black = 200;
const before = state.gold.black;
await send(guest.db, guestUser.uid, { type: 'overcharge', side: 'black', file: charging.file, rank: charging.rank });
const charge = await inputs.next();
const charged = applyGuest(state, charge);
assert.equal(charged.ok, true);
state = charged.state;
const chargedRook = tower(state, 'black', 'rook');
assert.equal(chargedRook.overchargeUses, 1);
assert.equal(state.gold.black, before - overchargeCost(0));

state.mana.black = 100;
await send(guest.db, guestUser.uid, { type: 'spell', side: 'black', spell: 'blast' });
const spell = await inputs.next();
const cast = applyGuest(state, spell);
assert.equal(cast.ok, true);
state = cast.state;
assert.ok(state.mana.black < 100);

let guard = 0;
while (state.wave < 1 && guard < 400) {
  state = step(state);
  guard += 1;
}
assert.ok(state.soldiers.length > 0);
assert.ok(state.wave >= 1);
await publish(host.db, state);
const bound = state.towers.find((piece) => piece.side === 'black' && piece.kind === 'pawn' && state.soldiers.some((soldier) => soldier.originId === piece.id));
assert.ok(bound);
const linked = state.soldiers.filter((soldier) => soldier.originId === bound.id).map((soldier) => soldier.id);
assert.ok(linked.length > 0);
const kept = state.soldiers.find((soldier) => soldier.side === 'white' && soldier.hp > 0);
assert.ok(kept);
bound.hp = 0;
state = step(state);
assert.equal(state.soldiers.some((soldier) => linked.includes(soldier.id)), false);
assert.equal(state.soldiers.some((soldier) => soldier.id === kept.id), true);
await publish(host.db, state);
await guestView.until((data) => data.snapshot
  && data.snapshot.soldiers.every((soldier) => !linked.includes(soldier.id))
  && data.snapshot.soldiers.some((soldier) => soldier.id === kept.id));

guestView.stop();
const droppedTick = state.tick;
for (let n = 0; n < 20; n += 1) state = step(state);
assert.ok(state.tick > droppedTick);
await publish(host.db, state);
const returned = watch(guest.db);
const resumed = await returned.until((data) => data.snapshot && data.snapshot.tick === state.tick);
assert.equal(resumed.snapshot.gold.black, state.gold.black);
assert.equal(resumed.snapshot.blocks.filter((block) => block.hp > 0).length, state.blocks.filter((block) => block.hp > 0).length);

const king = tower(state, 'black', 'king');
king.hp = 0;
state = step(state);
assert.equal(state.status, 'victory');
assert.equal(state.winner, 'white');
await publish(host.db, state);
const ending = await returned.until((data) => data.status === 'victory');
assert.equal(ending.winner, 'white');
assert.equal(ending.snapshot.status, 'victory');
assert.equal(ending.snapshot.winner, 'white');

const missing = await getDoc(doc(host.db, 'matches', 'ZZZZ'));
assert.equal(missing.exists(), false);
await updateDoc(doc(host.db, 'matches', code), { status: 'abandoned' });
const left = await returned.until((data) => data.status === 'abandoned');
assert.equal(left.status, 'abandoned');

assert.equal(rematchAgreed({}), false);
assert.equal(rematchAgreed({ rematch: { host: true, guest: true } }), true);
await updateDoc(doc(host.db, 'matches', code), { rematch: { host: true, guest: true } });
const agreed = await returned.until((data) => rematchAgreed(data));
assert.equal(rematchAgreed(agreed), true);
inputs.stop();
returned.stop();

const wire = 'EML2';
await setDoc(doc(host.db, 'matches', wire), {
  hostId: hostUser.uid,
  guestId: null,
  seed: 11,
  status: 'playing',
  pulse: { host: Date.now(), guest: 0 },
  appliedIds: [],
  createdAt: serverTimestamp(),
});
await updateDoc(doc(guest.db, 'matches', wire), { guestId: guestUser.uid });
await updateDoc(doc(guest.db, 'matches', wire), { 'pulse.guest': Date.now() });
let live = createMatch({ mode: 'online', difficulty: 'normal', seed: 11, humanSide: 'white' });
live.gold.black = 500;
live.mana.black = 100;
await publish(host.db, live, wire);
const wireView = watch(guest.db, wire);
await wireView.until((data) => data.snapshot && data.snapshot.seed === 11);
const wireInputs = listen(host.db, wire);
await wireInputs.ready;

const delays = [];
let drops = 0;
async function deliver(command) {
  let hop = transit(drops === 0 ? 0 : 0.9, 0.4);
  delays.push(hop.delayMs);
  await new Promise((resolve) => setTimeout(resolve, hop.delayMs));
  if (hop.drop) {
    drops += 1;
    hop = transit(0.9, 0.7);
    delays.push(hop.delayMs);
    await new Promise((resolve) => setTimeout(resolve, hop.delayMs));
    assert.equal(hop.drop, false);
  }
  await send(guest.db, guestUser.uid, command, wire);
}

const wirePawn = tower(live, 'black', 'pawn');
await deliver({ type: 'upgrade', side: 'black', file: wirePawn.file, rank: wirePawn.rank });
live = applyGuest(live, await wireInputs.next()).state;
assert.equal(tower(live, 'black', 'pawn').level, 2);

const wireKnight = tower(live, 'black', 'knight');
wireKnight.hp = Math.max(1, wireKnight.hp - 30);
const wireHurt = wireKnight.hp;
await deliver({ type: 'repair', side: 'black', file: wireKnight.file, rank: wireKnight.rank });
live = applyGuest(live, await wireInputs.next()).state;
assert.ok(tower(live, 'black', 'knight').hp > wireHurt);

const wireRook = tower(live, 'black', 'rook');
wireRook.level = 3;
await deliver({ type: 'overcharge', side: 'black', file: wireRook.file, rank: wireRook.rank });
live = applyGuest(live, await wireInputs.next()).state;
assert.equal(tower(live, 'black', 'rook').overchargeUses, 1);

await deliver({ type: 'spell', side: 'black', spell: 'heal' });
live = applyGuest(live, await wireInputs.next()).state;
assert.ok(live.mana.black < 100);

await deliver({ type: 'block', side: 'black', x: 4, y: 9 });
live = applyGuest(live, await wireInputs.next()).state;
assert.equal(live.blocks.filter((block) => block.side === 'black' && block.hp > 0).length, 1);

const wireQueen = tower(live, 'white', 'queen');
await deliver({ type: 'target', side: 'black', file: wireQueen.file, rank: wireQueen.rank });
live = applyGuest(live, await wireInputs.next()).state;
assert.equal(live.waveTarget.black.file, wireQueen.file);
assert.equal(live.waveTarget.black.rank, wireQueen.rank);

assert.equal(drops, 1);
assert.ok(delays.every((delay) => delay >= 100 && delay <= 200));

const listed = await getDocs(collection(host.db, 'matches', wire, 'inputs'));
const known = new Set(listed.docs.map((item) => item.id));
await deliver({ type: 'target', side: 'black', file: -1, rank: -1 });
const after = await getDocs(collection(host.db, 'matches', wire, 'inputs'));
const fresh = unseenIds(known, after.docs.map((item) => item.id));
assert.equal(fresh.length, 1);
const replayed = after.docs.find((item) => item.id === fresh[0]).data().command;
live = applyGuest(live, replayed).state;
assert.equal(live.waveTarget.black, null);
assert.deepEqual(unseenIds(new Set([...known, fresh[0]]), after.docs.map((item) => item.id)), []);

const now = Date.now();
const dropped = linkPhase(now, now - STALE_MS - 50, null);
assert.equal(dropped.phase, 'reconnecting');
const returnedLink = linkPhase(now, now, dropped.noticedAt);
assert.equal(returnedLink.phase, 'live');
const expired = linkPhase(dropped.noticedAt + RECONNECT_MS, now - STALE_MS - 50, dropped.noticedAt);
assert.equal(expired.phase, 'forfeit');

await publish(host.db, live, wire);
await wireView.until((data) => data.snapshot && data.snapshot.waveTarget.black === null && data.snapshot.blocks.some((block) => block.y === 9));

const wireKing = tower(live, 'black', 'king');
wireKing.hp = 0;
live = step(live);
assert.equal(live.status, 'victory');
assert.equal(live.winner, 'white');
const wireHop = transit(0.8, 0.3);
await new Promise((resolve) => setTimeout(resolve, wireHop.delayMs));
await publish(host.db, live, wire);
const wireEnding = await wireView.until((data) => data.status === 'victory' && data.snapshot && data.snapshot.winner === 'white');
assert.equal(wireEnding.snapshot.status, 'victory');

await updateDoc(doc(host.db, 'matches', wire), { rematch: { host: false, guest: false }, status: 'victory' });
const guestHop = transit(0.6, 0.2);
await new Promise((resolve) => setTimeout(resolve, guestHop.delayMs));
await updateDoc(doc(guest.db, 'matches', wire), { 'rematch.guest': true });
const hostHop = transit(0.7, 0.8);
await new Promise((resolve) => setTimeout(resolve, hostHop.delayMs));
await updateDoc(doc(host.db, 'matches', wire), { 'rematch.host': true });
const agreedWire = await wireView.until((data) => rematchAgreed(data));
assert.equal(rematchAgreed(agreedWire), true);

const forfeited = forfeitState(live, 'black', 'white');
assert.equal(forfeited.winner, 'black');
assert.equal(forfeited.banner.text, 'White left the match.');
await publish(host.db, forfeited, wire);
const wireLeft = await wireView.until((data) => data.snapshot && data.snapshot.banner && data.snapshot.banner.text === 'White left the match.');
assert.equal(wireLeft.winner, 'black');

wireInputs.stop();
wireView.stop();
await signOut(host.auth);
await signOut(guest.auth);
console.log('online emulator match passed');
process.exit(0);
