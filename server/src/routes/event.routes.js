// server/src/routes/event.routes.js --
import { Router }             from "express";
import * as EventCtrl         from "../controllers/event.controller.js";
import { authenticate,
         authorize }          from "../middleware/authenticate.js";
import validate               from "../middleware/validate.js";
import multer                 from "multer";
import { bannerUpload,
         handleBannerUpload,
         handleMulterError }  from "../middleware/upload.js";
import { ApiError }           from "../utils/ApiError.js";
import {
  createEventSchema,
  updateEventSchema,
  rsvpSchema,
  getEventsQuerySchema,
}                             from "../validators/event.validator.js";

const router = Router();

// ── Public ────────────────────────────────────────────────────────────────────
router.get("/search",       EventCtrl.searchEvents);
router.get("/club/:clubId", EventCtrl.getEventsByClub);
router.get(
  "/",
  validate(getEventsQuerySchema, "query"),
  EventCtrl.getUpcomingEvents
);

// ── Auth required ─────────────────────────────────────────────────────────────
router.use(authenticate);

// ── My RSVPs — specific route BEFORE /:eventId ────────────────────────────────
router.get("/my-rsvps", EventCtrl.getMyRsvps);

// ── RSVP ─────────────────────────────────────────────────────────────────────
router.post(
  "/:eventId/rsvp",
  validate(rsvpSchema),
  EventCtrl.rsvpToEvent
);

// ── Create event (club/admin only) ────────────────────────────────────────────
router.post(
  "/",
  authorize("club", "admin"),
  (req, res, next) => {
    bannerUpload.single("banner")(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE")
          return next(new ApiError(400, "Banner too large — max 5MB"));
        // Any other multer error — skip banner and continue
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

// ── Update / delete (club/admin only) ─────────────────────────────────────────
router.patch(
  "/:eventId",
  authorize("club", "admin"),
  (req, res, next) => {
    bannerUpload.single("banner")(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        console.warn("[Upload] Banner skipped:", err.message);
        return next();
      }
      if (err) return next(err);
      next();
    });
  },
  handleBannerUpload,
  validate(updateEventSchema),
  EventCtrl.updateEvent
);

router.delete(
  "/:eventId",
  authorize("club", "admin"),
  EventCtrl.deleteEvent
);

// ── Single event — LAST so it doesn't catch specific routes above ─────────────
router.get("/:eventId", EventCtrl.getEvent);

export default router;