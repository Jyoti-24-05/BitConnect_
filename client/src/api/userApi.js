// client/src/api/userApi.js
import axiosInstance from "./axiosInstance";

export const userApi = {
  getProfile:          (username)    => axiosInstance.get(`/users/${username}`),
  getFollowers:        (userId)      => axiosInstance.get(`/users/${userId}/followers`),
  getFollowing:        (userId)      => axiosInstance.get(`/users/${userId}/following`),
  toggleFollow:        (userId)      => axiosInstance.post(`/users/${userId}/follow`),
  getFollowRequests:   ()            => axiosInstance.get("/users/me/follow-requests"),
  acceptFollowRequest: (requesterId) => axiosInstance.post(`/users/follow-requests/${requesterId}/accept`),
  rejectFollowRequest: (requesterId) => axiosInstance.post(`/users/follow-requests/${requesterId}/reject`),
  getBookmarks:        ()            => axiosInstance.get("/users/me/bookmarks"),
  getConversations:    ()            => axiosInstance.get("/users/me/conversations"),
  getMessages:         (userId, params) => axiosInstance.get(`/users/messages/${userId}`, { params }),
};