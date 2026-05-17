// server/src/sockets/socketAuth.js
import jwt from "jsonwebtoken";
import User from "../models/User.model.js";

// Runs as Socket.io middleware on every new connection
// Rejects the WS handshake if the token is missing or invalid
export const socketAuth = async (socket, next) => {
  try {
    // Client sends token in handshake auth: { token: "Bearer ..." }
    const token = socket.handshake.auth?.token?.replace("Bearer ", "")
      || socket.handshake.headers?.authorization?.replace("Bearer ", "");

    if (!token) return next(new Error("SOCKET_UNAUTHORIZED"));

    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const user = await User.findById(decoded._id).select("username role profilePicture isActive");

    if (!user || !user.isActive) return next(new Error("SOCKET_UNAUTHORIZED"));

    socket.user = user; // attach to socket — available in all handlers
    next();
  } catch {
    next(new Error("SOCKET_TOKEN_EXPIRED"));
  }
};