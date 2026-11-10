import assert from 'node:assert/strict';
import { test } from 'node:test';

import { aiAct } from './ai.js';
import { towerAt } from './chess.js';
import { tryAim, tryOvercharge, tryPlaceBlock, tryRemoveBlock, tryRepair, trySpell, tryUpgrade } from './commands.js';
import { fallbackAim, pathToTower, pathToward } from './pathing.js';
import { createMatch } from './setup.js';
import { step } from './simulate.js';
import type { GameState, Soldier, Tower } from './types.js';
import { shouldPublish } from './publish.js';
import { BLOCKS, ECONOMY, KING_LEAK, OVERCHARGE, PIECES, SOLDIERS, WAVES, buildableRows, overchargeCost, repairCost, upgradeCost } from './units.js';

function playing(): GameState {
  return createMatch({ mode: 'local', difficulty: 'normal', seed: 7 });
}

function bare(): GameState {
  const state = playing();
  state.towers = [];
  state.soldiers = [];
  state.blocks = [];
  state.gold = { white: 80, black: 80 };
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
    level: 1,
    attackReadyTick: 9999,
    repairReadyTick: 0,
    mendedTick: 0,
    overchargeUntil: 0,
    overchargeReadyTick: 0,
    overchargeUses: 0,
    hurtBy: null,
  };
  state.towers.push(tower);
  return tower;
}

function fighter(partial: Pick<Soldier, 'id' | 'side' | 'kind' | 'x' | 'y' | 'hp' | 'maxHp'> & Partial<Soldier>): Soldier {
  return {
    attackReadyTick: 0,
    repathTick: 9999,
    path: [],
    buffUntil: 0,
    buffStr: 0,
    buffSpeed: 1,
    power: 1,
    rootedUntil: 0,
    slowUntil: 0,
    hurtBy: null,
    aim: null,
    navStamp: 0,
    originId: '',
    born: 0,
    ...partial,
  };
}

test('repair spends gold for the missing life and then waits', () => {
  const state = bare();
  const pawn = place(state, { side: 'white', kind: 'pawn', file: 0, rank: 1 });
  pawn.hp = 20;
  const missing = pawn.maxHp - pawn.hp;
  const cost = repairCost(missing);
  const healed = tryRepair(state, 'white', 0, 1);
  assert.equal(healed.ok, true);
  assert.equal(towerAt(healed.state, 0, 1)?.hp, pawn.maxHp);
  assert.equal(healed.state.gold.white, 80 - cost);
  const again = tryRepair(healed.state, 'white', 0, 1);
  assert.equal(again.ok, false);
  const hot = structuredClone(healed.state);
  towerAt(hot, 0, 1)!.hp = 10;
  assert.equal(tryRepair(hot, 'white', 0, 1).ok, false);
  const cooled = structuredClone(healed.state);
  const piece = towerAt(cooled, 0, 1)!;
  piece.hp = 10;
  piece.repairReadyTick = cooled.tick;
  const second = tryRepair(cooled, 'white', 0, 1);
  assert.equal(second.ok, true);
});

test('a leaked soldier wounds the King instead of striking at full strength', () => {
  const state = bare();
  const king = place(state, { side: 'black', kind: 'king', file: 4, rank: 7, hp: 40 });
  const pawn = place(state, { side: 'black', kind: 'pawn', file: 0, rank: 6, hp: 40 });
  state.soldiers = [
    fighter({ id: 'on-king', side: 'white', kind: 'cannon', x: 8, y: 14, hp: 40, maxHp: 40 }),
    fighter({ id: 'on-pawn', side: 'white', kind: 'cannon', x: 0, y: 12, hp: 40, maxHp: 40 }),
  ];
  const next = step(state);
  const kingLeft = towerAt(next, 4, 7);
  const pawnLeft = towerAt(next, 0, 6);
  const full = SOLDIERS.cannon.strength;
  assert.ok(kingLeft);
  assert.equal(kingLeft.hp, 40 - Math.max(1, Math.round(full * KING_LEAK)));
  assert.ok(kingLeft.hp > 40 - full);
  assert.equal(pawnLeft?.hp, 40 - full);
  assert.equal(king.kind, 'king');
  assert.equal(pawn.kind, 'pawn');
});

