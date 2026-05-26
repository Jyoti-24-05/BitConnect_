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
export const pushNotification = async (io, {
  recipient, sender, type, message, ref,
}) => {
  try {
    // Convert to string — ObjectId.toString() gives the 24-char hex string
    const recipientId = recipient?.toString() ?? recipient;

    const notif = await Notification.createSafe({
      recipient: recipientId,
      sender:    sender?.toString() ?? null,
      type,
      message,
      ref: ref ?? {},
    });

    if (!notif) return null; // duplicate — already exists

    // recipientId MUST be a string for the room name to match
    io.to(`user:${recipientId}`).emit(SOCKET_EVENTS.NEW_NOTIFICATION, {
      _id:       notif._id,
      type,
      message,
      ref,
      createdAt: notif.createdAt,
    });

    return notif;
  } catch (err) {
    console.error("[pushNotification] failed:", err.message);
    return null;
  }
};