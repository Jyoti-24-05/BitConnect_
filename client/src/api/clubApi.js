// client/src/api/clubApi.js
import axiosInstance from "./axiosInstance";

export const clubApi = {
  getMyClubs:        ()                        => axiosInstance.get("/clubs/me"),
  discoverClubs:     (params)                 => axiosInstance.get("/clubs", { params }),
  searchClubs:       (params)                 => axiosInstance.get("/clubs/search", { params }),
  getClub:           (slug)                   => axiosInstance.get(`/clubs/${slug}`),

  // No Content-Type header — Axios auto-sets multipart/form-data + boundary for FormData
  createClub:        (data)                   => axiosInstance.post("/clubs", data),
  updateClub:        (clubId, data)           => axiosInstance.patch(`/clubs/${clubId}`, data),

  joinClub:          (clubId, data)           => axiosInstance.post(`/clubs/${clubId}/join`, data),
  leaveClub:         (clubId)                 => axiosInstance.post(`/clubs/${clubId}/leave`),
  handleJoinRequest: (clubId, userId, data)   => axiosInstance.patch(`/clubs/${clubId}/requests/${userId}`, data),
  updateMemberRole:  (clubId, userId, data)   => axiosInstance.patch(`/clubs/${clubId}/members/${userId}/role`, data),
};