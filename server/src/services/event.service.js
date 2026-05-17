// server/src/services/event.service.js
import Event                                   from "../models/Event.model.js";
import Club                                    from "../models/Club.model.js";
import User                                    from "../models/User.model.js";
import Notification                            from "../models/Notification.model.js";
import { deleteFromCloudinary }                from "../config/cloudinary.js";
import { ApiError }                            from "../utils/ApiError.js";
import { NOTIFICATION_TYPES }                  from "../models/Notification.model.js";
import { getIO }                               from "../sockets/index.js";
import { pushNotification }                    from "../sockets/handlers/notif.handler.js";
import { broadcastRsvpUpdate }                 from "../sockets/handlers/rsvp.handler.js";
import sendEmail                               from "../utils/sendEmail.js";

// ─── Create event ─────────────────────────────────────────────────────────────
export const createEvent = async ({ organizerId, title, description, category, tags, venue, startDate, endDate, rsvpDeadline, capacity, clubId, status, banner }) => {
  // Club events — verify organizer is club admin/moderator
  if (clubId) {
    const club = await Club.findById(clubId);
    if (!club) throw new ApiError(404, "Club not found");

    const memberStatus = club.getMemberStatus(organizerId);
    if (!["co-admin", "admin"].includes(memberStatus))
      throw new ApiError(403, "Only club admins can create club events");
  }

  const event = await Event.create({
    title,
    description,
    category,
    tags:         tags         ?? [],
    venue:        venue        ?? {},
    startDate,
    endDate,
    rsvpDeadline: rsvpDeadline ?? null,
    capacity:     capacity     ?? null,
    club:         clubId       ?? null,
    organizer:    organizerId,
    status:       status       ?? "draft",
    banner:       banner       ?? { url: "", publicId: "" },
  });

  // Update club stats
  if (clubId) {
    await Club.findByIdAndUpdate(clubId, { $inc: { "stats.totalEvents": 1 } });
  }

  // Notify all club members if published immediately
  if (clubId && status === "published") {
    await _notifyClubMembers(clubId, event, organizerId);
  }

  return event.populate([
    { path: "organizer", select: "username profilePicture isVerified" },
    { path: "club",      select: "name logo slug" },
  ]);
};

// ─── Get upcoming events feed ─────────────────────────────────────────────────
export const getUpcomingEvents = async ({ cursor, limit = 10, category, tags } = {}) => {
  const events = await Event.getUpcoming({ cursor, limit, category, tags });

  const nextCursor = events.length === limit
    ? events[events.length - 1].startDate.toISOString()
    : null;

  return { events, nextCursor, hasMore: !!nextCursor };
};

// ─── Get single event ─────────────────────────────────────────────────────────
export const getEventById = async (eventId) => {
  const event = await Event.findById(eventId)
    .populate("organizer", "username profilePicture role isVerified")
    .populate("club",      "name logo slug description");

  if (!event) throw new ApiError(404, "Event not found");
  return event;
};

// ─── Update event ─────────────────────────────────────────────────────────────
export const updateEvent = async (eventId, userId, userRole, updateData) => {
  const event = await Event.findById(eventId);
  if (!event) throw new ApiError(404, "Event not found");

  const isOrganizer = event.organizer.toString() === userId.toString();
  const isAdmin     = userRole === "admin";
  if (!isOrganizer && !isAdmin)
    throw new ApiError(403, "Only the event organizer can update this event");

  if (event.status === "cancelled")
    throw new ApiError(400, "Cannot update a cancelled event");

  // Track if being published for the first time — to notify members
  const beingPublished = updateData.status === "published" && event.status === "draft";

  const allowedFields = [
    "title", "description", "category", "tags", "venue",
    "startDate", "endDate", "rsvpDeadline", "capacity",
    "status", "isFeatured",
  ];
  allowedFields.forEach((field) => {
    if (updateData[field] !== undefined) event[field] = updateData[field];
  });

  await event.save();

  // Notify club members if publishing for the first time
  if (beingPublished && event.club) {
    await _notifyClubMembers(event.club, event, userId);
  }

  // Notify RSVPed users if event is updated/cancelled
  if (updateData.status === "cancelled") {
    await _notifyRsvpedUsers(event, "cancelled");
  }

  return event.populate("organizer", "username profilePicture");
};

// ─── Delete event ─────────────────────────────────────────────────────────────
export const deleteEvent = async (eventId, userId, userRole) => {
  const event = await Event.findById(eventId);
  if (!event) throw new ApiError(404, "Event not found");

  const isOrganizer = event.organizer.toString() === userId.toString();
  const isAdmin     = userRole === "admin";
  if (!isOrganizer && !isAdmin)
    throw new ApiError(403, "You don't have permission to delete this event");

  // Clean up banner from Cloudinary
  if (event.banner?.publicId) {
    await deleteFromCloudinary(event.banner.publicId);
  }

  // Notify RSVPed users before deleting
  await _notifyRsvpedUsers(event, "cancelled");

  await Event.findByIdAndDelete(eventId);

  // Update club stats
  if (event.club) {
    await Club.findByIdAndUpdate(event.club, { $inc: { "stats.totalEvents": -1 } });
  }
};

