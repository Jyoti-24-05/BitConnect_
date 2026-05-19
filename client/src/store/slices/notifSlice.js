// client/src/store/slices/notifSlice.js
import { createSlice } from "@reduxjs/toolkit";

const notifSlice = createSlice({
  name: "notifs",
  initialState: {
    list:        [],
    unreadCount: 0,
    cursor:      null,
    hasMore:     true,
  },
  reducers: {
    setNotifications: (state, { payload }) => {
      state.list        = payload.notifications;
      state.unreadCount = payload.unreadCount;
      state.cursor      = payload.nextCursor;
      state.hasMore     = payload.hasMore;
    },
    prependNotif: (state, { payload }) => {
      state.list.unshift(payload);
      state.unreadCount += 1;
    },
    markRead: (state, { payload: notifId }) => {
      const notif = state.list.find((n) => n._id === notifId);
      if (notif && !notif.isRead) {
        notif.isRead   = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },
    markAllRead: (state) => {
      state.list.forEach((n) => (n.isRead = true));
      state.unreadCount = 0;
    },
    removeNotif: (state, { payload: notifId }) => {
      const notif = state.list.find((n) => n._id === notifId);
      if (notif && !notif.isRead)
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      state.list = state.list.filter((n) => n._id !== notifId);
    },
    setUnreadCount: (state, { payload }) => {
      state.unreadCount = payload;
    },
  },
});

export const {
  setNotifications, prependNotif,
  markRead, markAllRead, removeNotif, setUnreadCount,
} = notifSlice.actions;
export default notifSlice.reducer;