import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import type { Difficulty, Personality } from '../game/types.js';

export type TeamPalette = 'classic' | 'bright';

export interface PrefsState {
  difficulty: Difficulty;
  /** Computer style. Separate from Easy, Normal, and Hard. */
  opponent: Personality;
  muted: boolean;
  /** 0 to 1. */
  volume: number;
  seenTutorial: boolean;
  /** High-contrast team colors plus the circle and diamond marks. */
  palette: TeamPalette;
  /** Optional drone. Off until the player turns it on. */
  music: boolean;
}

const KEY = 'chessdefense-prefs';

const defaults: PrefsState = {
  difficulty: 'normal',
  opponent: 'fortress',
  muted: false,
  volume: 0.5,
  seenTutorial: false,
  palette: 'classic',
  music: false,
};

function load(): PrefsState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw) as Partial<PrefsState>;
    const difficulty = parsed.difficulty === 'easy' || parsed.difficulty === 'hard' || parsed.difficulty === 'normal'
      ? parsed.difficulty
      : defaults.difficulty;
    const opponent = parsed.opponent === 'rusher' || parsed.opponent === 'fortress' || parsed.opponent === 'tactician'
      ? parsed.opponent
      : defaults.opponent;
    const volume = typeof parsed.volume === 'number' ? Math.min(1, Math.max(0, parsed.volume)) : defaults.volume;
    return {
      difficulty,
      opponent,
      muted: parsed.muted === true,
      volume,
      seenTutorial: parsed.seenTutorial === true,
      palette: parsed.palette === 'bright' ? 'bright' : 'classic',
      music: parsed.music === true,
    };
  } catch {
    return defaults;
  }
}

export function savePrefs(prefs: PrefsState): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(prefs));
  } catch {
    /* private mode */
  }
}

const prefsSlice = createSlice({
  name: 'prefs',
  initialState: load(),
  reducers: {
    setDifficulty(state, action: PayloadAction<Difficulty>) {
      state.difficulty = action.payload;
    },
    setOpponent(state, action: PayloadAction<Personality>) {
      state.opponent = action.payload;
    },
    setMuted(state, action: PayloadAction<boolean>) {
      state.muted = action.payload;
    },
    setVolume(state, action: PayloadAction<number>) {
      state.volume = Math.min(1, Math.max(0, action.payload));
    },
    markTutorial(state) {
      state.seenTutorial = true;
    },
    setPalette(state, action: PayloadAction<TeamPalette>) {
      state.palette = action.payload;
    },
    setMusic(state, action: PayloadAction<boolean>) {
      state.music = action.payload;
    },
  },
});

export const { setDifficulty, setOpponent, setMuted, setVolume, markTutorial, setPalette, setMusic } = prefsSlice.actions;
export const prefsReducer = prefsSlice.reducer;
