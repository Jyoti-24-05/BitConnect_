// client/src/api/notifApi.js
import axiosInstance from "./axiosInstance";

export const notifApi = {
  getNotifications: (params)   => axiosInstance.get("/notifications", { params }),
  getUnreadCount:   ()         => axiosInstance.get("/notifications/unread-count"),
  markAsRead:       (notifId)  => axiosInstance.patch(`/notifications/${notifId}/read`),
  markAllAsRead:    ()         => axiosInstance.patch("/notifications/read-all"),
  deleteNotif:      (notifId)  => axiosInstance.delete(`/notifications/${notifId}`),
};