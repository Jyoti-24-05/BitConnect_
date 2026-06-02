// server/src/models/Message.model.js
import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    conversation: {
      // Canonical conversation ID — always sorted smallest _id first
      // e.g. "userId1_userId2" where userId1 < userId2 lexicographically
      type:     String,
      required: true,
      index:    true,
    },
    sender: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      "User",
      required: true,
    },
    recipient: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      "User",
      required: true,
    },
    text: {
      type:      String,
      required:  true,
      trim:      true,
      maxlength: 2000,
    },
    isRead: { type: Boolean, default: false },
    readAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

messageSchema.index({ conversation: 1, createdAt: -1 });
messageSchema.index({ recipient: 1, isRead: 1 });

// Helper to build a stable conversation ID from two user IDs
messageSchema.statics.conversationId = (idA, idB) => {
  const a = idA.toString();
  const b = idB.toString();
  return a < b ? `${a}_${b}` : `${b}_${a}`;
};

const Message = mongoose.model("Message", messageSchema);
export default Message;