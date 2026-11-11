import type { PieceKind, Side, SoldierKind, SpellId } from './types.js';

/** One simulation step. 10 steps is one second. */
export const TICK_SECONDS = 0.1;

/**
 * Shared economy. Gold pays for walls and tower upgrades. Mana pays for Queen spells.
 * Both sides receive the same income. The cap is low so a hoard cannot buy the whole town.
 */
export const ECONOMY = {
  goldPerTick: 0.3,
  manaPerTick: 0.3,
  startingGold: 36,
  startingMana: 14,
  goldCap: 120,
  manaCap: 100,
};

export type AttackStyle = 'arrow' | 'cleave' | 'pierce' | 'splash' | 'nova' | 'keep';

export interface PieceDef {
  label: string;
  role: string;
  soldier: SoldierKind;
  hp: number;
  /** Army-cell reach from the tower's center. */
  range: number;
  rangeGrow: number;
  damage: number;
  attackTicks: number;
  style: AttackStyle;
  /** Extra targets for a cleave, or the splash radius for a cannon or nova. */
  splash: number;
  pierce: number;
  /** Root or slow, in ticks. */
  controlTicks: number;
  bounty: number;
  /** Gold to leave level 1. The step to level 3 costs 1.6 times this. */
  upgrade: number;
}

export interface SoldierDef {
  label: string;
  strength: number;
  hp: number;
  /** Army cells per second. */
  speed: number;
  /** Chebyshev range in army cells. 1 is melee, including diagonals. */
  range: number;
  attackTicks: number;
  bounty: number;
}

export interface SpellDef {
  label: string;
  mana: number;
  /** Army-cell radius for blessing and blast. Chess-square radius for heal. */
  radius: number;
  durationTicks: number;
  strength: number;
  speed: number;
  heal: number;
  damage: number;
  towerDamage: number;
  summary: string;
}

/**
 * Fixed towers. Each piece is a tower-defense building in that silhouette.
 * It never moves. It shoots, and each wave it still sends its soldier.
 * Queen is the only caster. Destroying the enemy King tower wins.
 */
export const PIECES: Record<PieceKind, PieceDef> = {
  pawn: {
    label: 'Pawn',
    role: 'Arrow outpost. Fast single shots at short range.',
    soldier: 'peasant',
    hp: 56,
    range: 3.2,
    rangeGrow: 0.35,
    damage: 3,
    attackTicks: 8,
    style: 'arrow',
    splash: 0,
    pierce: 1,
    controlTicks: 0,
    bounty: 10,
    upgrade: 18,
  },
  knight: {
    label: 'Knight',
    role: 'Stable keep. A close cleave that roots soldiers in place.',
    soldier: 'knight',
    hp: 96,
    range: 3.3,
    rangeGrow: 0.25,
    damage: 6,
    attackTicks: 16,
    style: 'cleave',
    splash: 2.15,
    pierce: 1,
    controlTicks: 8,
    bounty: 16,
    upgrade: 26,
  },
  bishop: {
    label: 'Bishop',
    role: 'Arcane spire. Long bolts that pierce and slow.',
    soldier: 'archer',
    hp: 64,
    range: 6.4,
    rangeGrow: 0.4,
    damage: 4,
    attackTicks: 14,
    style: 'pierce',
    splash: 0,
    pierce: 2,
    controlTicks: 12,
    bounty: 14,
    upgrade: 26,
  },
  rook: {
    label: 'Rook',
    role: 'Cannon fortress. Slow shells with a heavy splash.',
    soldier: 'cannon',
    hp: 120,
    range: 5.4,
    rangeGrow: 0.35,
    damage: 9,
    attackTicks: 22,
    style: 'splash',
    splash: 1.45,
    pierce: 1,
    controlTicks: 0,
    bounty: 22,
    upgrade: 34,
  },
  queen: {
    label: 'Queen',
    role: 'Mage citadel. Area magic, and the anchor for Blessing, Heal, and Blast.',
    soldier: 'mage',
    hp: 100,
    range: 4.6,
    rangeGrow: 0.3,
    damage: 5,
    attackTicks: 16,
    style: 'nova',
    splash: 1.7,
    pierce: 1,
    controlTicks: 0,
    bounty: 26,
    upgrade: 40,
  },
  king: {
    label: 'King',
    role: 'Crowned keep. High life, a modest shot, and a damage aura for nearby towers.',
    soldier: 'guard',
    hp: 720,
    range: 3,
    rangeGrow: 0.25,
    damage: 4,
    attackTicks: 12,
    style: 'keep',
    splash: 0,
    pierce: 1,
    controlTicks: 0,
    bounty: 0,
    upgrade: 30,
  },
};

