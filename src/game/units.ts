import type { PieceKind, Side, SoldierKind, SpellId } from './types.js';

/** One simulation step. 10 steps is one second. */
export const TICK_SECONDS = 0.1;

/**
 * Shared economy. Gold pays for tower moves. Mana pays for Queen spells.
 * Both sides receive the same income. Caps keep a stalled match readable.
 */
export const ECONOMY = {
  goldPerTick: 1,
  manaPerTick: 0.5,
  startingGold: 36,
  startingMana: 18,
  goldCap: 400,
  manaCap: 160,
  waveEveryTicks: 200,
  waveCooldownFactor: 0.88,
  minCooldownFactor: 0.4,
};

export interface PieceDef {
  label: string;
  soldier: SoldierKind;
  hp: number;
  moveCost: number;
  moveTicks: number;
  spawnTicks: number;
  auraRange: number;
  auraDamage: number;
  auraTicks: number;
  bounty: number;
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
 * Tower stats. The piece kind chooses the soldier it builds.
 * Queen builds a mage and is the only caster. King builds a guard.
 * Move cooldowns are several seconds, so the chess layer stays deliberate.
 */
export const PIECES: Record<PieceKind, PieceDef> = {
  pawn: {
    label: 'Pawn',
    soldier: 'peasant',
    hp: 48,
    moveCost: 8,
    moveTicks: 40,
    spawnTicks: 36,
    auraRange: 2,
    auraDamage: 3,
    auraTicks: 12,
    bounty: 12,
  },
  knight: {
    label: 'Knight',
    soldier: 'knight',
    hp: 80,
    moveCost: 18,
    moveTicks: 50,
    spawnTicks: 70,
    auraRange: 1,
    auraDamage: 8,
    auraTicks: 14,
    bounty: 20,
  },
  bishop: {
    label: 'Bishop',
    soldier: 'archer',
    hp: 55,
    moveCost: 16,
    moveTicks: 50,
    spawnTicks: 48,
    auraRange: 4,
    auraDamage: 5,
    auraTicks: 12,
    bounty: 18,
  },
  rook: {
    label: 'Rook',
    soldier: 'cannon',
    hp: 100,
    moveCost: 24,
    moveTicks: 70,
    spawnTicks: 90,
    auraRange: 5,
    auraDamage: 12,
    auraTicks: 16,
    bounty: 28,
  },
  queen: {
    label: 'Queen',
    soldier: 'mage',
    hp: 90,
    moveCost: 30,
    moveTicks: 80,
    spawnTicks: 110,
    auraRange: 4,
    auraDamage: 8,
    auraTicks: 14,
    bounty: 36,
  },
  king: {
    label: 'King',
    soldier: 'guard',
    hp: 140,
    moveCost: 20,
    moveTicks: 60,
    spawnTicks: 130,
    auraRange: 2,
    auraDamage: 9,
    auraTicks: 12,
    bounty: 0,
  },
};

/** Soldier stats. Every unit has strength, life, speed, plus range and an attack cooldown. */
export const SOLDIERS: Record<SoldierKind, SoldierDef> = {
  peasant: { label: 'Peasant', strength: 5, hp: 16, speed: 2.2, range: 1, attackTicks: 8, bounty: 3 },
  knight: { label: 'Knight', strength: 12, hp: 34, speed: 3.4, range: 1, attackTicks: 9, bounty: 7 },
  archer: { label: 'Archer', strength: 8, hp: 16, speed: 2.0, range: 4, attackTicks: 10, bounty: 5 },
  cannon: { label: 'Iron Cannon', strength: 18, hp: 26, speed: 1.0, range: 6, attackTicks: 16, bounty: 9 },
  mage: { label: 'Mage', strength: 9, hp: 20, speed: 1.8, range: 3, attackTicks: 11, bounty: 8 },
  guard: { label: 'Royal Guard', strength: 14, hp: 46, speed: 1.5, range: 1, attackTicks: 8, bounty: 10 },
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
    radius: 4,
    durationTicks: 8,
    strength: 0,
    speed: 1,
    heal: 0,
    damage: 16,
    towerDamage: 10,
    summary: 'Deals 16 damage to enemy soldiers within 4 cells, and 10 to enemy towers within 2 squares.',
  },
};

export const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] as const;

export function squareName(file: number, rank: number): string {
  return `${FILES[file] ?? '?'}${rank + 1}`;
}

export function otherSide(side: Side): Side {
  return side === 'white' ? 'black' : 'white';
}

export function waveScale(wave: number): number {
  const factor = Math.pow(ECONOMY.waveCooldownFactor, Math.max(0, wave - 1));
  return Math.max(ECONOMY.minCooldownFactor, factor);
}

/** How often the AI considers a move or a spell, in ticks. */
export const AI_PERIOD: Record<'easy' | 'normal' | 'hard', number> = {
  easy: 50,
  normal: 25,
  hard: 12,
};
