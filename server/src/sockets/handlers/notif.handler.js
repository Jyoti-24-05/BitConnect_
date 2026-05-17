// server/src/sockets/handlers/notif.handler.js
import Notification from "../../models/Notification.model.js";
import { SOCKET_EVENTS } from "../index.js";

export const registerNotifHandlers = (io, socket) => {
  const userId = socket.user._id;

  // Client marks a notification read
  socket.on(SOCKET_EVENTS.MARK_NOTIF_READ, async (notifId) => {
    try {
      await Notification.findOneAndUpdate(
        { _id: notifId, recipient: userId },
        { isRead: true }
      );
      // Acknowledge back to only this socket
      socket.emit("notification:read:ack", { notifId, success: true });
    } catch (err) {
      socket.emit("error", { message: "Failed to mark notification" });
    }
  });
};

// Called from controllers to push a notification to a specific user
// Usage: await pushNotification({ recipient, type, message, refId, refModel })
export const pushNotification = async (io, { recipient, type, message, refId, refModel }) => {
  const notif = await Notification.create({ recipient, type, message, refId, refModel });

  // Emit to that user's personal room — works even if they have multiple tabs open
  io.to(`user:${recipient}`).emit(SOCKET_EVENTS.NEW_NOTIFICATION, {
    _id:     notif._id,
    type,
    message,
    refId,
    refModel,
    createdAt: notif.createdAt,
  });

  return notif;
};