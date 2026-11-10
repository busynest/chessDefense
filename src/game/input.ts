import { legalMoves, towerAt } from './chess.js';
import { controlsSide, playBlock, playMove, playSpell, playUnblock, selectSquare } from './game_state.js';
import { sendCommand, signedInUid } from './online.js';
import { store } from '../store.js';
import type { PlayerCommand, Side, SpellId } from './types.js';

export function handleSquare(file: number, rank: number): void {
  const slice = store.getState().game;
  const game = slice.game;
  if (game.status !== 'playing') return;
  const selected = slice.selected;
  const selectedTower = selected ? towerAt(game, selected.file, selected.rank) : undefined;
  if (selected && selectedTower && controlsSide(slice, selectedTower.side)) {
    const legal = legalMoves(game, selectedTower).some((square) => square.file === file && square.rank === rank);
    if (legal) {
      const command: PlayerCommand = {
        type: 'move',
        side: selectedTower.side,
        fromFile: selected.file,
        fromRank: selected.rank,
        toFile: file,
        toRank: rank,
      };
      if (slice.role === 'guest') {
        const uid = signedInUid();
        if (uid) void sendCommand(slice.onlineCode, uid, command);
        store.dispatch(selectSquare(null));
        return;
      }
      store.dispatch(playMove({ from: selected, to: { file, rank }, side: selectedTower.side }));
      return;
    }
  }
  const tower = towerAt(game, file, rank);
  if (tower && controlsSide(slice, tower.side)) store.dispatch(selectSquare({ file, rank }));
  else store.dispatch(selectSquare(null));
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
