// server/src/services/notification.service.js
import Notification   from "../models/Notification.model.js";
import { ApiError }   from "../utils/ApiError.js";

// ─── Get notifications for current user ───────────────────────────────────────
export const getNotifications = async (userId, { cursor, limit = 20, unreadOnly = false } = {}) => {
  const notifications = await Notification.getForUser(userId, {
    limit,
    cursor,
    unreadOnly,
  });

  const unreadCount = await Notification.getUnreadCount(userId);

  const nextCursor = notifications.length === limit
    ? notifications[notifications.length - 1].createdAt.toISOString()
    : null;

  return { notifications, unreadCount, nextCursor, hasMore: !!nextCursor };
};

// ─── Mark single notification as read ────────────────────────────────────────
export const markAsRead = async (notifId, userId) => {
  const notif = await Notification.findOneAndUpdate(
    { _id: notifId, recipient: userId }, // scoped to user — prevents other users marking yours
    { $set: { isRead: true, readAt: new Date() } },
    { new: true }
  );

  if (!notif) throw new ApiError(404, "Notification not found");
  return notif;
};

// ─── Mark all as read ─────────────────────────────────────────────────────────
export const markAllAsRead = async (userId) => {
  const result = await Notification.markAllRead(userId);
  return { modifiedCount: result.modifiedCount };
};

// ─── Delete single notification ───────────────────────────────────────────────
export const deleteNotification = async (notifId, userId) => {
  const notif = await Notification.findOneAndDelete({
    _id:       notifId,
    recipient: userId, // users can only delete their own
  });

  if (!notif) throw new ApiError(404, "Notification not found");
  return { message: "Notification deleted" };
};

// ─── Get unread count only (for polling fallback) ─────────────────────────────
export const getUnreadCount = async (userId) => {
  const count = await Notification.getUnreadCount(userId);
  return { unreadCount: count };
};