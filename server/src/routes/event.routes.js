// server/src/routes/club.routes.js --
import { Router }             from "express";
import * as ClubCtrl          from "../controllers/club.controller.js";
import { authenticate,
         authorize }          from "../middleware/authenticate.js";
import { avatarUpload,
         handleAvatarUpload,
         handleMulterError,handleBannerUpload }  from "../middleware/upload.js";
import Club                   from "../models/Club.model.js";
import { ApiResponse }        from "../utils/ApiResponse.js";
import { ApiError }           from "../utils/ApiError.js";
import { catchAsync }         from "../utils/catchAsync.js";
import multer from "multer";

const router = Router();

// ── Public routes ─────────────────────────────────────────────────────────────
router.get("/",        ClubCtrl.discoverClubs);
router.get("/search",  ClubCtrl.searchClubs);
router.get("/:slug",   ClubCtrl.getClub);

// ── All routes below require auth ─────────────────────────────────────────────
router.use(authenticate);

// ── Create club ───────────────────────────────────────────────────────────────
router.post(
  "/",
  authorize("club", "admin"),
  (req, res, next) => {
    bannerUpload.single("banner")(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE")
          return next(new ApiError(400, "Banner too large — max 5MB"));
        // Any other multer error (including Unexpected field) — skip banner, continue
        console.warn("[Upload] Banner skipped:", err.message);
        return next();
      }
      if (err) return next(err);
      next();
    });
  },
  handleBannerUpload,
  validate(createEventSchema),
  EventCtrl.createEvent
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