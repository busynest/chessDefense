import { towerAt } from './chess.js';
import { controlsSide, playAim, playBlock, playOvercharge, playRepair, playSpell, playUnblock, playUpgrade, selectSquare } from './game_state.js';
import { sendCommand, signedInUid } from './online.js';
import { store } from '../store.js';
import type { PlayerCommand, Side, SpellId } from './types.js';

/** Tap a tower to inspect it. Towers do not move. */
export function handleSquare(file: number, rank: number): void {
  const slice = store.getState().game;
  const game = slice.game;
  if (game.status !== 'playing') return;
  const tower = towerAt(game, file, rank);
  if (tower) store.dispatch(selectSquare({ file, rank }));
  else store.dispatch(selectSquare(null));
}

/** Mark an enemy tower for the next wave. file < 0 clears the mark back to the King. */
export function handleAim(side: Side, file: number, rank: number): void {
  const slice = store.getState().game;
  if (!controlsSide(slice, side)) return;
  const command: PlayerCommand = { type: 'target', side, file, rank };
  if (slice.role === 'guest') {
    const uid = signedInUid();
    if (uid) void sendCommand(slice.onlineCode, uid, command);
    return;
  }
  store.dispatch(playAim({ side, file, rank }));
}

export function handleUpgrade(side: Side, file: number, rank: number): void {
  const slice = store.getState().game;
  if (!controlsSide(slice, side)) return;
  const command: PlayerCommand = { type: 'upgrade', side, file, rank };
  if (slice.role === 'guest') {
    const uid = signedInUid();
    if (uid) void sendCommand(slice.onlineCode, uid, command);
    return;
  }
  store.dispatch(playUpgrade({ side, file, rank }));
}

export function handleRepair(side: Side, file: number, rank: number): void {
  const slice = store.getState().game;
  if (!controlsSide(slice, side)) return;
  const command: PlayerCommand = { type: 'repair', side, file, rank };
  if (slice.role === 'guest') {
    const uid = signedInUid();
    if (uid) void sendCommand(slice.onlineCode, uid, command);
    return;
  }
  store.dispatch(playRepair({ side, file, rank }));
}

export function handleOvercharge(side: Side, file: number, rank: number): void {
  const slice = store.getState().game;
  if (!controlsSide(slice, side)) return;
  const command: PlayerCommand = { type: 'overcharge', side, file, rank };
  if (slice.role === 'guest') {
    const uid = signedInUid();
    if (uid) void sendCommand(slice.onlineCode, uid, command);
    return;
  }
  store.dispatch(playOvercharge({ side, file, rank }));
}

export function handleSpell(side: Side, spell: SpellId): void {
  const slice = store.getState().game;
  if (!controlsSide(slice, side)) return;
  const command: PlayerCommand = { type: 'spell', side, spell };
  if (slice.role === 'guest') {
    const uid = signedInUid();
    if (uid) void sendCommand(slice.onlineCode, uid, command);
    return;
  }
  store.dispatch(playSpell({ side, spell }));
}

export function handleCell(x: number, y: number): void {
  const slice = store.getState().game;
  const side = slice.placing;
  if (!side || slice.game.status !== 'playing' || !controlsSide(slice, side)) return;
  const own = slice.game.blocks.some((block) => block.x === x && block.y === y && block.hp > 0 && block.side === side);
  const command: PlayerCommand = own ? { type: 'unblock', side, x, y } : { type: 'block', side, x, y };
  if (slice.role === 'guest') {
    const uid = signedInUid();
    if (uid) void sendCommand(slice.onlineCode, uid, command);
    return;
  }
  if (own) store.dispatch(playUnblock({ side, x, y }));
  else store.dispatch(playBlock({ side, x, y }));
}
