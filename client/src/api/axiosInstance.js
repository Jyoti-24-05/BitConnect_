// client/src/api/axiosInstance.js
import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api/v1";

const axiosInstance = axios.create({
  baseURL:         BASE_URL,
  withCredentials: true,
  timeout:         15000,
  // ← NO default Content-Type here — set it dynamically below
});

// ── Request interceptor ───────────────────────────────────────────────────────
axiosInstance.interceptors.request.use(
  (config) => {
    const token = window.__accessToken__;
    if (token) config.headers.Authorization = `Bearer ${token}`;

    // FormData: let browser set Content-Type with the correct boundary
    // Everything else: JSON
    if (config.data instanceof FormData) {
      // Explicitly delete to prevent any inherited header from interfering
      delete config.headers["Content-Type"];
      delete config.headers.common?.["Content-Type"];
      delete config.headers.post?.["Content-Type"];
    } else {
      config.headers["Content-Type"] = "application/json";
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor ──────────────────────────────────────────────────────
const SKIP_REFRESH = ["/auth/refresh", "/auth/login", "/auth/register", "/auth/logout"];

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
      SKIP_REFRESH.some((u) => url.includes(u));

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