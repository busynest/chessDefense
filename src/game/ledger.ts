import type { GameState, Ledger, PieceKind, Side, SoldierKind, SpellId } from './types.js';
import type { Harm } from './telemetry.js';

export function emptyLedger(): Ledger {
  return {
    tower: {},
    soldier: {},
    walls: { white: 0, black: 0 },
    spells: {
      white: { blessing: 0, heal: 0, blast: 0 },
      black: { blessing: 0, heal: 0, blast: 0 },
    },
  };
}

export function ensureLedger(state: GameState): Ledger {
  if (!state.ledger) state.ledger = emptyLedger();
  return state.ledger;
}

export function addHarm(ledger: Ledger, harm: Harm): void {
  if (harm.amount <= 0) return;
  if (harm.source === 'tower') {
    const kind = harm.kind as PieceKind;
    ledger.tower[kind] = (ledger.tower[kind] ?? 0) + harm.amount;
  } else if (harm.source === 'soldier') {
    const kind = harm.kind as SoldierKind;
    ledger.soldier[kind] = (ledger.soldier[kind] ?? 0) + harm.amount;
  }
}

export function noteWall(state: GameState, side: Side): void {
  ensureLedger(state).walls[side] += 1;
}

export function noteSpell(state: GameState, side: Side, spell: SpellId): void {
  ensureLedger(state).spells[side][spell] += 1;
}
