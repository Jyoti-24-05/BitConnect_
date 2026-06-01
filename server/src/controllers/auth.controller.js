// server/src/controllers/auth.controller.js
import crypto                   from "crypto";
import * as AuthService         from "../services/auth.service.js";
import User                     from "../models/User.model.js";
import { ApiResponse }          from "../utils/ApiResponse.js";
import { ApiError }             from "../utils/ApiError.js";
import { catchAsync }           from "../utils/catchAsync.js";
import { deleteFromCloudinary } from "../config/cloudinary.js";
import sendEmail                from "../utils/sendEmail.js";

// ─── Cookie config ────────────────────────────────────────────────────────────
const isProd = process.env.NODE_ENV === "production";

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure:   isProd,
  sameSite: isProd ? "none" : "strict",
  maxAge:   7 * 24 * 60 * 60 * 1000,
};

const CLEAR_COOKIE_OPTIONS = {
  httpOnly: true,
  secure:   isProd,
  sameSite: isProd ? "none" : "strict",
};
// ─── Internal helper ──────────────────────────────────────────────────────────
const generateTokenPair = (user) => ({
  accessToken:  user.generateAccessToken(),
  refreshToken: user.generateRefreshToken(),
});

const hashToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

// ─── POST /api/v1/auth/register ───────────────────────────────────────────────
export const register = catchAsync(async (req, res) => {
  const { username, email, password, role } = req.body;

  const user = await AuthService.registerUser({ username, email, password, role });

  // Fire welcome email — non-blocking, failure won't affect response
  sendEmail("welcome", {
    to:   email,
    data: { username },
  }).catch((err) => console.error("[Email] Welcome email failed:", err.message));

  res.status(201).json(
    new ApiResponse(201, user, "Account created successfully")
  );
});

// ─── POST /api/v1/auth/login ──────────────────────────────────────────────────
export const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;

  const { user, accessToken, refreshToken } =
    await AuthService.loginUser({ email, password });

  res
    .status(200)
    .cookie("refreshToken", refreshToken, COOKIE_OPTIONS)
    .json(new ApiResponse(200, { user, accessToken }, "Login successful"));
});

// ─── POST /api/v1/auth/refresh ────────────────────────────────────────────────
export const refresh = catchAsync(async (req, res) => {
  const incomingRefreshToken = req.cookies?.refreshToken;

  const { accessToken, refreshToken } =
    await AuthService.refreshAccessToken(incomingRefreshToken);

  res
    .status(200)
    .cookie("refreshToken", refreshToken, COOKIE_OPTIONS)
    .json(new ApiResponse(200, { accessToken }, "Token refreshed successfully"));
});

// ─── POST /api/v1/auth/logout ─────────────────────────────────────────────────
export const logout = catchAsync(async (req, res) => {
  await AuthService.logoutUser(req.user._id);

  res
    .status(200)
    .clearCookie("refreshToken", CLEAR_COOKIE_OPTIONS)
    .json(new ApiResponse(200, {}, "Logged out successfully"));
});

// ─── GET /api/v1/auth/me ──────────────────────────────────────────────────────
export const getMe = catchAsync(async (req, res) => {
  // req.user already attached by authenticate middleware — no extra DB call
  res.status(200).json(
    new ApiResponse(200, req.user.toPublicProfile(), "Current user fetched")
  );
});

// ─── POST /api/v1/auth/forgot-password ───────────────────────────────────────
export const forgotPassword = catchAsync(async (req, res) => {
  const { email } = req.body;
  const user      = await User.findOne({ email });

  // Always 200 — never reveal whether email exists (prevents enumeration attacks)
  if (!user) {
    return res.status(200).json(
      new ApiResponse(200, {}, "If this email exists, a reset link has been sent")
    );
  }

  // Generate raw token — only the SHA-256 hash is stored in DB
  const rawToken  = crypto.randomBytes(32).toString("hex");
  const hash      = hashToken(rawToken);

  user.passwordResetToken   = hash;
  user.passwordResetExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 min
  await user.save({ validateBeforeSave: false });

  const resetURL = `${process.env.CLIENT_URL}/reset-password?token=${rawToken}`;

  await sendEmail("passwordReset", {
    to:   user.email,
    data: { username: user.username, resetURL },
  });

  res.status(200).json(
    new ApiResponse(200, {}, "If this email exists, a reset link has been sent")
  );
});

// ─── POST /api/v1/auth/reset-password ────────────────────────────────────────
export const resetPassword = catchAsync(async (req, res) => {
  const { token, password } = req.body;

  // Hash incoming raw token and look up matching user
  const hash = hashToken(token);

  const user = await User.findOne({
    passwordResetToken:   hash,
    passwordResetExpires: { $gt: Date.now() }, // not expired
  }).select("+password");

  if (!user)
    throw new ApiError(400, "Reset token is invalid or has expired");

  user.password             = password; // pre-save hook hashes it
  user.passwordResetToken   = undefined;
  user.passwordResetExpires = undefined;
  user.refreshToken         = undefined; // invalidate all active sessions
  await user.save();

  res.status(200).json(
    new ApiResponse(200, {}, "Password reset successful — please login again")
  );
});

// ─── PATCH /api/v1/auth/change-password ──────────────────────────────────────
export const changePassword = catchAsync(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id).select("+password");
  if (!user) throw new ApiError(404, "User not found");

  const isMatch = await user.isPasswordCorrect(currentPassword);
  if (!isMatch)
    throw new ApiError(401, "Current password is incorrect");

  user.password     = newPassword; // pre-save hook handles hashing
  user.refreshToken = undefined;   // force logout everywhere
  await user.save();

  res
    .status(200)
    .clearCookie("refreshToken", CLEAR_COOKIE_OPTIONS)
    .json(
      new ApiResponse(200, {}, "Password changed — please login again")
    );
});

// ─── PATCH /api/v1/auth/profile ───────────────────────────────────────────────
export const updateProfile = catchAsync(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) throw new ApiError(404, "User not found");

  // New avatar uploaded via multer → sharp → cloudinary middleware chain
  if (req.uploadedFile) {
    // Delete old Cloudinary asset to avoid orphaned files
    if (user.profilePicturePublicId) {
      await deleteFromCloudinary(user.profilePicturePublicId);
    }
    user.profilePicture         = req.uploadedFile.url;
    user.profilePicturePublicId = req.uploadedFile.publicId;
  }

  // Only update fields that were actually sent
  const allowedFields = [
    "bio", "college", "graduationYear",
    "gender", "skills", "socialLinks",
  ];
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) user[field] = req.body[field];
  });

  await user.save({ validateBeforeSave: false });

  res.status(200).json(
    new ApiResponse(200, user.toPublicProfile(), "Profile updated successfully")
  );
});

// ─── GET /api/v1/auth/google/callback ────────────────────────────────────────
// GET /api/v1/auth/github/callback
export const oAuthCallback = catchAsync(async (req, res) => {
  // req.user is attached by passport strategy after successful OAuth handshake
  const { accessToken, refreshToken } = generateTokenPair(req.user);

  // Store hashed refresh token in DB
  await User.findByIdAndUpdate(req.user._id, {
    refreshToken: hashToken(refreshToken),
    lastSeen:     new Date(),
  });

  // Set httpOnly cookie then redirect to frontend OAuth handler page
  // Frontend reads ?token= once, stores in memory, removes from URL
  res
    .cookie("refreshToken", refreshToken, COOKIE_OPTIONS)
    .redirect(
      `${process.env.CLIENT_URL}/oauth/callback?token=${accessToken}`
    );
});