import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { PwaUser } from 'pwa-auth';

export type AccountUser = PwaUser;

export interface UserState {
  current: AccountUser | null;
}

const initialState: UserState = {
  current: null,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<AccountUser | null>) {
      state.current = action.payload;
    },
  },
});

export const { setUser } = userSlice.actions;
export const userReducer = userSlice.reducer;
