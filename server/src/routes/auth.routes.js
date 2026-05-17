// server/src/routes/auth.routes.js
import { Router }        from "express";
import passport          from "passport";
import * as AuthCtrl     from "../controllers/auth.controller.js";
import { authenticate }  from "../middleware/authenticate.js";
import { authLimiter }   from "../middleware/rateLimiter.js";
import validate          from "../middleware/validate.js";
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  updateProfileSchema,
}                        from "../validators/auth.validator.js";
import { avatarUpload,
         handleAvatarUpload,
         handleMulterError } from "../middleware/upload.js";

const router = Router();

// ─── Standard auth ────────────────────────────────────────────────────────────
router.post("/register", authLimiter, validate(registerSchema),        AuthCtrl.register);
router.post("/login",    authLimiter, validate(loginSchema),           AuthCtrl.login);
router.post("/refresh",  authLimiter,                                  AuthCtrl.refresh);
router.post("/logout",   authenticate,                                 AuthCtrl.logout);
router.get( "/me",       authenticate,                                 AuthCtrl.getMe);

// ─── Password management ──────────────────────────────────────────────────────
router.post(
  "/forgot-password",
  authLimiter,
  validate(forgotPasswordSchema),
  AuthCtrl.forgotPassword
);
router.post(
  "/reset-password",
  authLimiter,
  validate(resetPasswordSchema),
  AuthCtrl.resetPassword
);
router.patch(
  "/change-password",
  authenticate,
  validate(changePasswordSchema),
  AuthCtrl.changePassword
);

// ─── Profile update ───────────────────────────────────────────────────────────
router.patch(
  "/profile",
  authenticate,
  (req, res, next) => avatarUpload.single("profilePicture")(req, res, next),
  handleMulterError,
  handleAvatarUpload,
  validate(updateProfileSchema),
  AuthCtrl.updateProfile
);

// ─── Google OAuth ─────────────────────────────────────────────────────────────
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"], session: false })
);
router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: `${process.env.CLIENT_URL}/login?error=google_failed`, session: false }),
  AuthCtrl.oAuthCallback
);

// ─── GitHub OAuth ─────────────────────────────────────────────────────────────
router.get(
  "/github",
  passport.authenticate("github", { scope: ["user:email"], session: false })
);
router.get(
  "/github/callback",
  passport.authenticate("github", { failureRedirect: `${process.env.CLIENT_URL}/login?error=github_failed`, session: false }),
  AuthCtrl.oAuthCallback
);

export default router;