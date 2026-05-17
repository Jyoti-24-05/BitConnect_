// server/src/validators/event.validator.js
import { z } from "zod";

// ─── Reusable ─────────────────────────────────────────────────────────────────
const futureDateField = (label) =>
  z.coerce
    .date({ required_error: `${label} is required` })
    .refine((date) => date > new Date(), {
      message: `${label} must be in the future`,
    });

// ─── Schemas ──────────────────────────────────────────────────────────────────

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
      ["workshop", "seminar", "hackathon", "cultural", "sports", "networking", "other"],
      { errorMap: () => ({ message: "Invalid event category" }) }
    ),

    tags: z
      .array(z.string().trim().toLowerCase().max(30))
      .max(5, "Maximum 5 tags allowed")
      .optional()
      .default([]),

    venue: z
      .object({
        name:        z.string().trim().max(100).optional(),
        address:     z.string().trim().max(200).optional(),
        isOnline:    z.boolean().optional().default(false),
        meetingLink: z
          .string()
          .url("Invalid meeting link URL")
          .optional()
          .or(z.literal("")),
      })
      .optional(),

    startDate:    futureDateField("Start date"),
    endDate:      futureDateField("End date"),
    rsvpDeadline: z.coerce.date().optional(),

    capacity: z
      .number()
      .int("Capacity must be a whole number")
      .min(1, "Capacity must be at least 1")
      .optional()
      .nullable(),

    clubId: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, "Invalid club ID")
      .optional(),

    status: z
      .enum(["draft", "published"])
      .optional()
      .default("draft"),
  })
  // Cross-field validation — endDate must be after startDate
  .refine((data) => data.endDate > data.startDate, {
    message: "End date must be after start date",
    path:    ["endDate"],
  })
  // rsvpDeadline must be before startDate
  .refine(
    (data) => !data.rsvpDeadline || data.rsvpDeadline < data.startDate,
    {
      message: "RSVP deadline must be before event start date",
      path:    ["rsvpDeadline"],
    }
  )
  // Online events need a meeting link
  .refine(
    (data) => !data.venue?.isOnline || !!data.venue?.meetingLink,
    {
      message: "Meeting link is required for online events",
      path:    ["venue", "meetingLink"],
    }
  );

export const updateEventSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(3,   "Title must be at least 3 characters")
      .max(120, "Title cannot exceed 120 characters")
      .optional(),
    description: z
      .string()
      .trim()
      .min(20,   "Description must be at least 20 characters")
      .max(2000, "Description cannot exceed 2000 characters")
      .optional(),
    category: z
      .enum(["workshop", "seminar", "hackathon", "cultural", "sports", "networking", "other"])
      .optional(),
    tags: z
      .array(z.string().trim().toLowerCase().max(30))
      .max(5)
      .optional(),
    venue: z
      .object({
        name:        z.string().trim().max(100).optional(),
        address:     z.string().trim().max(200).optional(),
        isOnline:    z.boolean().optional(),
        meetingLink: z.string().url().optional().or(z.literal("")),
      })
      .optional(),
    startDate:    z.coerce.date().optional(),
    endDate:      z.coerce.date().optional(),
    rsvpDeadline: z.coerce.date().optional().nullable(),
    capacity:     z.number().int().min(1).optional().nullable(),
    status:       z.enum(["draft", "published", "cancelled"]).optional(),
    isFeatured:   z.boolean().optional(),
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) return data.endDate > data.startDate;
      return true; // only validate if both are present
    },
    { message: "End date must be after start date", path: ["endDate"] }
  );

export const rsvpSchema = z.object({
  status: z.enum(["going", "interested", "not_going"], {
    errorMap: () => ({ message: "Status must be going, interested, or not_going" }),
  }),
});

export const getEventsQuerySchema = z.object({
  cursor:   z.string().optional(),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 10))
    .pipe(z.number().min(1).max(50)),
  category: z
    .enum(["workshop", "seminar", "hackathon", "cultural", "sports", "networking", "other"])
    .optional(),
  tags:     z.string().optional().transform((val) => val?.split(",").map((t) => t.trim())),
  status:   z.enum(["draft", "published", "cancelled", "completed"]).optional(),
});