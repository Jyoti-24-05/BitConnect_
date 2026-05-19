// client/src/store/index.js
import { configureStore } from "@reduxjs/toolkit";
import authReducer        from "./slices/authSlice";
import postReducer        from "./slices/postSlice";
import eventReducer       from "./slices/eventSlice";
import notifReducer       from "./slices/notifSlice";

export const store = configureStore({
  reducer: {
    auth:   authReducer,
    posts:  postReducer,
    events: eventReducer,
    notifs: notifReducer,
  },
  devTools: import.meta.env.DEV,
});