export interface CombatStats {
  range: number;
  damage: number;
  attackTicks: number;
  splash: number;
  pierce: number;
  controlTicks: number;
  soldierScale: number;
  /** Damage multiplier this king grants to friendly towers within 2 squares. */
  aura: number;
  maxHp: number;
}

/** Level is 1, 2, or 3. Each step adds damage, a little range, and tougher soldiers. */
export function combatOf(kind: PieceKind, level: number): CombatStats {
  const def = PIECES[kind];
  const step = Math.max(0, Math.min(2, level - 1));
  return {
    range: def.range + def.rangeGrow * step,
    damage: Math.max(1, Math.round(def.damage * (1 + 0.25 * step))),
    attackTicks: Math.max(4, def.attackTicks - step),
    splash: def.splash + (def.style === 'cleave' ? def.rangeGrow * step : 0),
    pierce: def.pierce + (def.style === 'pierce' ? step : 0),
    controlTicks: def.controlTicks + (def.controlTicks > 0 ? step * 2 : 0),
    soldierScale: 1 + 0.12 * step,
    aura: def.style === 'keep' ? 0.12 + 0.08 * step : 0,
    maxHp: Math.round(def.hp * (1 + 0.3 * step)),
  };
}

export function upgradeCost(kind: PieceKind, level: number): number {
  const base = PIECES[kind].upgrade;
  return level <= 1 ? base : Math.round(base * 1.6);
}

/**
 * Soldiers chip the King instead of deleting it.
 * A full hit on any other tower is unchanged. One leaker wounds the keep.
 */
export const KING_LEAK = 0.15;

export function leakDamage(kind: PieceKind, amount: number): number {
  if (kind !== 'king') return amount;
  return Math.max(1, Math.round(amount * KING_LEAK));
}

/** Gold to restore a wounded tower, and how long before it can be repaired again. */
export const REPAIR = {
  /** 8 seconds. Stops a player from mending on every hit of a wave. */
  ticks: 80,
  perHp: 0.12,
  minimum: 4,
};

export function repairCost(missing: number): number {
  if (missing <= 0) return 0;
  return Math.max(REPAIR.minimum, Math.ceil(missing * REPAIR.perHp));
}

/**
 * Level-3 gold sink. A healthy tower can still spend.
 * Damage and fire rate rise, and soldiers spawned during the boost are stronger.
 */
export const OVERCHARGE = {
  /** First purchase on a tower. Each later purchase on that same tower costs more. */
  baseCost: 36,
  stepCost: 28,
  /** 8 seconds of boosted fire. */
  duration: 80,
  /** 30 seconds from the purchase before it can be bought again. */
  cooldown: 300,
  damage: 1.5,
  /** Attack cooldown multiplier. Lower is faster. */
  haste: 0.7,
  soldier: 1.35,
};

/** 36, then 64, then 92, and so on. A missing count is a first purchase. */
export function overchargeCost(uses: number | undefined): number {
  const paid = Number.isFinite(uses) ? Math.max(0, Math.floor(uses ?? 0)) : 0;
  return OVERCHARGE.baseCost + paid * OVERCHARGE.stepCost;
}

export function overcharged(until: number, tick: number): boolean {
  return until > tick;
}

/** Soldier stats. Every unit has strength, life, speed, plus range and an attack cooldown. */
export const SOLDIERS: Record<SoldierKind, SoldierDef> = {
  peasant: { label: 'Peasant', strength: 5, hp: 24, speed: 2.2, range: 1, attackTicks: 8, bounty: 3 },
  knight: { label: 'Knight', strength: 11, hp: 40, speed: 3.2, range: 1, attackTicks: 9, bounty: 7 },
  archer: { label: 'Archer', strength: 7, hp: 22, speed: 2.0, range: 4, attackTicks: 10, bounty: 5 },
  cannon: { label: 'Iron Cannon', strength: 12, hp: 32, speed: 1.1, range: 5, attackTicks: 16, bounty: 9 },
  mage: { label: 'Mage', strength: 8, hp: 26, speed: 1.8, range: 3, attackTicks: 11, bounty: 8 },
  guard: { label: 'Royal Guard', strength: 12, hp: 54, speed: 1.5, range: 1, attackTicks: 8, bounty: 10 },
};

/**
 * Queen spells. All three are centered on the living Queen.
 * Blessing and blast measure radius in army cells. Heal measures it in chess squares.
 */
