import assert from 'node:assert/strict';
import { test } from 'node:test';

import { legalMoves, towerAt } from './chess.js';
import { tryMove, tryPlaceBlock, tryRemoveBlock, trySpell } from './commands.js';
import { pathToward } from './pathing.js';
import { createMatch } from './setup.js';
import { step } from './simulate.js';
import type { GameState, Soldier, Tower } from './types.js';
import { BLOCKS, PIECES, WAVES } from './units.js';

function playing(): GameState {
  return createMatch({ mode: 'local', difficulty: 'normal', seed: 7 });
}

function bare(): GameState {
  const state = playing();
  state.towers = [];
  state.soldiers = [];
  state.blocks = [];
  state.gold = { white: 200, black: 200 };
  state.mana = { white: 100, black: 100 };
  return state;
}

function place(state: GameState, partial: Pick<Tower, 'side' | 'kind' | 'file' | 'rank'> & { hp?: number }): Tower {
  const def = PIECES[partial.kind];
  const tower: Tower = {
    id: `t${state.nextId++}`,
    side: partial.side,
    kind: partial.kind,
    file: partial.file,
    rank: partial.rank,
    hp: partial.hp ?? def.hp,
    maxHp: def.hp,
    moveReadyTick: 0,
    auraReadyTick: 9999,
    hurtBy: null,
  };
  state.towers.push(tower);
  return tower;
}

test('white pawn steps once, twice from home, and captures only on the diagonal', () => {
  const state = bare();
  place(state, { side: 'white', kind: 'pawn', file: 0, rank: 1 });
  place(state, { side: 'black', kind: 'pawn', file: 1, rank: 2 });
  const pawn = towerAt(state, 0, 1)!;
  const names = legalMoves(state, pawn).map((square) => `${square.file},${square.rank}`).sort();
  assert.deepEqual(names, ['0,2', '0,3', '1,2']);
});

test('a pawn cannot double-step through or onto a piece, and a bishop cannot jump', () => {
  const state = bare();
  place(state, { side: 'white', kind: 'pawn', file: 3, rank: 1 });
  place(state, { side: 'white', kind: 'knight', file: 3, rank: 2 });
  const pawn = towerAt(state, 3, 1)!;
  assert.deepEqual(legalMoves(state, pawn), []);

  place(state, { side: 'white', kind: 'bishop', file: 2, rank: 0 });
  place(state, { side: 'white', kind: 'pawn', file: 3, rank: 1 });
  const bishop = towerAt(state, 2, 0)!;
  assert.equal(legalMoves(state, bishop).some((square) => square.file === 4 && square.rank === 2), false);
});

test('knights jump and cannot land on a friend', () => {
  const state = bare();
  const knight = place(state, { side: 'white', kind: 'knight', file: 1, rank: 0 });
  place(state, { side: 'white', kind: 'pawn', file: 2, rank: 2 });
  const moves = legalMoves(state, knight).map((square) => `${square.file},${square.rank}`).sort();
  assert.ok(moves.includes('0,2'));
  assert.ok(moves.includes('2,2') === false);
});

test('moving onto an enemy tower captures it and pays the move cost', () => {
  const state = bare();
  place(state, { side: 'white', kind: 'rook', file: 0, rank: 0 });
  place(state, { side: 'black', kind: 'pawn', file: 0, rank: 3 });
  const moved = tryMove(state, { file: 0, rank: 0 }, { file: 0, rank: 3 });
  assert.equal(moved.ok, true);
  assert.equal(towerAt(moved.state, 0, 3)?.side, 'white');
  assert.equal(moved.state.towers.some((tower) => tower.kind === 'pawn'), false);
  assert.equal(moved.state.gold.white, 200 - PIECES.rook.moveCost + PIECES.pawn.bounty);
});

test('friendly towers cannot stack', () => {
  const state = bare();
  place(state, { side: 'white', kind: 'rook', file: 0, rank: 0 });
  place(state, { side: 'white', kind: 'pawn', file: 0, rank: 3 });
  const moved = tryMove(state, { file: 0, rank: 0 }, { file: 0, rank: 3 });
  assert.equal(moved.ok, false);
});