test('overcharge spends gold on a level 3 tower and then waits', () => {
  const state = bare();
  const pawn = place(state, { side: 'white', kind: 'pawn', file: 0, rank: 1 });
  pawn.attackReadyTick = 0;
  assert.equal(tryOvercharge(state, 'white', 0, 1).ok, false);
  pawn.level = 3;
  const charged = tryOvercharge(state, 'white', 0, 1);
  assert.equal(charged.ok, true);
  assert.equal(charged.state.gold.white, 80 - overchargeCost(0));
  const piece = towerAt(charged.state, 0, 1)!;
  assert.equal(piece.overchargeUses, 1);
  assert.equal(piece.overchargeUntil, charged.state.tick + OVERCHARGE.duration);
  assert.equal(tryOvercharge(charged.state, 'white', 0, 1).ok, false);
  const foe = fighter({ id: 'target', side: 'black', kind: 'peasant', x: 1, y: 4, hp: 40, maxHp: 40 });
  const quiet = bare();
  const plain = place(quiet, { side: 'white', kind: 'pawn', file: 0, rank: 1 });
  plain.level = 3;
  plain.attackReadyTick = 0;
  quiet.soldiers = [{ ...foe }];
  const boosted = charged.state;
  boosted.soldiers = [{ ...foe, id: 'boosted' }];
  const normalHit = step(quiet).soldiers.find((soldier) => soldier.id === 'target')!.hp;
  const boostedHit = step(boosted).soldiers.find((soldier) => soldier.id === 'boosted')!.hp;
  assert.ok(boostedHit < normalHit);
});

test('easy spends gold on a pawn once the bank is high', () => {
  const state = playing();
  state.mode = 'ai';
  state.difficulty = 'easy';
  state.humanSide = 'white';
  state.gold.black = 90;
  state.tick = 50;
  const before = state.towers.filter((tower) => tower.side === 'black' && tower.kind === 'pawn' && tower.level === 1).length;
  aiAct(state);
  const after = state.towers.filter((tower) => tower.side === 'black' && tower.kind === 'pawn' && tower.level === 1).length;
  assert.ok(after < before);
  assert.ok(state.gold.black < 90);
});

test('the host publishes the tick the King falls', () => {
  assert.equal(shouldPublish('playing', 5, -1), true);
  assert.equal(shouldPublish('playing', 6, -1), false);
  assert.equal(shouldPublish('playing', 5, 5), false);
  assert.equal(shouldPublish('victory', 7, 5), true);
  assert.equal(shouldPublish('victory', 7, 7), false);
  assert.equal(shouldPublish('lobby', 0, -1), false);
});

test('overcharge costs more the next time that tower buys it', () => {
  const state = bare();
  const pawn = place(state, { side: 'white', kind: 'pawn', file: 0, rank: 1 });
  pawn.level = 3;
  state.gold.white = 400;
  const first = tryOvercharge(state, 'white', 0, 1);
  assert.equal(first.ok, true);
  const cooled = first.state;
  cooled.tick = towerAt(cooled, 0, 1)!.overchargeReadyTick;
  const second = tryOvercharge(cooled, 'white', 0, 1);
  assert.equal(second.ok, true);
  assert.ok(overchargeCost(1) > overchargeCost(0));
  assert.equal(second.state.gold.white, 400 - overchargeCost(0) - overchargeCost(1));
  assert.equal(towerAt(second.state, 0, 1)?.overchargeUses, 2);
});

test('an upgrade spends gold, raises the level, and stops at level 3', () => {
  const state = bare();
  const pawn = place(state, { side: 'white', kind: 'pawn', file: 0, rank: 1 });
  pawn.attackReadyTick = 0;
  const first = tryUpgrade(state, 'white', 0, 1);
  assert.equal(first.ok, true);
  assert.equal(towerAt(first.state, 0, 1)?.level, 2);
  assert.equal(first.state.gold.white, 80 - upgradeCost('pawn', 1));
  assert.equal(towerAt(first.state, 0, 1)?.file, 0);
  let cursor = first.state;
  cursor = tryUpgrade(cursor, 'white', 0, 1).state;
  const third = tryUpgrade(cursor, 'white', 0, 1);
  assert.equal(towerAt(third.state, 0, 1)?.level, 3);
  const capped = tryUpgrade(third.state, 'white', 0, 1);
  assert.equal(capped.ok, false);
});

