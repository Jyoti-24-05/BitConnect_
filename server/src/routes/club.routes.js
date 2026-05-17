// server/src/routes/club.routes.js
import { Router }             from "express";
import * as ClubCtrl          from "../controllers/club.controller.js";
import { authenticate,
         authorize }          from "../middleware/authenticate.js";
import validate               from "../middleware/validate.js";
import { avatarUpload,
         handleAvatarUpload,
         handleMulterError }  from "../middleware/upload.js";

const router = Router();

// ─── Public routes ────────────────────────────────────────────────────────────
router.get("/",        ClubCtrl.discoverClubs);
router.get("/search",  ClubCtrl.searchClubs);
router.get("/:slug",   ClubCtrl.getClub);     // slug not id — /clubs/coding-club-bit

// ─── Protected routes ─────────────────────────────────────────────────────────
router.use(authenticate);

// ─── Membership actions — any authenticated user ──────────────────────────────
router.post("/:clubId/join",  ClubCtrl.joinClub);
router.post("/:clubId/leave", ClubCtrl.leaveClub);

// ─── Club admin actions ───────────────────────────────────────────────────────
// Actual role check is inside service (getMemberStatus) for finer control
router.patch(
  "/:clubId",
  (req, res, next) => avatarUpload.single("logo")(req, res, next),
  handleMulterError,
  handleAvatarUpload,
  ClubCtrl.updateClub
);

router.patch(
  "/:clubId/requests/:userId",
  ClubCtrl.handleJoinRequest
);

router.patch(
  "/:clubId/members/:userId/role",
  ClubCtrl.updateMemberRole
);

// ─── Platform admin only — verify a club ─────────────────────────────────────
router.patch(
  "/:clubId/verify",
  authorize("admin"),
  async (req, res, next) => {
    // Inline — too small to warrant its own controller method
    const Club = (await import("../models/Club.model.js")).default;
    const { ApiResponse } = await import("../utils/ApiResponse.js");
    const club = await Club.findByIdAndUpdate(
      req.params.clubId,
      { isVerified: true },
      { new: true }
    );
    if (!club) return next(new (await import("../utils/ApiError.js")).ApiError(404, "Club not found"));
    res.status(200).json(new ApiResponse(200, club, "Club verified"));
  }
);

export default router;