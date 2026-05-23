// server/src/validators/auth.validator.js
import { z } from "zod";

// ─── Reusable field definitions ───────────────────────────────────────────────
const usernameField = z
  .string({ required_error: "Username is required" })
  .trim()
  .min(3,  "Username must be at least 3 characters")
  .max(30, "Username cannot exceed 30 characters")
  .regex(
    /^[a-zA-Z0-9_]+$/,
    "Username can only contain letters, numbers, and underscores"
  );

const emailField = z
  .string({ required_error: "Email is required" })
  .trim()
  .toLowerCase()
  .email("Please provide a valid email address");

const passwordField = z
  .string({ required_error: "Password is required" })
  .min(8,  "Password must be at least 8 characters")
  .max(64, "Password cannot exceed 64 characters")
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/,
    "Password must contain uppercase, lowercase, number, and special character"
  );

// ─── Schemas ──────────────────────────────────────────────────────────────────

export const registerSchema = z.object({
  username: usernameField,
  email:    emailField,
  password: passwordField,
  role: z
    .enum(["student", "club", "admin"], {
      errorMap: () => ({ message: "Role must be student, club, or admin" }),
    })
    .optional()
    .default("student"),
});

export const loginSchema = z.object({
  email:    emailField,
  password: z.string({ required_error: "Password is required" }).min(1, "Password is required"),
});

export const forgotPasswordSchema = z.object({
  email: emailField,
});

export const resetPasswordSchema = z
  .object({
    token:           z.string({ required_error: "Reset token is required" }).min(1),
    password:        passwordField,
    confirmPassword: z.string({ required_error: "Please confirm your password" }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path:    ["confirmPassword"],
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string({ required_error: "Current password is required" }).min(1),
    newPassword:     passwordField,
    confirmPassword: z.string({ required_error: "Please confirm your new password" }),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path:    ["confirmPassword"],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "New password must be different from current password",
    path:    ["newPassword"],
  });

export const updateProfileSchema = z.object({
  bio: z
    .string()
    .trim()
    .max(200, "Bio cannot exceed 200 characters")
    .optional(),
  college: z
    .string()
    .trim()
    .max(100)
    .optional(),
  graduationYear: z
    .union([z.string(), z.number()])
    .optional()
    .transform((v) => (v ? parseInt(String(v), 10) : undefined)),
  gender: z
    .enum(["male", "female", "non-binary", "prefer-not-to-say", ""])
    .optional(),
  // Accept both array and single string — FormData quirk
  skills: z
    .union([
      z.array(z.string().trim().max(30)),
      z.string().trim(),           // single value from FormData
    ])
    .optional()
    .transform((val) => {
      if (!val) return [];
      if (Array.isArray(val)) return val.filter(Boolean);
      return val.split(",").map((s) => s.trim()).filter(Boolean);
    }),
  // socialLinks arrives as JSON string from FormData
  socialLinks: z
    .union([
      z.object({
        linkedin: z.string().optional().or(z.literal("")),
        github:   z.string().optional().or(z.literal("")),
        twitter:  z.string().optional().or(z.literal("")),
      }),
      z.string(), // JSON string from FormData
    ])
    .optional()
    .transform((val) => {
      if (!val) return undefined;
      if (typeof val === "string") {
        try { return JSON.parse(val); } catch { return undefined; }
      }
      return val;
    }),
});