test('a pawn outpost shoots one soldier in range and does not leave its square', () => {
  const state = bare();
  const pawn = place(state, { side: 'white', kind: 'pawn', file: 0, rank: 1 });
  pawn.attackReadyTick = 0;
  place(state, { side: 'black', kind: 'king', file: 4, rank: 7 });
  state.soldiers = [fighter({ id: 'near', side: 'black', kind: 'peasant', x: 1, y: 4, hp: 16, maxHp: 16 })];
  const next = step(state);
  const shot = next.soldiers.find((soldier) => soldier.id === 'near');
  assert.ok(shot && shot.hp < 16);
  assert.equal(towerAt(next, 0, 1)?.file, 0);
  assert.equal(towerAt(next, 0, 1)?.rank, 1);
});

test('a knight keep cleaves every soldier in its circle and roots them', () => {
  const state = bare();
  const knight = place(state, { side: 'white', kind: 'knight', file: 1, rank: 0 });
  knight.attackReadyTick = 0;
  place(state, { side: 'black', kind: 'king', file: 4, rank: 7 });
  state.soldiers = [
    fighter({ id: 'a', side: 'black', kind: 'peasant', x: 2, y: 1, hp: 30, maxHp: 30 }),
    fighter({ id: 'b', side: 'black', kind: 'peasant', x: 3, y: 1, hp: 30, maxHp: 30 }),
    fighter({ id: 'far', side: 'black', kind: 'peasant', x: 14, y: 14, hp: 30, maxHp: 30 }),
  ];
  const next = step(state);
  const a = next.soldiers.find((soldier) => soldier.id === 'a')!;
  const b = next.soldiers.find((soldier) => soldier.id === 'b')!;
  const far = next.soldiers.find((soldier) => soldier.id === 'far')!;
  assert.ok(a.hp < 30 && b.hp < 30);
  assert.ok(a.rootedUntil > next.tick && b.rootedUntil > next.tick);
  assert.equal(far.hp, 30);
});

test('a bishop bolt slows a soldier, and a rook shell splashes', () => {
  const state = bare();
  const bishop = place(state, { side: 'white', kind: 'bishop', file: 2, rank: 0 });
  bishop.attackReadyTick = 0;
  place(state, { side: 'black', kind: 'king', file: 4, rank: 7 });
  state.soldiers = [fighter({ id: 'slow', side: 'black', kind: 'peasant', x: 4, y: 6, hp: 40, maxHp: 40 })];
  const slowed = step(state);
  assert.ok((slowed.soldiers.find((soldier) => soldier.id === 'slow')?.slowUntil ?? 0) > slowed.tick);

  const splash = bare();
  const rook = place(splash, { side: 'white', kind: 'rook', file: 0, rank: 0 });
  rook.attackReadyTick = 0;
  place(splash, { side: 'black', kind: 'king', file: 7, rank: 7 });
  splash.soldiers = [
    fighter({ id: 'core', side: 'black', kind: 'peasant', x: 1, y: 2, hp: 40, maxHp: 40 }),
    fighter({ id: 'edge', side: 'black', kind: 'peasant', x: 2, y: 2, hp: 40, maxHp: 40 }),
  ];
  const blasted = step(splash);
  assert.ok((blasted.soldiers.find((soldier) => soldier.id === 'core')?.hp ?? 40) < 40);
  assert.ok((blasted.soldiers.find((soldier) => soldier.id === 'edge')?.hp ?? 40) < 40);
});

