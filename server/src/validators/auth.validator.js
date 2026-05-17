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
    .max(100, "College name cannot exceed 100 characters")
    .optional(),
  graduationYear: z
    .number()
    .int()
    .min(2000, "Invalid graduation year")
    .max(2035, "Invalid graduation year")
    .optional(),
  gender: z
    .enum(["male", "female", "non-binary", "prefer-not-to-say"])
    .optional(),
  skills: z
    .array(z.string().trim().max(30))
    .max(15, "Cannot add more than 15 skills")
    .optional(),
  socialLinks: z
    .object({
      linkedin: z.string().url("Invalid LinkedIn URL").optional().or(z.literal("")),
      github:   z.string().url("Invalid GitHub URL").optional().or(z.literal("")),
      twitter:  z.string().url("Invalid Twitter URL").optional().or(z.literal("")),
    })
    .optional(),
});