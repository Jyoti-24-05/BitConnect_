// server/src/validators/event.validator.js — replace entirely

import { z } from "zod";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const futureDateField = (label) =>
  z.coerce
    .date({ required_error: `${label} is required` })
    .refine((d) => d > new Date(), { message: `${label} must be in the future` });

// Accepts boolean OR "true"/"false" string (FormData always sends strings)
const coercedBoolean = z
  .union([z.boolean(), z.string()])
  .transform((val) => val === true || val === "true")
  .optional()
  .default(false);

// ─── Create event ─────────────────────────────────────────────────────────────
export const createEventSchema = z
  .object({
    title: z
      .string({ required_error: "Event title is required" })
      .trim()
      .min(3,   "Title must be at least 3 characters")
      .max(120, "Title cannot exceed 120 characters"),

    description: z
      .string({ required_error: "Description is required" })
      .trim()
      .min(20,   "Description must be at least 20 characters")
      .max(2000, "Description cannot exceed 2000 characters"),

    category: z.enum(
      ["workshop","seminar","hackathon","cultural","sports","networking","other"],
      { errorMap: () => ({ message: "Invalid event category" }) }
    ),

    tags: z
      .union([
        z.array(z.string().trim().toLowerCase().max(30)),
        z.string(),
      ])
      .optional()
      .transform((val) => {
        if (!val) return [];
        if (Array.isArray(val)) return val.filter(Boolean);
        return val.split(",").map((t) => t.trim()).filter(Boolean);
      }),

    venue: z
      .object({
        name:        z.string().trim().max(100).optional(),
        address:     z.string().trim().max(200).optional(),
        isOnline:    coercedBoolean,               // ← handles "true"/"false"
        meetingLink: z.string().url("Invalid meeting link").optional().or(z.literal("")),
      })
      .optional(),

    startDate:    futureDateField("Start date"),
    endDate:      futureDateField("End date"),
    rsvpDeadline: z.coerce.date().optional(),

    capacity: z
      .union([z.number(), z.string()])
      .optional()
      .nullable()
      .transform((val) => {
        if (val === null || val === "" || val === undefined) return null;
        const n = parseInt(String(val), 10);
        return isNaN(n) ? null : n;
      }),

    clubId: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, "Invalid club ID")
      .optional(),

    status: z
      .enum(["draft", "published"])
      .optional()
      .default("draft"),
  })
  .refine((d) => d.endDate > d.startDate, {
    message: "End date must be after start date",
    path:    ["endDate"],
  })
  .refine(
    (d) => !d.rsvpDeadline || d.rsvpDeadline < d.startDate,
    { message: "RSVP deadline must be before event start date", path: ["rsvpDeadline"] }
  )
  .refine(
    (d) => !d.venue?.isOnline || !!d.venue?.meetingLink,
    { message: "Meeting link is required for online events", path: ["venue","meetingLink"] }
  );

// ─── Update event ─────────────────────────────────────────────────────────────
export const updateEventSchema = z
  .object({
    title: z.string().trim().min(3).max(120).optional(),
    description: z.string().trim().min(20).max(2000).optional(),
    category: z
      .enum(["workshop","seminar","hackathon","cultural","sports","networking","other"])
      .optional(),
    tags: z
      .union([z.array(z.string().trim().toLowerCase().max(30)), z.string()])
      .optional()
      .transform((val) => {
        if (!val) return undefined;
        if (Array.isArray(val)) return val.filter(Boolean);
        return val.split(",").map((t) => t.trim()).filter(Boolean);
      }),
    venue: z
      .object({
        name:        z.string().trim().max(100).optional(),
        address:     z.string().trim().max(200).optional(),
        isOnline:    coercedBoolean,
        meetingLink: z.string().url().optional().or(z.literal("")),
      })
      .optional(),
    startDate:    z.coerce.date().optional(),
    endDate:      z.coerce.date().optional(),
    rsvpDeadline: z.coerce.date().optional().nullable(),
    capacity: z
      .union([z.number(), z.string()])
      .optional()
      .nullable()
      .transform((val) => {
        if (val === null || val === "" || val === undefined) return null;
        const n = parseInt(String(val), 10);
        return isNaN(n) ? null : n;
      }),
    status:     z.enum(["draft","published","cancelled"]).optional(),
    isFeatured: coercedBoolean,
  })
  .refine(
    (d) => {
      if (d.startDate && d.endDate) return d.endDate > d.startDate;
      return true;
    },
    { message: "End date must be after start date", path: ["endDate"] }
  );

// ─── RSVP ─────────────────────────────────────────────────────────────────────
export const rsvpSchema = z.object({
  status: z.enum(["going","interested","not_going"], {
    errorMap: () => ({ message: "Status must be going, interested, or not_going" }),
  }),
});

// ─── Query ────────────────────────────────────────────────────────────────────
export const getEventsQuerySchema = z.object({
  cursor:   z.string().optional(),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 10))
    .pipe(z.number().min(1).max(50)),
  category: z
    .enum(["workshop","seminar","hackathon","cultural","sports","networking","other"])
    .optional(),
  tags:     z.string().optional().transform((val) => val?.split(",").map((t) => t.trim())),
  status:   z.enum(["draft","published","cancelled","completed"]).optional(),
});