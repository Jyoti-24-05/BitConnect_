// server/src/routes/event.routes.js
import { Router }             from "express";
import * as EventCtrl         from "../controllers/event.controller.js";
import { authenticate,
         authorize }          from "../middleware/authenticate.js";
import validate               from "../middleware/validate.js";
import { bannerUpload,
         handleBannerUpload,
         handleMulterError }  from "../middleware/upload.js";
import {
  createEventSchema,
  updateEventSchema,
  rsvpSchema,
  getEventsQuerySchema,
}                             from "../validators/event.validator.js";

const router = Router();

// ─── Public routes ────────────────────────────────────────────────────────────
// Guests can browse events — no auth required
router.get(
  "/",
  validate(getEventsQuerySchema, "query"),
  EventCtrl.getUpcomingEvents
);
router.get("/search",           EventCtrl.searchEvents);
router.get("/club/:clubId",     EventCtrl.getEventsByClub);
router.get("/:eventId",         EventCtrl.getEvent);

// ─── Protected routes — must be logged in ────────────────────────────────────
router.use(authenticate);

router.get("/my-rsvps", EventCtrl.getMyRsvps);

// ─── RSVP ─────────────────────────────────────────────────────────────────────
router.post(
  "/:eventId/rsvp",
  validate(rsvpSchema),
  EventCtrl.rsvpToEvent
);

// ─── Create event — clubs and admins only ─────────────────────────────────────
router.post(
  "/",
  authorize("club", "admin"),
  (req, res, next) => bannerUpload.single("banner")(req, res, next),
  handleMulterError,
  handleBannerUpload,
  validate(createEventSchema),
  EventCtrl.createEvent
);

// ─── Update / delete — organizer or admin ─────────────────────────────────────
router.patch(
  "/:eventId",
  authorize("club", "admin"),
  (req, res, next) => bannerUpload.single("banner")(req, res, next),
  handleMulterError,
  handleBannerUpload,
  validate(updateEventSchema),
  EventCtrl.updateEvent
);

router.delete(
  "/:eventId",
  authorize("club", "admin"),
  EventCtrl.deleteEvent
);

export default router;