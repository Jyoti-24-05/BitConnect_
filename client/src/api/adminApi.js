// client/src/api/adminApi.js
import axiosInstance from "./axiosInstance";

export const adminApi = {
  getStats:      (params)           => axiosInstance.get("/admin/stats", { params }),
  getUsers:      (params)           => axiosInstance.get("/admin/users", { params }),
  updateUser:    (userId, data)     => axiosInstance.patch(`/admin/users/${userId}`, data),
  deleteUser:    (userId)           => axiosInstance.delete(`/admin/users/${userId}`),
  getPendingEvents: ()              => axiosInstance.get("/admin/events", { params: { approved: false } }),
  approveEvent:  (eventId, approve) => axiosInstance.patch(`/admin/events/${eventId}/approve`, { approve }),
  getPosts:      ()                 => axiosInstance.get("/admin/posts"),
  deletePost:    (postId)           => axiosInstance.delete(`/admin/posts/${postId}`),
  verifyClub:    (clubId)           => axiosInstance.patch(`/admin/clubs/${clubId}/verify`),
};