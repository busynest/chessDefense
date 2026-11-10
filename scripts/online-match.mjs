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
  getFirestore,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';

import { tryOvercharge, tryPlaceBlock, tryRepair, trySpell, tryUpgrade } from '../out/game/commands.js';
import { createMatch } from '../out/game/setup.js';
import { step } from '../out/game/simulate.js';
import { overchargeCost } from '../out/game/units.js';

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
  const result = command.type === 'upgrade'
    ? tryUpgrade(state, 'black', command.file, command.rank)
    : command.type === 'repair'
      ? tryRepair(state, 'black', command.file, command.rank)
      : command.type === 'overcharge'
        ? tryOvercharge(state, 'black', command.file, command.rank)
        : command.type === 'spell'
          ? trySpell(state, 'black', command.spell)
          : command.type === 'block'
            ? tryPlaceBlock(state, 'black', command.x, command.y)
            : null;
  if (!result?.ok) return { state, ok: false };
  return { state: result.state, ok: true };
}

function listen(db) {
  const queue = [];
  let live = false;
  let opened;
  const ready = new Promise((resolve) => { opened = resolve; });
  const stop = onSnapshot(collection(db, 'matches', code, 'inputs'), (snap) => {
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

async function send(db, uid, command) {
  await addDoc(collection(db, 'matches', code, 'inputs'), {
    uid,
    command,
    at: serverTimestamp(),
  });
}

async function publish(db, state) {
  await updateDoc(doc(db, 'matches', code), {
    snapshot: state,
    status: state.status,
    winner: state.winner,
  });
}

function watch(db) {
  let data = null;
  const stop = onSnapshot(doc(db, 'matches', code), (snap) => {
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

await send(guest.db, guestUser.uid, { type: 'block', side: 'black', x: 4, y: 8 });
const wall = await inputs.next();
const walled = applyGuest(state, wall);
assert.equal(walled.ok, true);
state = walled.state;
assert.equal(state.blocks.filter((block) => block.side === 'black' && block.hp > 0).length, 1);

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

inputs.stop();
returned.stop();
await signOut(host.auth);
await signOut(guest.auth);
console.log('online emulator match passed');
process.exit(0);
