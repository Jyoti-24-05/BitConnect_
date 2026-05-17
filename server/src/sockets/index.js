// server/src/sockets/index.js
import { Server } from "socket.io";
import { socketAuth } from "./socketAuth.js";
import { registerNotifHandlers } from "./handlers/notif.handler.js";
import { registerRsvpHandlers }  from "./handlers/rsvp.handler.js";

// SOCKET_EVENTS — single source of truth, imported by both server and client
export const SOCKET_EVENTS = {
  // Connection
  JOIN_USER_ROOM:  "join:user",
  JOIN_EVENT_ROOM: "join:event",
  LEAVE_EVENT_ROOM: "leave:event",
  // Notifications
  NEW_NOTIFICATION:    "notification:new",
  MARK_NOTIF_READ:     "notification:read",
  // Events / RSVP
  RSVP_UPDATED:    "rsvp:updated",
  EVENT_UPDATED:   "event:updated",
  // Feed
  NEW_POST:        "feed:new_post",
  POST_LIKED:      "feed:post_liked",
  // Presence
  USER_ONLINE:     "presence:online",
  USER_OFFLINE:    "presence:offline",
};

let io; // singleton — exported for use in controllers

export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin:      process.env.CLIENT_URL,
      methods:     ["GET", "POST"],
      credentials: true,
    },
    // Tune for your hosting tier
    pingTimeout:  60000,
    pingInterval: 25000,
  });

  // ── Global auth middleware ─────────────────────────────────────────────────
  io.use(socketAuth);

  // ── On connection ──────────────────────────────────────────────────────────
  io.on("connection", (socket) => {
    const { _id, username, role } = socket.user;
    console.log(`[WS] ${username} (${role}) connected — socket ${socket.id}`);

    // Auto-join personal room — used to push notifications to one user
    socket.join(`user:${_id}`);

    // Register domain-specific event handlers
    registerNotifHandlers(io, socket);
    registerRsvpHandlers(io, socket);

    // Broadcast presence to followers (can be scoped if needed)
    socket.broadcast.emit(SOCKET_EVENTS.USER_ONLINE, { userId: _id, username });

    socket.on("disconnect", (reason) => {
      console.log(`[WS] ${username} disconnected — ${reason}`);
      socket.broadcast.emit(SOCKET_EVENTS.USER_OFFLINE, { userId: _id });
    });
  });

  return io;
};

// Exported so controllers can push real-time events without importing io directly
export const getIO = () => {
  if (!io) throw new Error("Socket.io not initialised — call initSocket() first");
  return io;
};