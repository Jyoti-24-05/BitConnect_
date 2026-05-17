// server/src/controllers/auth.controller.js
import * as AuthService from "../services/auth.service.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { catchAsync }   from "../utils/catchAsync.js";

// ─── Cookie config (reused across login + refresh) ────────────────────────────
const COOKIE_OPTIONS = {
  httpOnly: true,       // JS cannot read it — XSS protection
  secure:   process.env.NODE_ENV === "production", // HTTPS only in prod
  sameSite: "strict",   // CSRF protection
  maxAge:   7 * 24 * 60 * 60 * 1000, // 7 days in ms
};

// ─── POST /api/v1/auth/register ───────────────────────────────────────────────
export const register = catchAsync(async (req, res) => {
  const { username, email, password, role } = req.body;
  const user = await AuthService.registerUser({ username, email, password, role });

  res.status(201).json(
    new ApiResponse(201, user, "Account created successfully")
  );
});

// ─── POST /api/v1/auth/login ──────────────────────────────────────────────────
export const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  const { user, accessToken, refreshToken } = await AuthService.loginUser({ email, password });

  res
    .status(200)
    .cookie("refreshToken", refreshToken, COOKIE_OPTIONS)
    .json(
      new ApiResponse(200, { user, accessToken }, "Login successful")
    );
});

// ─── POST /api/v1/auth/refresh ────────────────────────────────────────────────
export const refresh = catchAsync(async (req, res) => {
  // Refresh token comes from httpOnly cookie — never from body
  const incomingRefreshToken = req.cookies?.refreshToken;
  const { accessToken, refreshToken } = await AuthService.refreshAccessToken(incomingRefreshToken);

  res
    .status(200)
    .cookie("refreshToken", refreshToken, COOKIE_OPTIONS) // rotate cookie too
    .json(
      new ApiResponse(200, { accessToken }, "Token refreshed")
    );
});

// ─── POST /api/v1/auth/logout ─────────────────────────────────────────────────
export const logout = catchAsync(async (req, res) => {
  await AuthService.logoutUser(req.user._id);

  res
    .status(200)
    .clearCookie("refreshToken", COOKIE_OPTIONS)
    .json(new ApiResponse(200, {}, "Logged out successfully"));
});

// ─── GET /api/v1/auth/me ──────────────────────────────────────────────────────
export const getMe = catchAsync(async (req, res) => {
  // req.user is attached by the authenticate middleware — no DB call needed
  res.status(200).json(
    new ApiResponse(200, req.user.toPublicProfile(), "Current user fetched")
  );
});