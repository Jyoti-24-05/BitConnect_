// server/src/services/auth.service.js
import crypto from "crypto";
import User from "../models/User.model.js";
import { ApiError } from "../utils/ApiError.js";
import jwt from "jsonwebtoken"; // dynamic to avoid circular at top of file

// ─── Token helpers ────────────────────────────────────────────────────────────

const generateTokenPair = (user) => ({
  accessToken:  user.generateAccessToken(),
  refreshToken: user.generateRefreshToken(),
});

// Hash before storing — if DB leaks, raw tokens can't be replayed
const hashToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

// ─── Register ─────────────────────────────────────────────────────────────────

export const registerUser = async ({ username, email, password, role }) => {
  // 1. Collision check (email + username separately for precise error messages)
  const existingEmail = await User.findOne({ email });
  if (existingEmail) throw new ApiError(409, "Email already registered");

  const existingUsername = await User.findOne({ username });
  if (existingUsername) throw new ApiError(409, "Username already taken");

  // 2. Create — password hashing handled by the pre-save hook on the model
  const user = await User.create({ username, email, password, role: role ?? "student" });

  // 3. Return safe projection only — never the full document
  return user.toPublicProfile();
};

// ─── Login ────────────────────────────────────────────────────────────────────

export const loginUser = async ({ email, password }) => {
  // select: false on password field — must opt back in explicitly
  const user = await User.findByEmailWithPassword(email);
  if (!user) throw new ApiError(401, "Invalid email or password");

  if (!user.isActive) throw new ApiError(403, "Account suspended. Contact support.");

  const isMatch = await user.isPasswordCorrect(password);
  if (!isMatch) throw new ApiError(401, "Invalid email or password"); // same message — no enumeration

  const { accessToken, refreshToken } = generateTokenPair(user);

  // Store hashed refresh token — raw stays with the client in httpOnly cookie
  user.refreshToken = hashToken(refreshToken);
  user.lastSeen = new Date();
  await user.save({ validateBeforeSave: false });

  return { user: user.toPublicProfile(), accessToken, refreshToken };
};

// ─── Refresh tokens ───────────────────────────────────────────────────────────

export const refreshAccessToken = async (incomingRefreshToken) => {
  if (!incomingRefreshToken) throw new ApiError(401, "Refresh token missing");

  let decoded;
  try {
    decoded = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
  } catch {
    throw new ApiError(401, "Refresh token expired or invalid");
  }

  const user = await User.findById(decoded._id).select("+refreshToken");
  if (!user) throw new ApiError(401, "User not found");

  const hashed = hashToken(incomingRefreshToken);
  if (user.refreshToken !== hashed)
    throw new ApiError(401, "Refresh token reuse detected — please login again");

  const { accessToken, refreshToken: newRefreshToken } = generateTokenPair(user);
  user.refreshToken = hashToken(newRefreshToken);
  await user.save({ validateBeforeSave: false });

  return { accessToken, refreshToken: newRefreshToken };
};

// ─── Logout ───────────────────────────────────────────────────────────────────

export const logoutUser = async (userId) => {
  await User.findByIdAndUpdate(userId, { $unset: { refreshToken: 1 } });
};

// ─── Get current user ─────────────────────────────────────────────────────────

export const getCurrentUser = async (userId) => {
  const user = await User.findById(userId).lean();
  if (!user) throw new ApiError(404, "User not found");
  return user;
};