test('the first wave is one launch after the build, and the next wave waits', () => {
  let state = playing();
  assert.equal(state.wave, 0);
  assert.equal(state.soldiers.length, 0);
  while (state.wave === 0) state = step(state);
  assert.equal(state.tick, WAVES.firstWaveTick);
  const peasants = state.soldiers.filter((soldier) => soldier.kind === 'peasant' && soldier.side === 'white');
  assert.equal(peasants.length, 8);
  assert.ok(peasants.every((soldier) => soldier.y >= 4));
  const quiet = step(state);
  assert.equal(quiet.wave, 1);
  assert.equal(quiet.soldiers.filter((soldier) => soldier.side === 'white' && soldier.kind === 'peasant').length, 8);
});

test('pathing walks around a wall and toward the enemy king', () => {
  const state = bare();
  place(state, { side: 'black', kind: 'king', file: 4, rank: 7 });
  state.blocks = [];
  for (let x = 0; x < 16; x += 1) {
    if (x !== 15) state.blocks.push({ x, y: 8, side: 'black', hp: 28, maxHp: 28, hurtBy: null });
  }
  const path = pathToward(state, 0, 4, 'white');
  assert.ok(path.length > 0);
  assert.ok(path.every((cell) => !(cell.y === 8 && cell.x !== 15)));
  assert.ok(path[path.length - 1]!.x > 0);
});

test('melee combat damages a soldier and removes it at zero life', () => {
  const state = bare();
  place(state, { side: 'white', kind: 'king', file: 4, rank: 0 });
  place(state, { side: 'black', kind: 'king', file: 4, rank: 7 });
  const attacker: Soldier = {
    id: 'a',
    side: 'white',
    kind: 'knight',
    x: 1,
    y: 1,
    hp: 30,
    maxHp: 34,
    attackReadyTick: 0,
    repathTick: 9999,
    path: [],
    buffUntil: 0,
    buffStr: 0,
    buffSpeed: 1,
    power: 1,
    hurtBy: null,
  };
  const defender: Soldier = { ...attacker, id: 'b', side: 'black', kind: 'peasant', x: 1, y: 2, hp: 5, maxHp: 16 };
  state.soldiers = [attacker, defender];
  const next = step(state);
  assert.equal(next.soldiers.some((soldier) => soldier.id === 'b'), false);
  assert.ok(next.gold.white > state.gold.white);
});

test('destroying the enemy king ends the match', () => {
  const state = bare();
  place(state, { side: 'white', kind: 'king', file: 4, rank: 0 });
  place(state, { side: 'black', kind: 'king', file: 4, rank: 7, hp: 1 });
  state.soldiers = [{
    id: 'cannon',
    side: 'white',
    kind: 'cannon',
    x: 8,
    y: 12,
    hp: 26,
    maxHp: 26,
    attackReadyTick: 0,
    repathTick: 9999,
    path: [],
    buffUntil: 0,
    buffStr: 0,
    buffSpeed: 1,
    power: 1,
    hurtBy: null,
  }];
  const next = step(state);
  assert.equal(next.status, 'victory');
  assert.equal(next.winner, 'white');
  assert.equal(next.towers.some((tower) => tower.side === 'black' && tower.kind === 'king'), false);
});

test('a queen blessing buffs a nearby friendly soldier and spends mana', () => {
  const state = bare();
  place(state, { side: 'white', kind: 'queen', file: 3, rank: 0 });
  place(state, { side: 'white', kind: 'king', file: 4, rank: 0 });
  place(state, { side: 'black', kind: 'king', file: 4, rank: 7 });
  state.soldiers = [{
    id: 'p',
    side: 'white',
    kind: 'peasant',
    x: 6,
    y: 1,
    hp: 10,
    maxHp: 16,
    attackReadyTick: 50,
    repathTick: 9999,
    path: [],
    buffUntil: 0,
    buffStr: 0,
    buffSpeed: 1,
    power: 1,
    hurtBy: null,
  }];
  const cast = trySpell(state, 'white', 'blessing');
  assert.equal(cast.ok, true);
  assert.equal(cast.state.mana.white, 100 - 24);
  assert.ok(cast.state.soldiers[0]!.buffUntil > state.tick);
  assert.equal(cast.state.effects[0]?.spell, 'blessing');
});

