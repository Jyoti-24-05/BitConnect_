// server/src/sockets/handlers/message.handler.js
import Message  from "../../models/Message.model.js";
import User     from "../../models/User.model.js";
import { SOCKET_EVENTS } from "../index.js";

export const registerMessageHandlers = (io, socket) => {
  const senderId = socket.user._id;

  // Client emits message:send → { recipientId, text }
  socket.on(SOCKET_EVENTS.MESSAGE_SEND, async ({ recipientId, text }) => {
    try {
      if (!recipientId || !text?.trim()) return;

      // Enforce mutual follow
      const [me, recipient] = await Promise.all([
        User.findById(senderId).select("following followers username"),
        User.findById(recipientId).select("following followers"),
      ]);

      if (!me || !recipient) return socket.emit("error", { message: "User not found" });

      const iFollow      = me.following.map(String).includes(recipientId.toString());
      const theyFollowMe = recipient.following.map(String).includes(senderId.toString());

      if (!iFollow || !theyFollowMe) {
        return socket.emit("error", { message: "You can only message mutual followers" });
      }

      const convoId = Message.conversationId(senderId, recipientId);

      const message = await Message.create({
        conversation: convoId,
        sender:       senderId,
        recipient:    recipientId,
        text:         text.trim(),
      });

      const payload = {
        _id:          message._id,
        conversation: convoId,
        sender:       { _id: senderId, username: me.username },
        recipient:    recipientId,
        text:         message.text,
        isRead:       false,
        createdAt:    message.createdAt,
      };

      // Deliver to recipient if online
      io.to(`user:${recipientId}`).emit(SOCKET_EVENTS.MESSAGE_RECEIVE, payload);

      // Confirm back to sender
      socket.emit(SOCKET_EVENTS.MESSAGE_RECEIVE, payload);

    } catch (err) {
      console.error("[message.handler] send error:", err.message);
      socket.emit("error", { message: "Failed to send message" });
    }
  });
};