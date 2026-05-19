// client/src/api/postApi.js
import axiosInstance from "./axiosInstance";

export const postApi = {
  getFeed:           (params)           => axiosInstance.get("/posts", { params }),
  getTrending:       (params)           => axiosInstance.get("/posts/trending", { params }),
  searchPosts:       (params)           => axiosInstance.get("/posts/search", { params }),
  getPost:           (postId)           => axiosInstance.get(`/posts/${postId}`),
  getPostsByUser:    (userId, params)   => axiosInstance.get(`/posts/user/${userId}`, { params }),
  createPost:        (data)             => axiosInstance.post("/posts", data, {
    headers: { "Content-Type": "multipart/form-data" },
  }),
  updatePost:        (postId, data)     => axiosInstance.patch(`/posts/${postId}`, data),
  deletePost:        (postId)           => axiosInstance.delete(`/posts/${postId}`),
  toggleLike:        (postId)           => axiosInstance.post(`/posts/${postId}/like`),
  toggleBookmark:    (postId)           => axiosInstance.post(`/posts/${postId}/bookmark`),
  addComment:        (postId, data)     => axiosInstance.post(`/posts/${postId}/comments`, data),
  deleteComment:     (postId, commentId) => axiosInstance.delete(`/posts/${postId}/comments/${commentId}`),
  toggleCommentLike: (postId, commentId) => axiosInstance.post(`/posts/${postId}/comments/${commentId}/like`),
};