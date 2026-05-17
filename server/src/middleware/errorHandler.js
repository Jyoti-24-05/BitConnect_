// server/src/middleware/errorHandler.js
import { ApiError } from "../utils/ApiError.js";

const errorHandler = (err, req, res, next) => {
  let error = err;

  // If it's not already an ApiError, wrap it
  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode ?? 500;
    const message    = error.message || "Something went wrong";
    error = new ApiError(statusCode, message, error?.errors || [], err.stack);
  }

  // Mongoose duplicate key error (email/username already exists)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    error = new ApiError(409, `${field} already exists`);
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map((e) => e.message);
    error = new ApiError(400, messages.join(", "));
  }

  // JWT errors
  if (err.name === "JsonWebTokenError")  error = new ApiError(401, "Invalid token");
  if (err.name === "TokenExpiredError")  error = new ApiError(401, "Token expired");

  const response = {
    success:    false,
    statusCode: error.statusCode,
    message:    error.message,
    ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
  };

  return res.status(error.statusCode).json(response);
};

export default errorHandler;