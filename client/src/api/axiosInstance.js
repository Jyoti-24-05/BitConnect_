// client/src/api/axiosInstance.js
import axios from "axios";
import { API_BASE_URL } from "@/utils/constants";

const axiosInstance = axios.create({
  baseURL:         API_BASE_URL,
  withCredentials: true,          // send httpOnly refresh token cookie
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
});

// ─── Request interceptor — attach access token ────────────────────────────────
axiosInstance.interceptors.request.use(
  (config) => {
    // Read token from memory — never localStorage (XSS risk)
    const token = window.__accessToken__;
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response interceptor — silent token refresh on 401 ──────────────────────
let isRefreshing     = false;
let failedQueue      = []; // queued requests while refresh is in flight

const processQueue = (error, token = null) => {
  failedQueue.forEach(({ resolve, reject }) =>
    error ? reject(error) : resolve(token)
  );
  failedQueue = [];
};

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    // Only handle 401 — and only once per request (_retry flag prevents loops)
    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      // Queue this request until the refresh completes
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((token) => {
        original.headers.Authorization = `Bearer ${token}`;
        return axiosInstance(original);
      });
    }

    original._retry  = true;
    isRefreshing     = true;

    try {
      // Cookie is sent automatically — no body needed
      const { data } = await axios.post(
        `${API_BASE_URL}/auth/refresh`,
        {},
        { withCredentials: true }
      );

      const newToken          = data.data.accessToken;
      window.__accessToken__  = newToken;

      processQueue(null, newToken);
      original.headers.Authorization = `Bearer ${newToken}`;
      return axiosInstance(original);
    } catch (refreshError) {
      processQueue(refreshError, null);
      // Refresh failed — clear token and redirect to login
      window.__accessToken__ = null;
      window.location.href   = "/login";
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default axiosInstance;