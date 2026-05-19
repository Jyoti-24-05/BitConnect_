// server/src/utils/generateToken.js
import jwt    from "jsonwebtoken";
import crypto from "crypto";

// ─── Access token — short lived, carries user identity ───────────────────────
export const generateAccessToken = (payload) =>
  jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: process.env.ACCESS_TOKEN_EXPIRY ?? "15m",
  });

// ─── Refresh token — long lived, only carries _id ────────────────────────────
export const generateRefreshToken = (userId) =>
  jwt.sign({ _id: userId }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRY ?? "7d",
  });

// ─── Verify any JWT — returns decoded payload or throws ───────────────────────
export const verifyToken = (token, secret) => {
  try {
    return jwt.verify(token, secret);
  } catch (err) {
    if (err.name === "TokenExpiredError")
      throw Object.assign(new Error("Token has expired"), { statusCode: 401 });
    throw Object.assign(new Error("Invalid token"), { statusCode: 401 });
  }
};

// ─── Generate a secure random token (for password reset, email verify) ────────
export const generateRandomToken = () =>
  crypto.randomBytes(32).toString("hex");

// ─── SHA-256 hash — store this, never the raw token ──────────────────────────
export const hashToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

// ─── Generate both tokens as a pair ──────────────────────────────────────────
export const generateTokenPair = (user) => ({
  accessToken:  generateAccessToken({
    _id:      user._id,
    email:    user.email,
    role:     user.role,
    username: user.username,
  }),
  refreshToken: generateRefreshToken(user._id),
});