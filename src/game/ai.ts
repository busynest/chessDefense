import { tryOvercharge, tryPlaceBlock, tryRepair, trySpell, tryUpgrade } from './commands.js';
import { chebyshev } from './pathing.js';
import type { GameState, PieceKind, Side, Tower } from './types.js';
import { AI_PERIOD, BLOCKS, SPELLS, combatOf, overchargeCost, repairCost, upgradeCost } from './units.js';

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
  if (state.difficulty === 'easy' && state.gold[side] >= 64 && improve(state, side, 1)) return;
  if (state.difficulty === 'easy' && state.gold[side] >= 96 && layBlock(state, side)) return;
  if (state.difficulty === 'easy' && roll(state, side) < 0.5) return;
  const building = state.nextWaveTick - state.tick > 30;
  const buys = state.difficulty === 'hard' ? 2 : 1;
  const hesitate = state.difficulty === 'normal' && roll(state, side) < 0.4;
  if (state.difficulty !== 'easy' && blastNow(state, side)) return;
  if (mend(state, side, true)) return;
  if (!hesitate && state.difficulty !== 'easy' && improve(state, side, buys)) return;
  if (state.difficulty === 'easy' && roll(state, side) < 0.22 && improve(state, side, 1)) return;
  if (mend(state, side, false)) return;
  if (surge(state, side)) return;
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
      ? ranked.find((tower) => tower.kind === 'pawn') ?? null
      : ranked[0];
    if (!pick) break;
    const raised = tryUpgrade(state, side, pick.file, pick.rank);
    if (!raised.ok) break;
    apply(state, raised.state);
    bought = true;
  }
  return bought;
}

function mend(state: GameState, side: Side, urgent: boolean): boolean {
  const wounded = state.towers.filter((tower) => {
    if (tower.side !== side || tower.hp <= 0 || tower.hp >= tower.maxHp) return false;
    if (state.tick < tower.repairReadyTick) return false;
    if (state.gold[side] < repairCost(tower.maxHp - tower.hp)) return false;
    if (!urgent) return true;
    const ratio = tower.hp / tower.maxHp;
    if (tower.kind === 'king') return ratio < 0.85;
    return ratio < (state.difficulty === 'hard' ? 0.6 : state.difficulty === 'normal' ? 0.4 : 0.28);
  });
  if (wounded.length === 0) return false;
  const pick = [...wounded].sort((a, b) => woundScore(a) - woundScore(b))[0]!;
  const mended = tryRepair(state, side, pick.file, pick.rank);
  if (!mended.ok) return false;
  apply(state, mended.state);
  return true;
}

function woundScore(tower: Tower): number {
  const ratio = tower.hp / tower.maxHp;
  return tower.kind === 'king' ? ratio - 1 : ratio;
}

function enemyNear(state: GameState, tower: Tower): boolean {
  const range = combatOf(tower.kind, tower.level).range;
  const x = tower.file * 2 + 0.5;
  const y = tower.rank * 2 + 0.5;
  return state.soldiers.some((soldier) => (
    soldier.side !== tower.side
    && soldier.hp > 0
    && chebyshev(soldier.x, soldier.y, x, y) <= range
  ));
}

