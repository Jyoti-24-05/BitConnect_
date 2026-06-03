// server/src/routes/club.routes.js
import { Router }           from "express";
import * as ClubCtrl        from "../controllers/club.controller.js";
import { authenticate,
         authorize }        from "../middleware/authenticate.js";
import { avatarUpload,
         handleAvatarUpload,
         handleMulterError } from "../middleware/upload.js";
import Club                 from "../models/Club.model.js";
import { ApiResponse }      from "../utils/ApiResponse.js";
import { ApiError }         from "../utils/ApiError.js";
import { catchAsync }       from "../utils/catchAsync.js";

const router = Router();

// ── Public ────────────────────────────────────────────────────────────────────
router.get("/",       ClubCtrl.discoverClubs);
router.get("/search", ClubCtrl.searchClubs);


// ── Auth required ─────────────────────────────────────────────────────────────
router.use(authenticate);

// ── /me must be BEFORE /:slug or Express matches "me" as a slug ──────────────
router.get("/me", ClubCtrl.getMyClubs);

// ── /:slug is now safely below /me ───────────────────────────────────────────
router.get("/:slug", ClubCtrl.getClub);
// ── Create club (club/admin only) ─────────────────────────────────────────────
router.post(
  "/",
  authorize("club", "admin"),
  (req, res, next) => avatarUpload.single("logo")(req, res, next),
  handleMulterError,
  handleAvatarUpload,
  ClubCtrl.createClub
);

// ── Membership ────────────────────────────────────────────────────────────────
router.post("/:clubId/join",  ClubCtrl.joinClub);
router.post("/:clubId/leave", ClubCtrl.leaveClub);

// ── Club management ───────────────────────────────────────────────────────────
router.patch(
  "/:clubId",
  (req, res, next) => avatarUpload.single("logo")(req, res, next),
  handleMulterError,
  handleAvatarUpload,
  ClubCtrl.updateClub
);

router.patch("/:clubId/requests/:userId", ClubCtrl.handleJoinRequest);
router.patch("/:clubId/members/:userId/role", ClubCtrl.updateMemberRole);

// ── Admin only — verify a club ────────────────────────────────────────────────
router.patch(
  "/:clubId/verify",
  authorize("admin"),
  catchAsync(async (req, res) => {
    const club = await Club.findByIdAndUpdate(
      req.params.clubId,
      { isVerified: true },
      { new: true }
    );
    if (!club) throw new ApiError(404, "Club not found");
    res.status(200).json(new ApiResponse(200, club, "Club verified"));
  })
);

export default router;