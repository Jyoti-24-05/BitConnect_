// server/src/models/Notification.model.js
import mongoose from "mongoose";

// All notification types in one place — import this wherever needed
export const NOTIFICATION_TYPES = {
  // Post engagement
  POST_LIKED:       "post_liked",
  POST_COMMENTED:   "post_commented",
  POST_SHARED:      "post_shared",
  COMMENT_LIKED:    "comment_liked",
  COMMENT_REPLIED:  "comment_replied",
  // Social
  FOLLOW_REQUEST:   "follow_request",
  NEW_FOLLOWER:     "new_follower",
  FOLLOW_ACCEPTED:  "follow_accepted",
  // Events
  EVENT_CREATED:    "event_created",     // club posted a new event
  EVENT_REMINDER:   "event_reminder",    // 24h before event
  EVENT_UPDATED:    "event_updated",
  EVENT_CANCELLED:  "event_cancelled",
  RSVP_CONFIRMED:   "rsvp_confirmed",
  RSVP_WAITLISTED:  "rsvp_waitlisted",
  // Club
  CLUB_JOIN_REQUEST: "club_join_request",
  CLUB_REQUEST_APPROVED: "club_request_approved",
  CLUB_REQUEST_REJECTED: "club_request_rejected",
  CLUB_ROLE_UPDATED:     "club_role_updated",
  // System
  WELCOME:          "welcome",
  ACCOUNT_WARNING:  "account_warning",
  POST_APPROVED:    "post_approved",
};

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      "User",
      required: true,
    },
    sender: {
      // Null for system notifications
      type: mongoose.Schema.Types.ObjectId,
      ref:  "User",
    },
    type: {
      type:     String,
      enum:     Object.values(NOTIFICATION_TYPES),
      required: true,
    },
    message: {
      type:     String,
      required: true,
      trim:     true,
      maxlength: 300,
    },
    // Polymorphic reference — points to the relevant document
    ref: {
      refId:    { type: mongoose.Schema.Types.ObjectId },
      refModel: {
        type: String,
        enum: ["Post", "Event", "Club", "User", "Comment"],
      },
    },
    isRead:   { type: Boolean, default: false },
    readAt:   { type: Date },

    // For bulk/batch notifications (e.g. event reminders via cron)
    isBulk:   { type: Boolean, default: false },
  },
  {
    timestamps: true,
    toJSON:   { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
// Most common query: get all unread notifications for a user, newest first
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
// Used by cron job cleanup — delete old read notifications
notificationSchema.index({ isRead: 1, createdAt: 1 });
// Prevent duplicate notifications (e.g. same user liking twice)
notificationSchema.index(
  { recipient: 1, sender: 1, type: 1, "ref.refId": 1 },
  { unique: true, sparse: true }   // sparse — allows null sender (system notifs)
);

// ─── Virtuals ─────────────────────────────────────────────────────────────────
notificationSchema.virtual("isExpired").get(function () {
  // Notifications older than 30 days are considered expired
  const thirtyDays = 30 * 24 * 60 * 60 * 1000;
  return Date.now() - this.createdAt.getTime() > thirtyDays;
});

// ─── Pre-save ─────────────────────────────────────────────────────────────────
notificationSchema.pre("save", function (next) {
  if (this.isModified("isRead") && this.isRead && !this.readAt) {
    this.readAt = new Date();
  }
  next();
});

// ─── Static methods ───────────────────────────────────────────────────────────

// Get paginated notifications for a user
notificationSchema.statics.getForUser = function (
  userId,
  { limit = 20, cursor, unreadOnly = false } = {}
) {
  const filter = {
    recipient: userId,
    ...(unreadOnly && { isRead: false }),
    ...(cursor && { createdAt: { $lt: new Date(cursor) } }),
  };
  return this.find(filter)
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate("sender", "username profilePicture")
    .lean();
};

// Mark all as read for a user in one DB hit
notificationSchema.statics.markAllRead = function (userId) {
  return this.updateMany(
    { recipient: userId, isRead: false },
    { $set: { isRead: true, readAt: new Date() } }
  );
};

// Unread count — used for the notification bell badge
notificationSchema.statics.getUnreadCount = function (userId) {
  return this.countDocuments({ recipient: userId, isRead: false });
};

// Cron job target — delete read notifications older than 30 days
notificationSchema.statics.cleanupOld = function () {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  return this.deleteMany({ isRead: true, createdAt: { $lt: thirtyDaysAgo } });
};

// Create + deduplicate in one call — safe to call multiple times
notificationSchema.statics.createSafe = async function (data) {
  try {
    return await this.create(data);
  } catch (err) {
    // Duplicate key = notification already exists — silently ignore
    if (err.code === 11000) return null;
    throw err;
  }
};

// ─── Export ───────────────────────────────────────────────────────────────────
const Notification = mongoose.model("Notification", notificationSchema);
export default Notification;