// client/src/store/slices/authSlice.js
import { createSlice } from "@reduxjs/toolkit";

const authSlice = createSlice({
  name: "auth",
  initialState: { user: null, accessToken: null },
  reducers: {
    setCredentials: (state, { payload }) => {
      state.user        = payload.user;
      state.accessToken = payload.accessToken;
      window.__accessToken__ = payload.accessToken;
    },
    clearCredentials: (state) => {
      state.user        = null;
      state.accessToken = null;
      window.__accessToken__ = null;
    },
    updateUser: (state, { payload }) => {
      state.user = { ...state.user, ...payload };
    },
  },
});

export const { setCredentials, clearCredentials, updateUser } = authSlice.actions;
export default authSlice.reducer;

// Selectors
export const selectCurrentUser  = (state) => state.auth.user;
export const selectAccessToken  = (state) => state.auth.accessToken;
export const selectIsLoggedIn   = (state) => !!state.auth.user;
export const selectIsAdmin      = (state) => state.auth.user?.role === "admin";