function surge(state: GameState, side: Side): boolean {
  const waveSoon = state.nextWaveTick - state.tick >= 0 && state.nextWaveTick - state.tick < 25;
  const pressed = state.towers.some((tower) => tower.side === side && tower.hp > 0 && tower.hp <= tower.maxHp * 0.5);
  if (state.difficulty === 'easy' && (!pressed || roll(state, side) > 0.2)) return false;
  const reserve = state.difficulty === 'hard' ? 18 : 48;
  const gold = state.gold[side];
  const ready = state.towers.filter((tower) => {
    if (tower.side !== side || tower.hp <= 0 || tower.level < 3) return false;
    if (tower.overchargeUntil > state.tick || tower.overchargeReadyTick > state.tick) return false;
    const uses = tower.overchargeUses ?? 0;
    if (gold < overchargeCost(uses)) return false;
    const launch = waveSoon && uses === 0 && (tower.kind === 'rook' || tower.kind === 'bishop' || tower.kind === 'queen');
    const fighting = uses < 2 && (pressed || enemyNear(state, tower) || launch);
    const dump = uses === 2 && gold >= 100;
    return fighting || dump;
  });
  if (ready.length === 0) return false;
  const ranked = [...ready].sort((a, b) => VALUE[b.kind] - VALUE[a.kind] || (a.overchargeUses ?? 0) - (b.overchargeUses ?? 0));
  const pick = state.difficulty === 'easy'
    ? ranked.find((tower) => tower.kind === 'pawn' || tower.kind === 'knight') ?? ranked[ranked.length - 1]
    : ranked.find((tower) => (tower.overchargeUses ?? 0) === 2 || pressed || state.gold[side] - overchargeCost(tower.overchargeUses) >= reserve);
  if (!pick) return false;
  const charged = tryOvercharge(state, side, pick.file, pick.rank);
  if (!charged.ok) return false;
  apply(state, charged.state);
  return true;
}

function layBlock(state: GameState, side: Side): boolean {
  const budget = state.difficulty === 'easy' ? 4 : state.difficulty === 'normal' ? 4 : 5;
  const owned = state.blocks.filter((block) => block.side === side && block.hp > 0).length;
  if (owned >= budget || state.gold[side] < BLOCKS.cost) return false;
  const gap = 3 + Math.floor(roll(state, side) * 10);
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

function enemiesNearQueen(state: GameState, side: Side): number {
  const queen = state.towers.find((tower) => tower.side === side && tower.kind === 'queen' && tower.hp > 0);
  if (!queen) return 0;
  return state.soldiers.filter((soldier) => {
    if (soldier.side === side || soldier.hp <= 0) return false;
    return chebyshev(soldier.x, soldier.y, queen.file * 2 + 0.5, queen.rank * 2 + 0.5) <= SPELLS.blast.radius;
  }).length;
}

/** Blast before spending gold, so a wave in the camp is answered. */
function blastNow(state: GameState, side: Side): boolean {
  const need = state.difficulty === 'hard' ? 1 : 2;
  if (enemiesNearQueen(state, side) < need || state.mana[side] < SPELLS.blast.mana) return false;
  const casted = trySpell(state, side, 'blast');
  if (!casted.ok) return false;
  apply(state, casted.state);
  return true;
}

function cast(state: GameState, side: Side): boolean {
  const queen = state.towers.find((tower) => tower.side === side && tower.kind === 'queen' && tower.hp > 0);
  if (!queen) return false;
  const mana = state.mana[side];
  const nearEnemies = enemiesNearQueen(state, side);
  const blastAt = state.difficulty === 'easy' ? 3 : 2;
  if (nearEnemies >= blastAt && mana >= SPELLS.blast.mana) {
    return apply(state, trySpell(state, side, 'blast').state);
  }
  const hurtFriend = state.towers.some((tower) => tower.side === side && tower.hp > 0 && tower.hp / tower.maxHp < 0.4);
  if (hurtFriend && mana >= SPELLS.heal.mana) {
    return apply(state, trySpell(state, side, 'heal').state);
  }
  const friends = state.soldiers.filter((soldier) => soldier.side === side && soldier.hp > 0).length;
  if (state.difficulty !== 'easy' && friends >= 2 && mana >= SPELLS.blessing.mana && roll(state, side) < 0.65) {
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

function roll(state: GameState, side: Side): number {
  const next = (Math.imul(side === 'white' ? state.rng : state.rngBlack, 1664525) + 1013904223) >>> 0;
  if (side === 'white') state.rng = next;
  else state.rngBlack = next;
  return next / 4294967296;
}