test('the first wave is one launch after the build, and the next wave waits', () => {
  let state = playing();
  assert.equal(state.wave, 0);
  assert.equal(state.soldiers.length, 0);
  while (state.wave === 0) state = step(state);
  assert.equal(state.tick, WAVES.firstWaveTick);
  const peasants = state.soldiers.filter((soldier) => soldier.kind === 'peasant' && soldier.side === 'white');
  assert.equal(peasants.length, 8);
  const files = peasants.map((soldier) => Math.floor(soldier.x / 2)).sort((a, b) => a - b);
  assert.deepEqual(files, [0, 1, 2, 3, 4, 5, 6, 7]);
  assert.ok(peasants.every((soldier) => soldier.y >= 2.5 && soldier.y < 5));
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
    rootedUntil: 0,
    slowUntil: 0,
    hurtBy: null,
    aim: null,
    navStamp: 0,
    originId: '',
    born: 0,
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
    rootedUntil: 0,
    slowUntil: 0,
    hurtBy: null,
    aim: null,
    navStamp: 0,
    originId: '',
    born: 0,
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
    rootedUntil: 0,
    slowUntil: 0,
    hurtBy: null,
    aim: null,
    navStamp: 0,
    originId: '',
    born: 0,
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

test('walls stay in the two front ranks, off the center, and leave a gap', () => {
  const state = bare();
  state.gold.white = 500;
  state.gold.black = 500;
  assert.equal(tryPlaceBlock(state, 'white', 3, 2).reason, 'Build only in your two front ranks');
  assert.equal(tryPlaceBlock(state, 'white', 3, 9).reason, 'Build only in your two front ranks');
  assert.equal(tryPlaceBlock(state, 'white', 3, 7).reason, 'The center crossing must stay open');
  assert.equal(tryPlaceBlock(state, 'white', 3, 8).reason, 'The center crossing must stay open');
  assert.equal(tryPlaceBlock(state, 'black', 3, 8).reason, 'The center crossing must stay open');
  assert.equal(tryPlaceBlock(state, 'black', 3, 4).reason, 'Build only in your two front ranks');
  assert.equal(tryPlaceBlock(state, 'black', 3, 12).reason, 'Build only in your two front ranks');
  assert.equal(tryPlaceBlock(state, 'white', 3, 4).ok, true);
  assert.equal(tryPlaceBlock(state, 'white', 3, 6).ok, true);
  assert.equal(tryPlaceBlock(state, 'black', 3, 9).ok, true);
  assert.equal(tryPlaceBlock(state, 'black', 3, 11).ok, true);

  let row = bare();
  row.gold.white = 500;
  for (let x = 0; x < 15; x += 1) {
    const placed = tryPlaceBlock(row, 'white', x, 5);
    assert.equal(placed.ok, true, `gap remains at ${x}`);
    row = placed.state;
  }
  const closed = tryPlaceBlock(row, 'white', 15, 5);
  assert.equal(closed.ok, false);
  assert.equal(closed.reason, 'Each row must keep a gap');
});

test('the AI places a wall inside its front ranks', () => {
  const state = playing();
  state.mode = 'ai';
  state.difficulty = 'easy';
  state.humanSide = 'white';
  state.tick = 50;
  state.gold.black = 96;
  for (const tower of state.towers) {
    if (tower.side === 'black' && tower.kind === 'pawn') tower.level = 3;
  }
  aiAct(state);
  const wall = state.blocks.find((block) => block.side === 'black' && block.hp > 0);
  assert.ok(wall);
  assert.ok(buildableRows('black').includes(wall!.y));
  assert.equal(BLOCKS.centerRows.includes(wall!.y), false);
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
    rootedUntil: 0,
    slowUntil: 0,
    hurtBy: null,
    aim: null,
    navStamp: 0,
    originId: '',
    born: 0,
  }];
  const next = step(state);
  assert.equal(next.towers.some((tower) => tower.id === pawn.id), false);
  assert.equal(next.status, 'playing');
});

test('a tower still deploys when a wall covers its own file', () => {
  let state = bare();
  state.gold.white = 500;
  place(state, { side: 'white', kind: 'pawn', file: 0, rank: 1 });
  place(state, { side: 'black', kind: 'king', file: 4, rank: 7 });
  for (const y of [4, 5, 6]) {
    for (const x of [0, 1]) {
      const placed = tryPlaceBlock(state, 'white', x, y);
      assert.equal(placed.ok, true, `${x},${y}`);
      state = placed.state;
    }
  }
  state.nextWaveTick = state.tick + 1;
  state = step(state);
  const spawned = state.soldiers.filter((soldier) => soldier.side === 'white');
  assert.equal(spawned.length, 1);
  assert.ok(spawned[0]!.x <= 1 && spawned[0]!.y >= 2 && spawned[0]!.y <= 4, `left its own square at ${spawned[0]!.x},${spawned[0]!.y}`);
});

test('a soldier walks a one-cell gap instead of chewing the wall beside it', () => {
  const state = bare();
  place(state, { side: 'white', kind: 'king', file: 0, rank: 0 });
  place(state, { side: 'black', kind: 'king', file: 4, rank: 7 });
  for (let x = 0; x < 16; x += 1) {
    if (x === 8) continue;
    state.blocks.push({ x, y: 8, side: 'black', hp: 28, maxHp: 28, hurtBy: null });
  }
  state.soldiers = [{
    id: 'runner',
    side: 'white',
    kind: 'peasant',
    x: 0,
    y: 6,
    hp: 40,
    maxHp: 40,
    attackReadyTick: 0,
    repathTick: 0,
    path: [],
    buffUntil: 0,
    buffStr: 0,
    buffSpeed: 1,
    power: 1,
    rootedUntil: 0,
    slowUntil: 0,
    hurtBy: null,
    aim: null,
    navStamp: 0,
    originId: '',
    born: 0,
  }];
  let cursor = state;
  for (let i = 0; i < 90; i += 1) cursor = step(cursor);
  const soldier = cursor.soldiers.find((unit) => unit.id === 'runner');
  assert.ok(soldier, 'the soldier should still be alive');
  assert.ok(soldier.y > 8, `stuck at ${soldier.x},${soldier.y}`);
  assert.ok(cursor.blocks.length > 12);
});

