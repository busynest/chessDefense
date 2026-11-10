import { createSlice, current, type PayloadAction } from '@reduxjs/toolkit';

import { tryMove, trySpell } from './commands.js';
import { createMatch, createMenu } from './setup.js';
import { step } from './simulate.js';
import type { Difficulty, GameState, Side, SpellId, Square } from './types.js';

export interface GameSliceState {
  game: GameState;
  selected: Square | null;
  role: 'none' | 'host' | 'guest';
  onlineCode: string;
  onlineNote: string;
  record: 'idle' | 'saved' | 'error' | 'skipped';
}

const initialState: GameSliceState = {
  game: createMenu(),
  selected: null,
  role: 'none',
  onlineCode: '',
  onlineNote: '',
  record: 'idle',
};

const gameSlice = createSlice({
  name: 'game',
  initialState,
  reducers: {
    showMenu(state) {
      state.game = createMenu();
      state.selected = null;
      state.role = 'none';
      state.onlineCode = '';
      state.onlineNote = '';
      state.record = 'idle';
    },
    startLocal(state, action: PayloadAction<{ mode: 'ai' | 'local'; difficulty: Difficulty; seed: number }>) {
      state.game = createMatch({
        mode: action.payload.mode,
        difficulty: action.payload.difficulty,
        seed: action.payload.seed,
        humanSide: 'white',
      });
      state.selected = null;
      state.role = 'none';
      state.onlineCode = '';
      state.onlineNote = '';
      state.record = 'idle';
    },
    beginOnline(state, action: PayloadAction<{ seed: number; role: 'host' | 'guest'; code: string }>) {
      const match = createMatch({
        mode: 'online',
        difficulty: 'normal',
        seed: action.payload.seed,
        humanSide: action.payload.role === 'host' ? 'white' : 'black',
      });
      match.status = 'lobby';
      state.game = match;
      state.role = action.payload.role;
      state.onlineCode = action.payload.code;
      state.onlineNote = action.payload.role === 'host' ? 'Waiting for an opponent.' : 'Waiting for the host.';
      state.selected = null;
      state.record = 'idle';
    },
    setOnlineNote(state, action: PayloadAction<string>) {
      state.onlineNote = action.payload;
    },
    openOnline(state) {
      if (state.game.status === 'lobby') state.game.status = 'playing';
      state.onlineNote = 'Match live.';
    },
    applySnapshot(state, action: PayloadAction<GameState>) {
      state.game = action.payload;
    },
    togglePause(state) {
      if (state.game.status === 'playing') state.game.status = 'paused';
      else if (state.game.status === 'paused') state.game.status = 'playing';
    },
    selectSquare(state, action: PayloadAction<Square | null>) {
      state.selected = action.payload;
    },
    playMove(state, action: PayloadAction<{ from: Square; to: Square; side: Side }>) {
      const result = tryMove(current(state.game), action.payload.from, action.payload.to, action.payload.side);
      if (!result.ok) {
        state.onlineNote = result.reason;
        return;
      }
      state.game = result.state;
      state.selected = null;
    },
    playSpell(state, action: PayloadAction<{ side: Side; spell: SpellId }>) {
      const result = trySpell(current(state.game), action.payload.side, action.payload.spell);
      if (!result.ok) {
        state.onlineNote = result.reason;
        return;
      }
      state.game = result.state;
    },
    tick(state) {
      if (state.role === 'guest') return;
      if (state.game.status !== 'playing') return;
      state.game = step(current(state.game));
    },
    markRecord(state, action: PayloadAction<GameSliceState['record']>) {
      state.record = action.payload;
    },
  },
});

export const {
  showMenu,
  startLocal,
  beginOnline,
  setOnlineNote,
  openOnline,
  applySnapshot,
  togglePause,
  selectSquare,
  playMove,
  playSpell,
  tick,
  markRecord,
} = gameSlice.actions;

export const gameReducer = gameSlice.reducer;

export function controlsSide(slice: GameSliceState, side: Side): boolean {
  const status = slice.game.status;
  if (status !== 'playing') return false;
  if (slice.game.mode === 'ai') return side === slice.game.humanSide;
  if (slice.game.mode === 'local') return true;
  if (slice.role === 'host') return side === 'white';
  if (slice.role === 'guest') return side === 'black';
  return false;
}

export function playerSide(slice: GameSliceState): Side | null {
  if (slice.game.mode === 'local') return null;
  if (slice.game.mode === 'ai') return slice.game.humanSide;
  if (slice.role === 'guest') return 'black';
  if (slice.role === 'host') return 'white';
  return slice.game.humanSide;
}
