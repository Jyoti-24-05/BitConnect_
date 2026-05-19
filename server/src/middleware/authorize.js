// server/src/middleware/authorize.js
import { ApiError } from "../utils/ApiError.js";

// ─── Role-based access control ────────────────────────────────────────────────
// Always use AFTER authenticate middleware (requires req.user)
//
// Usage:
//   authorize("admin")               — admin only
//   authorize("admin", "club")       — admin OR club
//   authorize("student", "club", "admin") — any authenticated role

export const authorize = (...roles) =>
  (req, res, next) => {
    if (!req.user)
      return next(new ApiError(401, "Authentication required"));

    if (!roles.includes(req.user.role))
      return next(
        new ApiError(
          403,
          `Access denied — requires role: ${roles.join(" or ")}`
        )
      );

    next();
  };

// ─── Resource ownership guard ─────────────────────────────────────────────────
// Checks that req.user._id matches a specific field on a fetched document.
// Admins always pass through.
//
// Usage in route:
//   router.delete("/:postId", authenticate, isOwnerOrAdmin("post", "author"), deletePost)
//
// This requires the document to be fetched and attached to req[resourceKey]
// by a prior middleware or the controller itself.

export const isOwnerOrAdmin = (resourceKey, ownerField = "author") =>
  (req, res, next) => {
    if (!req.user)
      return next(new ApiError(401, "Authentication required"));

    // Admins bypass ownership check
    if (req.user.role === "admin") return next();

    const resource = req[resourceKey];
    if (!resource)
      return next(new ApiError(404, "Resource not found"));

    const ownerId = resource[ownerField]?._id ?? resource[ownerField];

    if (ownerId?.toString() !== req.user._id.toString())
      return next(new ApiError(403, "You don't have permission to modify this resource"));

    next();
  };

// ─── Account active guard ─────────────────────────────────────────────────────
// Extra layer — rejects suspended accounts even with valid JWT
// Useful on sensitive routes like posting, creating events

export const requireActiveAccount = (req, res, next) => {
  if (!req.user)
    return next(new ApiError(401, "Authentication required"));

  if (!req.user.isActive)
    return next(new ApiError(403, "Your account has been suspended — contact support"));

  next();
};

// ─── Verified account guard ───────────────────────────────────────────────────
// Only verified users can perform certain actions (e.g. create events)

export const requireVerified = (req, res, next) => {
  if (!req.user)
    return next(new ApiError(401, "Authentication required"));

  if (!req.user.isVerified)
    return next(
      new ApiError(403, "Please verify your email before performing this action")
    );

  next();
};