test('a soldier breaks a wall when every route is closed', () => {
  const state = bare();
  place(state, { side: 'white', kind: 'king', file: 0, rank: 0 });
  place(state, { side: 'black', kind: 'king', file: 4, rank: 7 });
  for (let x = 0; x < 16; x += 1) state.blocks.push({ x, y: 8, side: 'black', hp: 28, maxHp: 28, hurtBy: null });
  state.soldiers = [{
    id: 'axe',
    side: 'white',
    kind: 'peasant',
    x: 8,
    y: 7,
    hp: 40,
    maxHp: 40,
    attackReadyTick: 0,
    repathTick: 0,
    path: [],
    buffUntil: 0,
    buffStr: 0,
    buffSpeed: 1,
    power: 1,
    rootedUntil: 0,
    slowUntil: 0,
    hurtBy: null,
    aim: null,
    navStamp: 0,
    originId: '',
    born: 0,
  }];
  let cursor = state;
  for (let i = 0; i < 20; i += 1) cursor = step(cursor);
  const rank = cursor.blocks.filter((block) => block.y === 8);
  const life = rank.reduce((sum, block) => sum + block.hp, 0);
  assert.ok(life < 16 * 28, `wall rank still has ${life} life`);
});

test('selling a block returns part of its cost', () => {
  const state = bare();
  const placed = tryPlaceBlock(state, 'white', 2, 5);
  assert.equal(placed.ok, true);
  const removed = tryRemoveBlock(placed.state, 'white', 2, 5);
  assert.equal(removed.ok, true);
  assert.equal(removed.state.blocks.length, 0);
  assert.equal(removed.state.gold.white, 80 - BLOCKS.cost + BLOCKS.refund);
});

test('a side marks an enemy tower for the next wave and can clear it', () => {
  const state = playing();
  assert.equal(tryAim(state, 'white', 0, 1).ok, false);
  const marked = tryAim(state, 'white', 0, 6);
  assert.equal(marked.ok, true);
  assert.deepEqual(marked.state.waveTarget.white, { file: 0, rank: 6 });
  assert.equal(marked.state.gold.white, state.gold.white);
  const cleared = tryAim(marked.state, 'white', -1, -1);
  assert.equal(cleared.ok, true);
  assert.equal(cleared.state.waveTarget.white, null);
  const guest = tryAim(state, 'black', 4, 0);
  assert.equal(guest.ok, true);
  assert.equal(tryAim(state, 'black', 4, 7).ok, false);
});

test('the next wave locks onto the marked tower and falls back when it is gone', () => {
  let state = bare();
  place(state, { side: 'white', kind: 'pawn', file: 0, rank: 1 });
  const pawn = place(state, { side: 'black', kind: 'pawn', file: 0, rank: 6, hp: 40 });
  place(state, { side: 'white', kind: 'king', file: 4, rank: 0 });
  place(state, { side: 'black', kind: 'king', file: 4, rank: 7 });
  state.waveTarget.white = { file: pawn.file, rank: pawn.rank };
  state.nextWaveTick = 1;
  state = step(state);
  const launched = state.soldiers.find((soldier) => soldier.side === 'white');
  assert.ok(launched);
  assert.deepEqual(launched.aim, { file: 0, rank: 6 });
  const marked = state.towers.find((tower) => tower.file === 0 && tower.rank === 6);
  assert.ok(marked);
  marked.hp = 0;
  const fallen = step(state);
  assert.equal(fallen.waveTarget.white, null);
  const walker = fallen.soldiers.find((soldier) => soldier.id === launched.id);
  assert.equal(walker?.aim, null);
});

