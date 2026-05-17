// server/src/middleware/authenticate.js
import jwt        from "jsonwebtoken";
import User       from "../models/User.model.js";
import { ApiError } from "../utils/ApiError.js";
import { catchAsync } from "../utils/catchAsync.js";

// Protects any route — attaches req.user on success
export const authenticate = catchAsync(async (req, res, next) => {
  const token =
    req.cookies?.accessToken ||
    req.headers.authorization?.replace("Bearer ", "");

  if (!token) throw new ApiError(401, "Access token missing — please login");

  const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

  const user = await User.findById(decoded._id).select(
    "-password -refreshToken -passwordResetToken -passwordResetExpires"
  );
  if (!user)        throw new ApiError(401, "User not found");
  if (!user.isActive) throw new ApiError(403, "Account suspended");

  req.user = user;
  next();
});

// RBAC — use AFTER authenticate
// Usage: authorize("admin")  |  authorize("admin", "club")
export const authorize = (...roles) =>
  (req, res, next) => {
    if (!roles.includes(req.user.role))
      throw new ApiError(403, `Access denied — requires role: ${roles.join(" or ")}`);
    next();
  };