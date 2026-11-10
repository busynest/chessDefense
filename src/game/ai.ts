import { legalMoves } from './chess.js';
import { tryMove, tryPlaceBlock, trySpell } from './commands.js';
import { chebyshev } from './pathing.js';
import type { GameState, Side, Square, Tower } from './types.js';
import { AI_PERIOD, BLOCKS, PIECES, SPELLS } from './units.js';

/**
 * One decision for the computer side. Easy hesitates and mostly heals.
 * Normal uses every spell and takes captures. Hard acts often, walls a lane,
 * and develops pieces without stepping into the enemy army.
 * The rng state on the match advances so the same seed replays the same game.
 */
export function aiAct(state: GameState): void {
  const period = AI_PERIOD[state.difficulty];
  if (state.tick % period !== 0) return;
  const side: Side = state.humanSide === 'white' ? 'black' : 'white';
  if (state.difficulty === 'easy' && roll(state) < 0.45) return;
  const building = state.nextWaveTick - state.tick > 30;
  if (building && layBlock(state, side)) return;
  if (cast(state, side)) return;
  reposition(state, side);
}

function layBlock(state: GameState, side: Side): boolean {
  const budget = state.difficulty === 'easy' ? 2 : state.difficulty === 'normal' ? 4 : 6;
  const owned = state.blocks.filter((block) => block.side === side && block.hp > 0).length;
  if (owned >= budget || state.gold[side] < BLOCKS.cost) return false;
  const gap = 3 + Math.floor(roll(state) * 10);
  const rows = side === 'white' ? [6, 7, 5, 4] : [9, 8, 10, 11];
  for (const y of rows) {
    for (let x = 0; x < 16; x += 1) {
      if (Math.abs(x - gap) <= 1) continue;
      if (state.blocks.some((block) => block.x === x && block.y === y && block.hp > 0)) continue;
      const placed = tryPlaceBlock(state, side, x, y);
      if (!placed.ok) continue;
      apply(state, placed.state);
      return true;
    }
  }
  return false;
}

function cast(state: GameState, side: Side): boolean {
  const queen = state.towers.find((tower) => tower.side === side && tower.kind === 'queen' && tower.hp > 0);
  if (!queen) return false;
  const mana = state.mana[side];
  const nearEnemies = state.soldiers.filter((soldier) => {
    if (soldier.side === side || soldier.hp <= 0) return false;
    return chebyshev(soldier.x, soldier.y, queen.file * 2 + 0.5, queen.rank * 2 + 0.5) <= 5;
  }).length;
  const blastAt = state.difficulty === 'easy' ? 4 : 2;
  if (nearEnemies >= blastAt && mana >= SPELLS.blast.mana) {
    return apply(state, trySpell(state, side, 'blast').state);
  }
  const hurtFriend = state.towers.some((tower) => tower.side === side && tower.hp > 0 && tower.hp / tower.maxHp < 0.4);
  if (hurtFriend && mana >= SPELLS.heal.mana) {
    return apply(state, trySpell(state, side, 'heal').state);
  }
  const friends = state.soldiers.filter((soldier) => soldier.side === side && soldier.hp > 0).length;
  if (state.difficulty !== 'easy' && friends >= 2 && mana >= SPELLS.blessing.mana && roll(state) < 0.65) {
    return apply(state, trySpell(state, side, 'blessing').state);
  }
  return false;
}

function reposition(state: GameState, side: Side): void {
  const ready = state.towers.filter((tower) => {
    if (tower.side !== side || tower.hp <= 0) return false;
    if (state.tick < tower.moveReadyTick) return false;
    return state.gold[side] >= PIECES[tower.kind].moveCost;
  });
  if (ready.length === 0) return;
  const ordered = [...ready].sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp);
  for (const tower of ordered) {
    const moves = legalMoves(state, tower);
    if (moves.length === 0) continue;
    const retreat = tower.hp / tower.maxHp < 0.4 ? safer(state, tower, moves) : null;
    if (retreat) {
      commit(state, tower, retreat);
      return;
    }
    const capture = moves.find((square) => {
      const victim = state.towers.find((other) => other.hp > 0 && other.file === square.file && other.rank === square.rank);
      return victim && victim.side !== side && (state.difficulty !== 'easy' || victim.hp < victim.maxHp * 0.5);
    });
    if (capture && tower.kind !== 'king') {
      commit(state, tower, capture);
      return;
    }
    if (tower.kind === 'king') continue;
    const advanceBias = state.difficulty === 'hard' ? 0.5 : state.difficulty === 'normal' ? 0.4 : 0.15;
    if (roll(state) > advanceBias) continue;
    const forward = [...moves].sort((a, b) => forwardness(side, b) - forwardness(side, a))[0];
    if (!forward) continue;
    if (forwardness(side, forward) <= forwardness(side, tower)) continue;
    if (walksIntoArmy(state, side, forward)) continue;
    commit(state, tower, forward);
    return;
  }
}

function safer(state: GameState, tower: Tower, moves: Square[]): Square | null {
  const threats = state.soldiers.filter((soldier) => soldier.side !== tower.side && soldier.hp > 0);
  if (threats.length === 0) return null;
  let best: Square | null = null;
  let bestDist = nearestThreat(tower.file * 2, tower.rank * 2, threats);
  for (const square of moves) {
    const occupied = state.towers.some((other) => other.hp > 0 && other.file === square.file && other.rank === square.rank);
    if (occupied) continue;
    const dist = nearestThreat(square.file * 2, square.rank * 2, threats);
    if (dist > bestDist) {
      best = square;
      bestDist = dist;
    }
  }
  return best;
}

function nearestThreat(x: number, y: number, threats: GameState['soldiers']): number {
  let best = Infinity;
  for (const soldier of threats) {
    const dist = chebyshev(x, y, soldier.x, soldier.y);
    if (dist < best) best = dist;
  }
  return best;
}

function walksIntoArmy(state: GameState, side: Side, square: Square): boolean {
  return state.soldiers.some((soldier) => {
    if (soldier.side === side || soldier.hp <= 0) return false;
    return chebyshev(soldier.x, soldier.y, square.file * 2 + 0.5, square.rank * 2 + 0.5) <= 3;
  });
}

function forwardness(side: Side, square: { rank: number }): number {
  return side === 'white' ? square.rank : 7 - square.rank;
}

function commit(state: GameState, tower: Tower, to: Square): void {
  const moved = tryMove(state, { file: tower.file, rank: tower.rank }, to);
  if (moved.ok) apply(state, moved.state);
}

function apply(state: GameState, next: GameState): boolean {
  state.gold = next.gold;
  state.mana = next.mana;
  state.towers = next.towers;
  state.soldiers = next.soldiers;
  state.blocks = next.blocks;
  state.effects = next.effects;
  state.banner = next.banner;
  state.status = next.status;
  state.winner = next.winner;
  state.nextId = next.nextId;
  state.rng = next.rng;
  return true;
}

function roll(state: GameState): number {
  state.rng = (Math.imul(state.rng, 1664525) + 1013904223) >>> 0;
  return state.rng / 4294967296;
}