test('a ranged soldier stops at range and a new wall changes the path', () => {
  const state = bare();
  const king = place(state, { side: 'black', kind: 'king', file: 4, rank: 7 });
  place(state, { side: 'white', kind: 'king', file: 4, rank: 0 });
  assert.equal(pathToTower(state, 8, 12, king, 4, 0).length, 0);
  const open = pathToTower(state, 0, 2, king, 1, 0);
  assert.ok(open.length > 0);
  for (let x = 0; x < 16; x += 1) {
    if (x === 15) continue;
    state.blocks.push({ x, y: 6, side: 'white', hp: 28, maxHp: 28, hurtBy: null });
  }
  const around = pathToTower(state, 0, 2, king, 1, 0);
  assert.ok(around.length > 0);
  assert.ok(around.every((cell) => !(cell.y === 6 && cell.x !== 15)));
  assert.notDeepEqual(open, around);
});

test('each tower releases its soldiers from its own gate', () => {
  let state = bare();
  const pawn = place(state, { side: 'white', kind: 'pawn', file: 0, rank: 1 });
  const rook = place(state, { side: 'white', kind: 'rook', file: 7, rank: 0 });
  place(state, { side: 'black', kind: 'king', file: 4, rank: 7 });
  state.nextWaveTick = state.tick + 1;
  state = step(state);
  const fromPawn = state.soldiers.find((soldier) => soldier.originId === pawn.id);
  const fromRook = state.soldiers.find((soldier) => soldier.originId === rook.id);
  assert.ok(fromPawn);
  assert.ok(fromRook);
  assert.ok(fromPawn.x <= 1.5 && fromPawn.y >= 2.5 && fromPawn.y <= 4.5, `${fromPawn.x},${fromPawn.y}`);
  assert.ok(fromRook.x >= 13.5 && fromRook.y <= 2.5, `${fromRook.x},${fromRook.y}`);
});

test('destroying a tower fades its soldiers and pays no bounty', () => {
  const state = bare();
  state.gold.white = 10;
  const pawn = place(state, { side: 'black', kind: 'pawn', file: 0, rank: 6, hp: 4 });
  const other = place(state, { side: 'black', kind: 'knight', file: 1, rank: 7 });
  const whiteKing = place(state, { side: 'white', kind: 'king', file: 4, rank: 0 });
  place(state, { side: 'black', kind: 'king', file: 4, rank: 7 });
  state.soldiers = [
    fighter({ id: 'mine', side: 'black', kind: 'peasant', x: 3, y: 8, hp: 20, maxHp: 20, originId: pawn.id }),
    fighter({ id: 'theirs', side: 'black', kind: 'knight', x: 6, y: 8, hp: 20, maxHp: 20, originId: other.id }),
  ];
  state.soldiers.push(fighter({ id: 'axe', side: 'white', kind: 'peasant', x: 0, y: 11, hp: 40, maxHp: 40, originId: whiteKing.id }));
  const next = step(state);
  assert.equal(next.soldiers.some((soldier) => soldier.id === 'mine'), false);
  assert.equal(next.soldiers.some((soldier) => soldier.id === 'theirs'), true);
  assert.equal(next.gold.white, 10 + ECONOMY.goldPerTick + PIECES.pawn.bounty);
});

test('a full side does not save unreleased soldiers for later', () => {
  let state = bare();
  const pawn = place(state, { side: 'white', kind: 'pawn', file: 0, rank: 1 });
  place(state, { side: 'white', kind: 'king', file: 4, rank: 0 });
  place(state, { side: 'black', kind: 'king', file: 4, rank: 7 });
  state.soldiers = Array.from({ length: WAVES.soldierCap }, (_, index) => fighter({
    id: `held-${index}`,
    side: 'white',
    kind: 'peasant',
    x: index % 16,
    y: 3,
    hp: 10,
    maxHp: 10,
    originId: pawn.id,
  }));
  state.nextWaveTick = state.tick + 1;
  state = step(state);
  assert.equal(state.soldiers.filter((soldier) => soldier.originId === pawn.id).length, WAVES.soldierCap);
  state.nextWaveTick = state.tick + 1;
  const pawnLeft = state.towers.find((tower) => tower.id === pawn.id);
  assert.ok(pawnLeft);
  pawnLeft.hp = 0;
  state = step(state);
  assert.equal(state.soldiers.some((soldier) => soldier.originId === pawn.id), false);
});

test('a fallen mark falls back toward the King', () => {
  const state = bare();
  place(state, { side: 'black', kind: 'king', file: 4, rank: 7 });
  place(state, { side: 'black', kind: 'pawn', file: 0, rank: 6 });
  assert.deepEqual(fallbackAim(state, 'white', 1, 2), { file: 0, rank: 6 });
  assert.equal(fallbackAim(state, 'white', 8, 14), null);
});
