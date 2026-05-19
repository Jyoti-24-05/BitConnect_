// client/src/store/slices/eventSlice.js
import { createSlice } from "@reduxjs/toolkit";

const eventSlice = createSlice({
  name: "events",
  initialState: {
    list:    [],
    cursor:  null,
    hasMore: true,
  },
  reducers: {
    setEvents: (state, { payload }) => {
      state.list    = payload.events;
      state.cursor  = payload.nextCursor;
      state.hasMore = payload.hasMore;
    },
    appendEvents: (state, { payload }) => {
      const ids     = new Set(state.list.map((e) => e._id));
      const newOnes = payload.events.filter((e) => !ids.has(e._id));
      state.list    = [...state.list, ...newOnes];
      state.cursor  = payload.nextCursor;
      state.hasMore = payload.hasMore;
    },
    updateRsvpCount: (state, { payload: { eventId, rsvpCount, spotsRemaining } }) => {
      const event = state.list.find((e) => e._id === eventId);
      if (event) {
        event.rsvpCount      = rsvpCount;
        event.spotsRemaining = spotsRemaining;
      }
    },
    removeEvent: (state, { payload: eventId }) => {
      state.list = state.list.filter((e) => e._id !== eventId);
    },
  },
});

export const { setEvents, appendEvents, updateRsvpCount, removeEvent } = eventSlice.actions;
export default eventSlice.reducer;