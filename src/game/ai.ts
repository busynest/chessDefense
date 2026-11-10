import { tryAim, tryOvercharge, tryPlaceBlock, tryRepair, trySpell, tryUpgrade } from './commands.js';
import { chebyshev } from './pathing.js';
import type { GameState, PieceKind, Side, Tower } from './types.js';
import { AI_PERIOD, BLOCKS, SPELLS, buildableRows, combatOf, overchargeCost, repairCost, upgradeCost } from './units.js';

export type Personality = 'rusher' | 'fortress' | 'tactician';

/** Easy rushes cheap pieces. Normal walls the camp and saves mana. Hard aims and times the burst. */
export function personalityOf(difficulty: GameState['difficulty']): Personality {
  if (difficulty === 'easy') return 'rusher';
  if (difficulty === 'hard') return 'tactician';
  return 'fortress';
}

/**
 * One decision for the computer side. Towers do not move.
 * The difficulty picks a personality. The rng on the match advances so the
 * same seed replays the same game.
 */
export function aiAct(state: GameState): void {
  const period = AI_PERIOD[state.difficulty];
  if (state.tick % period !== 0) return;
  const side: Side = state.humanSide === 'white' ? 'black' : 'white';
  const style = personalityOf(state.difficulty);
  if (style === 'rusher') rush(state, side);
  else if (style === 'fortress') fortify(state, side);
  else tactician(state, side);
}

/** Early gold goes to pawns and knights, then a short wall. */
function rush(state: GameState, side: Side): void {
  chooseAim(state, side);
  if (state.gold[side] >= 48 && improve(state, side, 1)) return;
  if (state.gold[side] >= 48 && layBlock(state, side)) return;
  if (state.gold[side] >= 70 && improveKnight(state, side)) return;
  if (state.gold[side] < 100 && roll(state, side) < 0.5) return;
  if (mend(state, side, true)) return;
  if (surge(state, side)) return;
}

/** Fill the legal lanes, repair what is bleeding, and hold mana for Heal and Blast. */
function fortify(state: GameState, side: Side): void {
  chooseAim(state, side);
  if (mendTown(state, side)) return;
  if (layBlock(state, side)) return;
  if (state.gold[side] >= 72 && improve(state, side, 1)) return;
  if (holdMana(state, side)) return;
  if (state.gold[side] >= 90) surge(state, side);
}

