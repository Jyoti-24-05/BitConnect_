// client/src/api/authApi.js
import axiosInstance from "./axiosInstance";

export const authApi = {
  register:       (data) => axiosInstance.post("/auth/register", data),
  login:          (data) => axiosInstance.post("/auth/login", data),
  logout:         ()     => axiosInstance.post("/auth/logout"),
  refresh:        ()     => axiosInstance.post("/auth/refresh"),
  getMe:          ()     => axiosInstance.get("/auth/me"),
  forgotPassword: (data) => axiosInstance.post("/auth/forgot-password", data),
  resetPassword:  (data) => axiosInstance.post("/auth/reset-password", data),
  changePassword: (data) => axiosInstance.patch("/auth/change-password", data),

  // No Content-Type — Axios handles FormData automatically
  updateProfile:  (data) => axiosInstance.patch("/auth/profile", data),
};