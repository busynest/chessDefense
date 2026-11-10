import { createSlice, current, type PayloadAction } from '@reduxjs/toolkit';

import { tryAim, tryOvercharge, tryPlaceBlock, tryRemoveBlock, tryRepair, trySpell, tryUpgrade } from './commands.js';
import { createMatch, createMenu } from './setup.js';
import { step } from './simulate.js';
import type { Difficulty, GameState, Side, SpellId, Square } from './types.js';
import type { LinkPhase } from './link.js';

export interface GameSliceState {
  game: GameState;
  selected: Square | null;
  placing: Side | null;
  role: 'none' | 'host' | 'guest';
  onlineCode: string;
  onlineNote: string;
  record: 'idle' | 'saved' | 'error' | 'skipped';
  /** Live, waiting on a dropped peer, or that peer's time ran out. */
  link: LinkPhase;
}

const initialState: GameSliceState = {
  game: createMenu(),
  selected: null,
  placing: null,
  role: 'none',
  onlineCode: '',
  onlineNote: '',
  record: 'idle',
  link: 'live',
};

const gameSlice = createSlice({
  name: 'game',
  initialState,
  reducers: {
    showMenu(state) {
      state.game = createMenu();
      state.selected = null;
      state.placing = null;
      state.role = 'none';
      state.onlineCode = '';
      state.onlineNote = '';
      state.record = 'idle';
      state.link = 'live';
    },
    startLocal(state, action: PayloadAction<{ mode: 'ai' | 'local'; difficulty: Difficulty; seed: number }>) {
      state.game = createMatch({
        mode: action.payload.mode,
        difficulty: action.payload.difficulty,
        seed: action.payload.seed,
        humanSide: 'white',
      });
      state.selected = null;
      state.placing = null;
      state.role = 'none';
      state.onlineCode = '';
      state.onlineNote = '';
      state.record = 'idle';
      state.link = 'live';
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
      state.placing = null;
      state.record = 'idle';
      state.link = 'live';
    },
    resumeOnline(state, action: PayloadAction<{ role: 'host' | 'guest'; code: string; snapshot: GameState }>) {
      state.game = action.payload.snapshot;
      state.role = action.payload.role;
      state.onlineCode = action.payload.code;
      state.onlineNote = 'Match live.';
      state.selected = null;
      state.placing = null;
      state.link = 'live';
    },
    setLink(state, action: PayloadAction<LinkPhase>) {
      state.link = action.payload;
    },
    setHoldAi(state, action: PayloadAction<boolean>) {
      state.game.holdAi = action.payload;
    },
    setPlacing(state, action: PayloadAction<Side | null>) {
      state.placing = action.payload;
      state.selected = null;
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
    playUpgrade(state, action: PayloadAction<{ file: number; rank: number; side: Side }>) {
      const result = tryUpgrade(current(state.game), action.payload.side, action.payload.file, action.payload.rank);
      if (!result.ok) {
        state.game.banner = { text: result.reason, until: state.game.tick + 30 };
        return;
      }
      state.game = result.state;
    },
    playRepair(state, action: PayloadAction<{ file: number; rank: number; side: Side }>) {
      const result = tryRepair(current(state.game), action.payload.side, action.payload.file, action.payload.rank);
      if (!result.ok) {
        state.game.banner = { text: result.reason, until: state.game.tick + 30 };
        return;
      }
      state.game = result.state;
    },
    playOvercharge(state, action: PayloadAction<{ file: number; rank: number; side: Side }>) {
      const result = tryOvercharge(current(state.game), action.payload.side, action.payload.file, action.payload.rank);
      if (!result.ok) {
        state.game.banner = { text: result.reason, until: state.game.tick + 30 };
        return;
      }
      state.game = result.state;
    },
    playSpell(state, action: PayloadAction<{ side: Side; spell: SpellId }>) {
      const result = trySpell(current(state.game), action.payload.side, action.payload.spell);
      if (!result.ok) {
        state.game.banner = { text: result.reason, until: state.game.tick + 30 };
        return;
      }
      state.game = result.state;
    },
    playBlock(state, action: PayloadAction<{ side: Side; x: number; y: number }>) {
      const result = tryPlaceBlock(current(state.game), action.payload.side, action.payload.x, action.payload.y);
      if (!result.ok) {
        state.game.banner = { text: result.reason, until: state.game.tick + 35 };
        return;
      }
      state.game = result.state;
    },
    playAim(state, action: PayloadAction<{ side: Side; file: number; rank: number }>) {
      const result = tryAim(current(state.game), action.payload.side, action.payload.file, action.payload.rank);
      if (!result.ok) {
        state.game.banner = { text: result.reason, until: state.game.tick + 30 };
        return;
      }
      state.game = result.state;
    },
    playUnblock(state, action: PayloadAction<{ side: Side; x: number; y: number }>) {
      const result = tryRemoveBlock(current(state.game), action.payload.side, action.payload.x, action.payload.y);
      if (!result.ok) {
        state.game.banner = { text: result.reason, until: state.game.tick + 35 };
        return;
      }
      state.game = result.state;
    },
    tick(state) {
      if (state.role === 'guest') return;
      if (state.link === 'reconnecting') return;
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
  resumeOnline,
  setLink,
  setHoldAi,
  applySnapshot,
  togglePause,
  selectSquare,
  playUpgrade,
  playRepair,
  playOvercharge,
  playSpell,
  playBlock,
  playUnblock,
  playAim,
  setPlacing,
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
