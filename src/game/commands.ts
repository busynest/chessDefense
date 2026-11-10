import { legalMoves, towerAt } from './chess.js';
import { chebyshev } from './pathing.js';
import type { GameState, Side, SpellId, Square } from './types.js';
import { ECONOMY, PIECES, SOLDIERS, SPELLS, squareName } from './units.js';

export interface MoveResult {
  state: GameState;
  ok: boolean;
  reason: string;
}

function fresh(state: GameState): GameState {
  return structuredClone(state);
}

function nextId(state: GameState): string {
  state.nextId += 1;
  return `u${state.nextId}`;
}

function banner(state: GameState, text: string): void {
  state.banner = { text, until: state.tick + 30 };
}

/**
 * Move a tower if the destination is a legal chess move, the cooldown is ready,
 * and that side can pay the gold cost. Landing on an enemy tower captures it.
 * Capturing the king ends the match.
 */
export function tryMove(input: GameState, from: Square, to: Square, side?: Side): MoveResult {
  if (input.status !== 'playing') return { state: input, ok: false, reason: 'The match is not running.' };
  const mover = towerAt(input, from.file, from.rank);
  if (!mover) return { state: input, ok: false, reason: 'No tower there.' };
  if (side && mover.side !== side) return { state: input, ok: false, reason: 'That is not your tower.' };
  const def = PIECES[mover.kind];
  if (input.tick < mover.moveReadyTick) return { state: input, ok: false, reason: 'That tower is still walking.' };
  if (input.gold[mover.side] < def.moveCost) return { state: input, ok: false, reason: 'Not enough gold.' };
  const allowed = legalMoves(input, mover).some((square) => square.file === to.file && square.rank === to.rank);
  if (!allowed) return { state: input, ok: false, reason: 'Illegal chess move.' };

  const state = fresh(input);
  const piece = towerAt(state, from.file, from.rank)!;
  const victim = towerAt(state, to.file, to.rank);
  state.gold[piece.side] = Math.max(0, state.gold[piece.side] - def.moveCost);
  piece.file = to.file;
  piece.rank = to.rank;
  piece.moveReadyTick = state.tick + def.moveTicks;
  const captured = victim ? PIECES[victim.kind].label : '';
  if (victim) {
    victim.hp = 0;
    victim.hurtBy = piece.side;
  }
  sweepDead(state);
  resolveKings(state);
  if (state.status === 'playing') {
    banner(
      state,
      captured
        ? `${label(piece.side)} ${def.label} captures the ${captured} on ${squareName(to.file, to.rank)}.`
        : `${label(piece.side)} ${def.label} moves to ${squareName(to.file, to.rank)}.`,
    );
  }
  return { state, ok: true, reason: '' };
}

/**
 * Cast one Queen spell. The Queen has to be alive, and the mana is spent up front.
 * Blessing buffs nearby friendly soldiers. Heal restores nearby friendly towers.
 * Blast damages nearby enemies. All three are centered on the Queen.
 */
export function trySpell(input: GameState, side: Side, spell: SpellId): MoveResult {
  if (input.status !== 'playing') return { state: input, ok: false, reason: 'The match is not running.' };
  const queen = input.towers.find((tower) => tower.side === side && tower.kind === 'queen' && tower.hp > 0);
  if (!queen) return { state: input, ok: false, reason: 'Your Queen has fallen.' };
  const def = SPELLS[spell];
  if (input.mana[side] < def.mana) return { state: input, ok: false, reason: 'Not enough mana.' };

  const state = fresh(input);
  const caster = state.towers.find((tower) => tower.side === side && tower.kind === 'queen' && tower.hp > 0)!;
  state.mana[side] -= def.mana;
  const cx = caster.file * 2 + 0.5;
  const cy = caster.rank * 2 + 0.5;
  if (spell === 'blessing') {
    for (const soldier of state.soldiers) {
      if (soldier.side !== side || soldier.hp <= 0) continue;
      if (chebyshev(soldier.x, soldier.y, cx, cy) > def.radius) continue;
      soldier.buffStr = def.strength;
      soldier.buffSpeed = def.speed;
      soldier.buffUntil = state.tick + def.durationTicks;
      soldier.hp = Math.min(soldier.maxHp, soldier.hp + def.heal);
    }
  } else if (spell === 'heal') {
    for (const tower of state.towers) {
      if (tower.side !== side || tower.hp <= 0) continue;
      const distance = Math.max(Math.abs(tower.file - caster.file), Math.abs(tower.rank - caster.rank));
      if (distance > def.radius) continue;
      tower.hp = Math.min(tower.maxHp, tower.hp + def.heal);
    }
  } else {
    for (const soldier of state.soldiers) {
      if (soldier.side === side || soldier.hp <= 0) continue;
      if (chebyshev(soldier.x, soldier.y, cx, cy) > def.radius) continue;
      soldier.hp -= def.damage;
      soldier.hurtBy = side;
    }
    for (const tower of state.towers) {
      if (tower.side === side || tower.hp <= 0) continue;
      const distance = Math.max(Math.abs(tower.file - caster.file), Math.abs(tower.rank - caster.rank));
      if (distance > 2) continue;
      tower.hp -= def.towerDamage;
      tower.hurtBy = side;
    }
  }
  state.effects.push({
    id: nextId(state),
    side,
    spell,
    file: caster.file,
    rank: caster.rank,
    until: state.tick + def.durationTicks,
    radius: def.radius,
  });
  if (state.status === 'playing') banner(state, `${label(side)} Queen casts ${def.label}.`);
  sweepDead(state);
  resolveKings(state);
  return { state, ok: true, reason: '' };
}

export function sweepDead(state: GameState): void {
  for (const soldier of state.soldiers) {
    if (soldier.hp > 0 || !soldier.hurtBy) continue;
    const bounty = SOLDIERS[soldier.kind].bounty;
    state.gold[soldier.hurtBy] = Math.min(ECONOMY.goldCap, state.gold[soldier.hurtBy] + bounty);
  }
  state.soldiers = state.soldiers.filter((soldier) => soldier.hp > 0);
  for (const tower of state.towers) {
    if (tower.hp > 0 || !tower.hurtBy || tower.kind === 'king') continue;
    state.gold[tower.hurtBy] = Math.min(ECONOMY.goldCap, state.gold[tower.hurtBy] + PIECES[tower.kind].bounty);
  }
  state.towers = state.towers.filter((tower) => tower.hp > 0);
}

export function resolveKings(state: GameState): void {
  const white = state.towers.some((tower) => tower.side === 'white' && tower.kind === 'king' && tower.hp > 0);
  const black = state.towers.some((tower) => tower.side === 'black' && tower.kind === 'king' && tower.hp > 0);
  if (white && black) return;
  if (!white && !black) finish(state, 'draw');
  else finish(state, white ? 'white' : 'black');
}

export function finish(state: GameState, winner: Side | 'draw'): void {
  state.status = 'victory';
  state.winner = winner;
  state.banner = {
    text: winner === 'draw' ? 'Both kings have fallen. Draw.' : `${label(winner)} wins.`,
    until: state.tick + 99999,
  };
}

export function label(side: Side): string {
  return side === 'white' ? 'White' : 'Black';
}
