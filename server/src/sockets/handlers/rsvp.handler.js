// server/src/sockets/handlers/rsvp.handler.js
import Event from "../../models/Event.model.js";
import { SOCKET_EVENTS } from "../index.js";
import { pushNotification } from "./notif.handler.js";

export const registerRsvpHandlers = (io, socket) => {

  // Client joins an event's room to receive live RSVP count updates
  socket.on(SOCKET_EVENTS.JOIN_EVENT_ROOM, (eventId) => {
    socket.join(`event:${eventId}`);
  });

  socket.on(SOCKET_EVENTS.LEAVE_EVENT_ROOM, (eventId) => {
    socket.leave(`event:${eventId}`);
  });
};

// Called from the event controller after a successful RSVP
// Broadcasts updated count to everyone watching that event
export const broadcastRsvpUpdate = async (io, { eventId, rsvpCount, spotsRemaining, userId, action }) => {
  io.to(`event:${eventId}`).emit(SOCKET_EVENTS.RSVP_UPDATED, {
    eventId,
    rsvpCount,
    spotsRemaining,
    userId,
    action, // "added" | "removed" | "updated"
  });
};