/** Switch the mark onto a weak tower and spend the buff on the wave that is about to leave. */
function tactician(state: GameState, side: Side): void {
  chooseAim(state, side);
  if (prepareWave(state, side)) return;
  if (defendTown(state, side)) return;
  const building = state.nextWaveTick - state.tick > 30;
  if (blastNow(state, side)) return;
  if (mend(state, side, true)) return;
  if (roll(state, side) >= 0.25 && improve(state, side, 1)) return;
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

function chooseAim(state: GameState, side: Side): void {
  const foes = state.towers.filter((tower) => tower.side !== side && tower.hp > 0);
  if (foes.length === 0) return;
  if (state.difficulty === 'easy') {
    const pawns = foes.filter((tower) => tower.kind === 'pawn');
    if (pawns.length === 0) {
      if (state.waveTarget[side]) {
        const cleared = tryAim(state, side, -1, -1);
        if (cleared.ok) apply(state, cleared.state);
      }
      return;
    }
  }
  const exposed = (tower: Tower) => (side === 'white' ? tower.rank : 7 - tower.rank);
  const deployed = (tower: Tower) => state.soldiers.filter((soldier) => soldier.hp > 0 && soldier.originId === tower.id).length;
  const pool = state.difficulty === 'easy' ? foes.filter((tower) => tower.kind === 'pawn') : foes;
  const weakest = [...pool].sort((a, b) => (
    (a.hp / a.maxHp - deployed(a) * 0.25) - (b.hp / b.maxHp - deployed(b) * 0.25)
    || exposed(a) - exposed(b)
    || a.file - b.file
  ))[0]!;
  let pick = weakest;
  if (state.difficulty === 'hard') {
    const crowded = [...foes].filter((tower) => tower.kind !== 'king' && deployed(tower) >= 3)
      .sort((a, b) => deployed(b) - deployed(a) || a.file - b.file)[0];
    const queen = foes.find((tower) => tower.kind === 'queen' && tower.hp / tower.maxHp > 0.25);
    const rook = foes.filter((tower) => tower.kind === 'rook' && tower.hp > 0).sort((a, b) => b.hp - a.hp)[0];
    pick = crowded ?? queen ?? rook ?? weakest;
  } else if (pick.kind === 'king') {
    const other = foes.find((tower) => tower.kind !== 'king');
    if (other) pick = other;
  }
  const current = state.waveTarget[side];
  if (current && current.file === pick.file && current.rank === pick.rank) return;
  if (pick.kind === 'king' && !current) return;
  const aimed = tryAim(state, side, pick.file, pick.rank);
  if (aimed.ok) apply(state, aimed.state);
}

function improveKnight(state: GameState, side: Side): boolean {
  const knight = state.towers.find((tower) => (
    tower.side === side && tower.kind === 'knight' && tower.hp > 0 && tower.level < 3
    && state.gold[side] >= upgradeCost(tower.kind, tower.level)
  ));
  if (!knight) return false;
  const raised = tryUpgrade(state, side, knight.file, knight.rank);
  if (!raised.ok) return false;
  apply(state, raised.state);
  return true;
}

function layBlock(state: GameState, side: Side): boolean {
  const budget = Math.min(BLOCKS.max, state.difficulty === 'easy' ? 6 : state.difficulty === 'hard' ? 14 : BLOCKS.max);
  const owned = state.blocks.filter((block) => block.side === side && block.hp > 0).length;
  if (owned >= budget || state.gold[side] < BLOCKS.cost) return false;
  const gap = 4 + (state.seed % 7);
  const rows = buildableRows(side).sort((a, b) => side === 'white' ? b - a : a - b);
  for (const y of rows) {
    for (let x = 0; x < 16; x += 1) {
      if (Math.abs(x - gap) <= 2) continue;
      if (state.blocks.some((block) => block.x === x && block.y === y && block.hp > 0)) continue;
      const placed = tryPlaceBlock(state, side, x, y);
      if (!placed.ok) continue;
      apply(state, placed.state);
      return true;
    }
  }
  return false;
}

function mendTown(state: GameState, side: Side): boolean {
  const wounded = state.towers.filter((tower) => {
    if (tower.side !== side || tower.hp <= 0 || tower.hp >= tower.maxHp) return false;
    if (state.tick < tower.repairReadyTick) return false;
    if (state.gold[side] < repairCost(tower.maxHp - tower.hp)) return false;
    const ratio = tower.hp / tower.maxHp;
    if (tower.kind === 'king') return ratio < 0.5;
    return ratio < 0.72;
  });
  if (wounded.length === 0) return false;
  const pick = [...wounded].sort((a, b) => woundScore(a) - woundScore(b))[0]!;
  const mended = tryRepair(state, side, pick.file, pick.rank);
  if (!mended.ok) return false;
  apply(state, mended.state);
  return true;
}

function holdMana(state: GameState, side: Side): boolean {
  const hurt = state.towers.some((tower) => tower.side === side && tower.hp > 0 && tower.hp / tower.maxHp < 0.45);
  if (hurt && state.mana[side] >= SPELLS.heal.mana) {
    const healed = trySpell(state, side, 'heal');
    if (healed.ok) {
      apply(state, healed.state);
      return true;
    }
  }
  if (enemiesNearQueen(state, side) >= 4 && state.mana[side] >= SPELLS.blast.mana) {
    const casted = trySpell(state, side, 'blast');
    if (casted.ok) {
      apply(state, casted.state);
      return true;
    }
  }
  return false;
}

function prepareWave(state: GameState, side: Side): boolean {
  const until = state.nextWaveTick - state.tick;
  const window = state.difficulty === 'hard' ? 28 : 32;
  if (until < 0 || until > window) return false;
  if (until > 18 && state.mana[side] >= SPELLS.blessing.mana) {
    const casted = trySpell(state, side, 'blessing');
    if (casted.ok) {
      apply(state, casted.state);
      return true;
    }
  }
  return surge(state, side);
}

function defendTown(state: GameState, side: Side): boolean {
  const hot = state.towers.some((tower) => (
    tower.side === side && tower.hp > 0 && tower.hp / tower.maxHp < 0.62 && enemyWithin(state, tower, 5)
  ));
  if (!hot) return false;
  if (state.difficulty === 'hard' && state.mana[side] >= SPELLS.heal.mana) {
    const healed = trySpell(state, side, 'heal');
    if (healed.ok) {
      apply(state, healed.state);
      return true;
    }
  }
  return mend(state, side, true);
}

function enemyWithin(state: GameState, tower: Tower, range: number): boolean {
  const x = tower.file * 2 + 0.5;
  const y = tower.rank * 2 + 0.5;
  return state.soldiers.some((soldier) => (
    soldier.side !== tower.side && soldier.hp > 0 && chebyshev(soldier.x, soldier.y, x, y) <= range
  ));
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
  state.waveTarget = next.waveTarget;
  return true;
}

function roll(state: GameState, side: Side): number {
  const next = (Math.imul(side === 'white' ? state.rng : state.rngBlack, 1664525) + 1013904223) >>> 0;
  if (side === 'white') state.rng = next;
  else state.rngBlack = next;
  return next / 4294967296;
}
