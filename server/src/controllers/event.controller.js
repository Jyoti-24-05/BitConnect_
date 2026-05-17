// server/src/controllers/event.controller.js
import * as EventService  from "../services/event.service.js";
import { ApiResponse }    from "../utils/ApiResponse.js";
import { catchAsync }     from "../utils/catchAsync.js";

// ─── POST /api/v1/events ──────────────────────────────────────────────────────
export const createEvent = catchAsync(async (req, res) => {
  const {
    title, description, category, tags,
    venue, startDate, endDate, rsvpDeadline,
    capacity, clubId, status,
  } = req.body;

  // Banner image from upload middleware
  const banner = req.uploadedFile ?? { url: "", publicId: "" };

  const event = await EventService.createEvent({
    organizerId: req.user._id,
    title,
    description,
    category,
    tags,
    venue,
    startDate,
    endDate,
    rsvpDeadline,
    capacity,
    clubId,
    status,
    banner,
  });

  res.status(201).json(new ApiResponse(201, event, "Event created successfully"));
});

// ─── GET /api/v1/events ───────────────────────────────────────────────────────
export const getUpcomingEvents = catchAsync(async (req, res) => {
  const { cursor, limit, category, tags } = req.query;

  const result = await EventService.getUpcomingEvents({
    cursor,
    limit:    limit ? parseInt(limit, 10)      : 10,
    category,
    tags:     tags  ? tags.split(",")          : undefined,
  });

  res.status(200).json(new ApiResponse(200, result, "Upcoming events fetched"));
});

// ─── GET /api/v1/events/search ────────────────────────────────────────────────
export const searchEvents = catchAsync(async (req, res) => {
  const { q, limit, skip } = req.query;

  const events = await EventService.searchEvents(q, {
    limit: limit ? parseInt(limit, 10) : 10,
    skip:  skip  ? parseInt(skip,  10) : 0,
  });

  res.status(200).json(new ApiResponse(200, events, "Search results fetched"));
});

// ─── GET /api/v1/events/my-rsvps ─────────────────────────────────────────────
export const getMyRsvps = catchAsync(async (req, res) => {
  const { status } = req.query;

  const events = await EventService.getUserRsvpedEvents(
    req.user._id,
    status ?? "going"
  );

  res.status(200).json(new ApiResponse(200, events, "RSVPed events fetched"));
});

// ─── GET /api/v1/events/:eventId ─────────────────────────────────────────────
export const getEvent = catchAsync(async (req, res) => {
  const event = await EventService.getEventById(req.params.eventId);
  res.status(200).json(new ApiResponse(200, event, "Event fetched successfully"));
});

// ─── PATCH /api/v1/events/:eventId ───────────────────────────────────────────
export const updateEvent = catchAsync(async (req, res) => {
  // If new banner uploaded — attach to update data
  if (req.uploadedFile) req.body.banner = req.uploadedFile;

  const event = await EventService.updateEvent(
    req.params.eventId,
    req.user._id,
    req.user.role,
    req.body
  );

  res.status(200).json(new ApiResponse(200, event, "Event updated successfully"));
});

// ─── DELETE /api/v1/events/:eventId ──────────────────────────────────────────
export const deleteEvent = catchAsync(async (req, res) => {
  await EventService.deleteEvent(
    req.params.eventId,
    req.user._id,
    req.user.role
  );

  res.status(200).json(new ApiResponse(200, {}, "Event deleted successfully"));
});

// ─── POST /api/v1/events/:eventId/rsvp ───────────────────────────────────────
export const rsvpToEvent = catchAsync(async (req, res) => {
  const { status } = req.body;

  const result = await EventService.rsvpToEvent(
    req.params.eventId,
    req.user._id,
    status ?? "going"
  );

  res.status(200).json(
    new ApiResponse(200, result, `RSVP ${result.action} successfully`)
  );
});

// ─── GET /api/v1/events/club/:clubId ─────────────────────────────────────────
export const getEventsByClub = catchAsync(async (req, res) => {
  const { cursor, limit } = req.query;

  const result = await EventService.getEventsByClub(req.params.clubId, {
    cursor,
    limit: limit ? parseInt(limit, 10) : 10,
  });

  res.status(200).json(new ApiResponse(200, result, "Club events fetched"));
});