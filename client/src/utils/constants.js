// client/src/utils/constants.js
export const API_BASE_URL = import.meta.env.VITE_API_URL ?? "/api/v1";

export const ROLES = {
  STUDENT: "student",
  CLUB:    "club",
  ADMIN:   "admin",
};

export const SOCKET_EVENTS = {
  JOIN_USER_ROOM:        "join:user",
  JOIN_EVENT_ROOM:       "join:event",
  LEAVE_EVENT_ROOM:      "leave:event",
  NEW_NOTIFICATION:      "notification:new",
  MARK_NOTIF_READ:       "notification:read",
  RSVP_UPDATED:          "rsvp:updated",
  EVENT_UPDATED:         "event:updated",
  NEW_POST:              "feed:new_post",
  POST_LIKED:            "feed:post_liked",
  USER_ONLINE:           "presence:online",
  USER_OFFLINE:          "presence:offline",
};

export const POST_TYPES = [
  { value: "general",      label: "General" },
  { value: "announcement", label: "Announcement" },
  { value: "achievement",  label: "Achievement" },
  { value: "opportunity",  label: "Opportunity" },
];

export const CLUB_CATEGORIES = [
  "technical", "cultural", "sports", "academic", "social", "other",
];

export const EVENT_CATEGORIES = [
  "workshop", "seminar", "hackathon",
  "cultural", "sports", "networking", "other",
];

export const QUERY_KEYS = {
  FEED:          "feed",
  POST:          "post",
  EVENTS:        "events",
  EVENT:         "event",
  CLUBS:         "clubs",
  CLUB:          "club",
  NOTIFICATIONS: "notifications",
  UNREAD_COUNT:  "unread-count",
  ME:            "me",
};