// ─── RSVP to event ───────────────────────────────────────────────────────────
export const rsvpToEvent = async (eventId, userId, status = "going") => {
  const event = await Event.findById(eventId);
  if (!event) throw new ApiError(404, "Event not found");

  if (event.status !== "published")
    throw new ApiError(400, "You can only RSVP to published events");

  if (event.rsvpDeadline && new Date() > event.rsvpDeadline)
    throw new ApiError(400, "RSVP deadline has passed");

  const { action, rsvpCount } = await event.toggleRsvp(userId, status);

  // Broadcast live RSVP update to everyone watching this event
  const io = getIO();
  await broadcastRsvpUpdate(io, {
    eventId,
    rsvpCount,
    spotsRemaining: event.spotsRemaining,
    userId,
    action,
  });

  // Send confirmation email when going
  if (action === "added" && status === "going") {
    const user = await User.findById(userId).select("email username");
    await sendEmail("rsvpConfirmation", {
      to:   user.email,
      data: {
        username:   user.username,
        eventTitle: event.title,
        eventDate:  event.startDate,
        eventURL:   `${process.env.CLIENT_URL}/events/${eventId}`,
      },
    });

    // Notify event organizer
    await pushNotification(io, {
      recipient: event.organizer,
      sender:    userId,
      type:      NOTIFICATION_TYPES.RSVP_CONFIRMED,
      message:   `joined your event "${event.title}"`,
      refId:     event._id,
      refModel:  "Event",
    });
  }

  return { action, rsvpCount, spotsRemaining: event.spotsRemaining };
};

// ─── Get events a user RSVPed to ──────────────────────────────────────────────
export const getUserRsvpedEvents = async (userId, status = "going") => {
  return Event.getRsvpedByUser(userId, status);
};

// ─── Get events by club ───────────────────────────────────────────────────────
export const getEventsByClub = async (clubId, { cursor, limit = 10 } = {}) => {
  const filter = {
    club:      clubId,
    status:    "published",
    isApproved: true,
    ...(cursor && { startDate: { $gt: new Date(cursor) } }),
  };

  const events = await Event.find(filter)
    .sort({ startDate: 1 })
    .limit(limit)
    .populate("organizer", "username profilePicture")
    .lean();

  const nextCursor = events.length === limit
    ? events[events.length - 1].startDate.toISOString()
    : null;

  return { events, nextCursor, hasMore: !!nextCursor };
};

// ─── Search events ────────────────────────────────────────────────────────────
export const searchEvents = async (query, { limit = 10, skip = 0 } = {}) => {
  if (!query?.trim()) throw new ApiError(400, "Search query is required");

  return Event.find(
    { $text: { $search: query }, status: "published" },
    { score: { $meta: "textScore" } }
  )
    .sort({ score: { $meta: "textScore" } })
    .skip(skip)
    .limit(limit)
    .populate("organizer", "username profilePicture")
    .lean();
};

// ─── Private helpers ──────────────────────────────────────────────────────────

// Notify all active club members about a new event
const _notifyClubMembers = async (clubId, event, organizerId) => {
  const club = await Club.findById(clubId).select("members");
  if (!club) return;

  const io = getIO();
  const recipients = club.members
    .filter((m) => m.status === "active" && m.user.toString() !== organizerId.toString())
    .map((m) => m.user);

  // Batch create notifications — Promise.allSettled never lets one failure break others
  await Promise.allSettled(
    recipients.map((recipientId) =>
      pushNotification(io, {
        recipient: recipientId,
        sender:    organizerId,
        type:      NOTIFICATION_TYPES.EVENT_CREATED,
        message:   `posted a new event: "${event.title}"`,
        refId:     event._id,
        refModel:  "Event",
      })
    )
  );
};

// Notify all RSVPed users when an event is cancelled/updated
const _notifyRsvpedUsers = async (event, reason) => {
  const io         = getIO();
  const goingRsvps = event.rsvps.filter((r) => r.status === "going");

  await Promise.allSettled(
    goingRsvps.map((rsvp) =>
      pushNotification(io, {
        recipient: rsvp.user,
        type:      reason === "cancelled"
          ? NOTIFICATION_TYPES.EVENT_CANCELLED
          : NOTIFICATION_TYPES.EVENT_UPDATED,
        message:   reason === "cancelled"
          ? `"${event.title}" has been cancelled`
          : `"${event.title}" has been updated`,
        refId:     event._id,
        refModel:  "Event",
      })
    )
  );
};