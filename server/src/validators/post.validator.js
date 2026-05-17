// server/src/validators/post.validator.js
import { z } from "zod";

// ─── Reusable ─────────────────────────────────────────────────────────────────
const tagsField = z
  .array(
    z.string().trim().toLowerCase().max(30, "Each tag cannot exceed 30 characters")
  )
  .max(5, "Maximum 5 tags allowed")
  .optional()
  .default([]);

// ─── Schemas ──────────────────────────────────────────────────────────────────

export const createPostSchema = z.object({
  content: z
    .string({ required_error: "Post content is required" })
    .trim()
    .min(1,    "Post content cannot be empty")
    .max(3000, "Post cannot exceed 3000 characters"),
  type: z
    .enum(["general", "announcement", "achievement", "opportunity", "poll"])
    .optional()
    .default("general"),
  visibility: z
    .enum(["public", "club_only", "connections_only"])
    .optional()
    .default("public"),
  tags:   tagsField,
  clubId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, "Invalid club ID")
    .optional(),
  // For opportunity posts
  opportunityMeta: z
    .object({
      company:   z.string().trim().max(100).optional(),
      role:      z.string().trim().max(100).optional(),
      applyLink: z.string().url("Invalid application URL").optional(),
      deadline:  z.coerce.date().optional(),
    })
    .optional(),
});

export const updatePostSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1,    "Post content cannot be empty")
    .max(3000, "Post cannot exceed 3000 characters")
    .optional(),
  visibility: z
    .enum(["public", "club_only", "connections_only"])
    .optional(),
  tags:      tagsField,
  isPinned:  z.boolean().optional(),
  opportunityMeta: z
    .object({
      company:   z.string().trim().max(100).optional(),
      role:      z.string().trim().max(100).optional(),
      applyLink: z.string().url("Invalid application URL").optional(),
      deadline:  z.coerce.date().optional(),
    })
    .optional(),
});

export const createCommentSchema = z.object({
  content: z
    .string({ required_error: "Comment content is required" })
    .trim()
    .min(1,   "Comment cannot be empty")
    .max(500, "Comment cannot exceed 500 characters"),
});

export const updateCommentSchema = z.object({
  content: z
    .string({ required_error: "Comment content is required" })
    .trim()
    .min(1,   "Comment cannot be empty")
    .max(500, "Comment cannot exceed 500 characters"),
});

export const getPostsQuerySchema = z.object({
  cursor:  z.string().optional(),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 10))
    .pipe(z.number().min(1).max(50)),
  tags:   z.string().optional().transform((val) => val?.split(",").map((t) => t.trim())),
  type:   z.enum(["general", "announcement", "achievement", "opportunity", "poll"]).optional(),
});