// server/src/utils/catchAsync.js
// Wraps every async controller — eliminates try/catch boilerplate everywhere
// Errors bubble to the global errorHandler middleware
export const catchAsync = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);