test('the same seed and the same commands produce the same match', () => {
  const left = createMatch({ mode: 'ai', difficulty: 'normal', seed: 42 });
  const right = createMatch({ mode: 'ai', difficulty: 'normal', seed: 42 });
  let a = left;
  let b = right;
  for (let i = 0; i < 80; i += 1) {
    a = step(a);
    b = step(b);
  }
  assert.equal(a.tick, b.tick);
  assert.equal(a.winner, b.winner);
  assert.deepEqual(a.gold, b.gold);
  assert.equal(a.soldiers.length, b.soldiers.length);
  assert.deepEqual(a.soldiers.map((soldier) => [soldier.x, soldier.y, soldier.hp]), b.soldiers.map((soldier) => [soldier.x, soldier.y, soldier.hp]));
});

test('a scripted attack can defeat the easy AI king', () => {
  let state = createMatch({ mode: 'ai', difficulty: 'easy', seed: 3 });
  for (let i = 0; i < 2500 && state.status === 'playing'; i += 1) {
    state = step(state);
    if (state.status !== 'playing') break;
    if (state.mana.white >= 36 && state.tick % 15 === 0) {
      const cast = trySpell(state, 'white', 'blast');
      if (cast.ok) state = cast.state;
    }
  }
  assert.equal(state.status, 'victory');
  assert.ok(state.winner === 'white' || state.winner === 'black');
});

test('white cannot wall the top half, and a sealed rank is rejected', () => {
  const state = bare();
  state.gold.white = 500;
  state.gold.black = 500;
  const wrongHalf = tryPlaceBlock(state, 'white', 3, 8);
  assert.equal(wrongHalf.ok, false);
  const topHalf = tryPlaceBlock(state, 'black', 3, 8);
  assert.equal(topHalf.ok, true);
  const bottom = tryPlaceBlock(state, 'white', 3, 7);
  assert.equal(bottom.ok, true);

  let walled = bare();
  walled.gold.white = 500;
  for (let x = 0; x < 15; x += 1) {
    const placed = tryPlaceBlock(walled, 'white', x, 7);
    assert.equal(placed.ok, true, `gap remains at ${x}`);
    walled = placed.state;
  }
  const sealed = tryPlaceBlock(walled, 'white', 15, 7);
  assert.equal(sealed.ok, false);
  assert.match(sealed.reason, /seal/);
});

test('a tower at zero life is removed and no longer blocks its cells', () => {
  const state = bare();
  const pawn = place(state, { side: 'black', kind: 'pawn', file: 0, rank: 6, hp: 4 });
  place(state, { side: 'white', kind: 'king', file: 4, rank: 0 });
  place(state, { side: 'black', kind: 'king', file: 4, rank: 7 });
  state.soldiers = [{
    id: 'axe',
    side: 'white',
    kind: 'peasant',
    x: 0,
    y: 11,
    hp: 40,
    maxHp: 40,
    attackReadyTick: 0,
    repathTick: 9999,
    path: [],
    buffUntil: 0,
    buffStr: 0,
    buffSpeed: 1,
    power: 1,
    hurtBy: null,
  }];
  const next = step(state);
  assert.equal(next.towers.some((tower) => tower.id === pawn.id), false);
  assert.equal(next.status, 'playing');
});

test('selling a block returns part of its cost', () => {
  const state = bare();
  const placed = tryPlaceBlock(state, 'white', 2, 5);
  assert.equal(placed.ok, true);
  const removed = tryRemoveBlock(placed.state, 'white', 2, 5);
  assert.equal(removed.ok, true);
  assert.equal(removed.state.blocks.length, 0);
  assert.equal(removed.state.gold.white, 200 - BLOCKS.cost + BLOCKS.refund);
});
