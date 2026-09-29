import {
  createSlice,
  type PayloadAction,
} from '@reduxjs/toolkit';

import {
  saveAuth,
  clearAuth,
} from './authStorage';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isInitialized: false,
};

const authSlice = createSlice({
  name: 'auth',

  initialState,

  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{
        user: AuthUser;
        accessToken: string;
      }>,
    ) => {
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.isAuthenticated = true;

      saveAuth(action.payload);
    },

    initializeAuth: (
      state,
      action: PayloadAction<{
        user: AuthUser;
        accessToken: string;
      } | null>,
    ) => {
      if (action.payload) {
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.isAuthenticated = true;
      }

      state.isInitialized = true;
    },

    logout: (state) => {
      state.user = null;
      state.accessToken = null;
      state.isAuthenticated = false;
      state.isInitialized = true;

      clearAuth();
    },
  },
});

export const {
  setCredentials,
  initializeAuth,
  logout,
} = authSlice.actions;

export default authSlice.reducer;