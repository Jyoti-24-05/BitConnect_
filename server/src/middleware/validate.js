// server/src/middleware/validate.js
import { z }         from "zod";
import { ApiError }  from "../utils/ApiError.js";

// Targets: "body" | "query" | "params"
// Usage in routes:
//   router.post("/register", validate(registerSchema), AuthCtrl.register)
//   router.get("/",          validate(getPostsQuerySchema, "query"), PostCtrl.getAll)

const validate = (schema, target = "body") =>
  (req, res, next) => {
    const result = schema.safeParse(req[target]);

    if (!result.success) {
      // Format Zod errors into a clean array: [{ field, message }]
      const errors = result.error.errors.map((err) => ({
        field:   err.path.join(".") || "unknown",
        message: err.message,
      }));

      // First error as the main message, full list in errors array
      return next(new ApiError(422, errors[0].message, errors));
    }

    // Replace req[target] with the parsed+coerced data
    // This means req.body.limit is already a Number after getPostsQuerySchema runs
    req[target] = result.data;
    next();
  };

export default validate;