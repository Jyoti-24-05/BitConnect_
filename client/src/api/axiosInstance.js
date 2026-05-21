// client/src/api/axiosInstance.js
import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api/v1";

const axiosInstance = axios.create({
  baseURL:         BASE_URL,
  withCredentials: true,
  headers:         { "Content-Type": "application/json" },
  timeout:         15000,
});

// Attach token to every request
axiosInstance.interceptors.request.use(
  (config) => {
    const token = window.__accessToken__;
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// These URLs must never trigger a refresh retry
const SKIP_REFRESH_URLS = [
  "/auth/refresh",
  "/auth/login",
  "/auth/register",
  "/auth/logout",
];

let isRefreshing = false;
let failedQueue  = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(({ resolve, reject }) =>
    error ? reject(error) : resolve(token)
  );
  failedQueue = [];
};

axiosInstance.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    const url      = original?.url ?? "";

    const shouldSkip =
      error.response?.status !== 401 ||
      original._retry ||
      SKIP_REFRESH_URLS.some((u) => url.includes(u));

    if (shouldSkip) return Promise.reject(error);

    if (isRefreshing) {
      return new Promise((resolve, reject) =>
        failedQueue.push({ resolve, reject })
      ).then((token) => {
        original.headers.Authorization = `Bearer ${token}`;
        return axiosInstance(original);
      });
    }

    original._retry = true;
    isRefreshing    = true;

    try {
      const { data }         = await axios.post(
        `${BASE_URL}/auth/refresh`,
        {},
        { withCredentials: true }
      );
      const newToken         = data.data.accessToken;
      window.__accessToken__ = newToken;
      processQueue(null, newToken);
      original.headers.Authorization = `Bearer ${newToken}`;
      return axiosInstance(original);
    } catch (err) {
      processQueue(err, null);
      window.__accessToken__ = null;
      const onAuthPage =
        window.location.pathname.startsWith("/login") ||
        window.location.pathname.startsWith("/register");
      if (!onAuthPage) window.location.href = "/login";
      return Promise.reject(err);
    } finally {
      isRefreshing = false;
    }
  }
);

export default axiosInstance;