export const SPELLS: Record<SpellId, SpellDef> = {
  blessing: {
    label: 'Blessing',
    mana: 24,
    radius: 5,
    durationTicks: 60,
    strength: 4,
    speed: 1.35,
    heal: 6,
    damage: 0,
    towerDamage: 0,
    summary: 'Nearby friendly soldiers gain strength, speed, and a little life for 6 seconds.',
  },
  heal: {
    label: 'Heal',
    mana: 28,
    radius: 2,
    durationTicks: 8,
    strength: 0,
    speed: 1,
    heal: 30,
    damage: 0,
    towerDamage: 0,
    summary: 'Restores 30 life to friendly towers within 2 chess squares.',
  },
  blast: {
    label: 'Blast',
    mana: 36,
    radius: 6,
    durationTicks: 8,
    strength: 0,
    speed: 1,
    heal: 0,
    damage: 16,
    towerDamage: 10,
    summary: 'Deals 16 damage to enemy soldiers within 6 cells, and 10 to enemy towers within 2 squares.',
  },
};

export const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] as const;

export function squareName(file: number, rank: number): string {
  return `${FILES[file] ?? '?'}${rank + 1}`;
}

export function otherSide(side: Side): Side {
  return side === 'white' ? 'black' : 'white';
}

/**
 * Discrete waves. The match opens with a build phase, then every living tower
 * releases its soldiers at once. Later waves send more of them, with more life
 * and strength. Nothing spawns between launches.
 */
export const WAVES = {
  /** Ticks of building before wave 1. 18 seconds. */
  firstWaveTick: 180,
  /** Ticks from one launch to the next. 15 seconds. */
  gapTicks: 150,
  /** Most soldiers one side may have on the board. */
  soldierCap: 40,
  unitsForWave(wave: number): number {
    if (wave <= 2) return 1;
    if (wave <= 4) return 2;
    return 3;
  },
  /** Life and strength multiplier. Wave 1 is 1. Each later wave adds 15%. */
  statScale(wave: number): number {
    return 1 + Math.max(0, wave - 1) * 0.15;
  },
};

/**
 * Player walls. y 0 is White's back rank, drawn at the bottom.
 * Each side builds on the two chess ranks in front of its towers.
 * The army row on each side of the midline stays empty, and every
 * other build row keeps at least one open cell.
 * Soldiers can break a wall, so a maze only stalls.
 */
export const BLOCKS = {
  cost: 12,
  hp: 28,
  /** Gold returned when the owner picks the wall back up. */
  refund: 6,
  /**
   * Living walls one side may own. 36 is four open lanes on each of the
   * three build rows (columns 1, 5, 9, and 13). That is the minimum cover
   * of every pawn's melee ring, repeated on the rows behind it.
   * A full-width zigzag with one gap per row cuts every route. This cap
   * is the even lane, and `extraSteps` rejects a longer maze even sooner.
   */
  max: 36,
  /**
   * Most steps a maze may add to the open-board route from any living
   * tower to any enemy tower's attack ring. The 36-wall lane adds 7.
   */
  extraSteps: 8,
  /**
   * Army rows of the two front ranks. White ranks 3–4 are y 4–7.
   * Black ranks 5–6 are y 8–11. The center rows below are inside
   * this span and are not buildable.
   */
  zoneRows: {
    white: [4, 5, 6, 7],
    black: [8, 9, 10, 11],
  } as Record<Side, readonly number[]>,
  /** One 16-cell row on each side of the midline. Never a wall. */
  centerRows: [7, 8] as readonly number[],
};

export function isCenterRow(y: number): boolean {
  return BLOCKS.centerRows.includes(y);
}

/** Rows a side may actually place on: its two front ranks, minus the center. */
export function buildableRows(side: Side): number[] {
  return BLOCKS.zoneRows[side].filter((y) => !isCenterRow(y));
}

export function inBuildZone(side: Side, y: number): boolean {
  return BLOCKS.zoneRows[side].includes(y);
}

/**
 * After five minutes the kings are exposed. Soldier hits on a King use the
 * higher leak, and hits on every other tower are multiplied. Mirrors were
 * still marching at eight minutes with both kings healthy.
 */
export const SUDDEN = {
  tick: 3000,
  /** A full hit. The 15% leak is what made a stalled king last for minutes. */
  leak: 1,
  tower: 2,
};

/** How often the AI considers an upgrade, a wall, a repair, or a spell, in ticks. */
export const AI_PERIOD: Record<'easy' | 'normal' | 'hard', number> = {
  easy: 50,
  normal: 25,
  hard: 12,
};
