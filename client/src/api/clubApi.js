// client/src/api/clubApi.js
import axiosInstance from "./axiosInstance";

export const clubApi = {
  discoverClubs:     (params)                   => axiosInstance.get("/clubs", { params }),
  searchClubs:       (params)                   => axiosInstance.get("/clubs/search", { params }),
  getClub:           (slug)                     => axiosInstance.get(`/clubs/${slug}`),
  createClub:        (data)                     => axiosInstance.post("/clubs", data, {
    headers: { "Content-Type": "multipart/form-data" },
  }),
  updateClub:        (clubId, data)             => axiosInstance.patch(`/clubs/${clubId}`, data),
  joinClub:          (clubId, data)             => axiosInstance.post(`/clubs/${clubId}/join`, data),
  leaveClub:         (clubId)                   => axiosInstance.post(`/clubs/${clubId}/leave`),
  handleJoinRequest: (clubId, userId, data)     => axiosInstance.patch(`/clubs/${clubId}/requests/${userId}`, data),
  updateMemberRole:  (clubId, userId, data)     => axiosInstance.patch(`/clubs/${clubId}/members/${userId}/role`, data),
};