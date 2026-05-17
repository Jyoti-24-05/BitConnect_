// server/src/controllers/notification.controller.js
import * as NotifService  from "../services/notification.service.js";
import { ApiResponse }    from "../utils/ApiResponse.js";
import { catchAsync }     from "../utils/catchAsync.js";

// ─── GET /api/v1/notifications ────────────────────────────────────────────────
export const getNotifications = catchAsync(async (req, res) => {
  const { cursor, limit, unreadOnly } = req.query;

  const result = await NotifService.getNotifications(req.user._id, {
    cursor,
    limit:      limit      ? parseInt(limit, 10)      : 20,
    unreadOnly: unreadOnly ? unreadOnly === "true"    : false,
  });

  res.status(200).json(new ApiResponse(200, result, "Notifications fetched"));
});

// ─── GET /api/v1/notifications/unread-count ───────────────────────────────────
export const getUnreadCount = catchAsync(async (req, res) => {
  const result = await NotifService.getUnreadCount(req.user._id);
  res.status(200).json(new ApiResponse(200, result, "Unread count fetched"));
});

// ─── PATCH /api/v1/notifications/:notifId/read ───────────────────────────────
export const markAsRead = catchAsync(async (req, res) => {
  const notif = await NotifService.markAsRead(
    req.params.notifId,
    req.user._id
  );

  res.status(200).json(new ApiResponse(200, notif, "Notification marked as read"));
});

// ─── PATCH /api/v1/notifications/read-all ────────────────────────────────────
export const markAllAsRead = catchAsync(async (req, res) => {
  const result = await NotifService.markAllAsRead(req.user._id);
  res.status(200).json(new ApiResponse(200, result, "All notifications marked as read"));
});

// ─── DELETE /api/v1/notifications/:notifId ───────────────────────────────────
export const deleteNotification = catchAsync(async (req, res) => {
  const result = await NotifService.deleteNotification(
    req.params.notifId,
    req.user._id
  );

  res.status(200).json(new ApiResponse(200, result, result.message));
});