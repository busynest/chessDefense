import { tryPlaceBlock, trySpell, tryUpgrade } from './commands.js';
import { chebyshev } from './pathing.js';
import type { GameState, PieceKind, Side } from './types.js';
import { AI_PERIOD, BLOCKS, SPELLS, upgradeCost } from './units.js';

/**
 * One decision for the computer side. Towers do not move.
 * Easy stalls and heals. Normal upgrades and walls. Hard spends on the
 * strongest towers first and casts whenever a spell is worth it.
 * The rng state on the match advances so the same seed replays the same game.
 */
export function aiAct(state: GameState): void {
  const period = AI_PERIOD[state.difficulty];
  if (state.tick % period !== 0) return;
  const side: Side = state.humanSide === 'white' ? 'black' : 'white';
  if (state.difficulty === 'easy' && roll(state) < 0.5) return;
  const building = state.nextWaveTick - state.tick > 30;
  const buys = state.difficulty === 'hard' ? 2 : 1;
  const hesitate = state.difficulty === 'normal' && roll(state) < 0.4;
  if (!hesitate && state.difficulty !== 'easy' && improve(state, side, buys)) return;
  if (state.difficulty === 'easy' && roll(state) < 0.22 && improve(state, side, 1)) return;
  if (building && layBlock(state, side)) return;
  cast(state, side);
}

const VALUE: Record<PieceKind, number> = {
  rook: 6,
  bishop: 5,
  queen: 5,
  king: 4,
  knight: 3,
  pawn: 2,
};

function improve(state: GameState, side: Side, buys: number): boolean {
  let bought = false;
  for (let n = 0; n < buys; n += 1) {
    const choices = state.towers.filter((tower) => {
      if (tower.side !== side || tower.hp <= 0 || tower.level >= 3) return false;
      return state.gold[side] >= upgradeCost(tower.kind, tower.level);
    });
    if (choices.length === 0) break;
    const ranked = [...choices].sort((a, b) => {
      const hurt = (tower: typeof a) => (tower.hp / tower.maxHp < 0.55 ? 2 : 0);
      const score = (tower: typeof a) => VALUE[tower.kind] * (4 - tower.level) + hurt(tower);
      return score(b) - score(a);
    });
    const pick = state.difficulty === 'easy'
      ? ranked.find((tower) => tower.kind === 'pawn' || tower.kind === 'knight') ?? null
      : ranked[0];
    if (!pick) break;
    const raised = tryUpgrade(state, side, pick.file, pick.rank);
    if (!raised.ok) break;
    apply(state, raised.state);
    bought = true;
  }
  return bought;
}

function layBlock(state: GameState, side: Side): boolean {
  const budget = state.difficulty === 'easy' ? 2 : state.difficulty === 'normal' ? 4 : 5;
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
