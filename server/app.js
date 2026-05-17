// server/app.js
import express              from "express";
import cors                 from "cors";
import helmet               from "helmet";
import cookieParser         from "cookie-parser";
import morgan               from "morgan";
import mongoSanitize        from "express-mongo-sanitize";
import hpp                  from "hpp";
import { apiLimiter }       from "./src/middleware/rateLimiter.js";
import errorHandler         from "./src/middleware/errorHandler.js";
import passport             from "./src/config/passport.js";

// Route imports
import authRoutes           from "./src/routes/auth.routes.js";

const app = express();
app.use(passport.initialize());

// ─── Security middleware (order matters) ─────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin:      process.env.CLIENT_URL,
  credentials: true,               // required for cookies to cross origins
  methods:     ["GET","POST","PUT","PATCH","DELETE"],
}));
app.use(mongoSanitize());          // strip $ from body/params
app.use(hpp());                    // prevent param pollution

// ─── Request parsing ──────────────────────────────────────────────────────────
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser());

// ─── Logging (dev only) ───────────────────────────────────────────────────────
if (process.env.NODE_ENV === "development") app.use(morgan("dev"));

// ─── Global rate limit ────────────────────────────────────────────────────────
app.use("/api", apiLimiter);

// ─── Health check ─────────────────────────────────────────────────────────────
app.get("/health", (req, res) =>
  res.json({ status: "ok", env: process.env.NODE_ENV, timestamp: new Date() })
);

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use("/api/v1/auth",  authRoutes);
// We'll plug in more routes here as we build them:
// app.use("/api/v1/events",  eventRoutes);
// app.use("/api/v1/posts",   postRoutes);
// app.use("/api/v1/clubs",   clubRoutes);

// ─── 404 handler ─────────────────────────────────────────────────────────────
app.use("*", (req, res) =>
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` })
);

// ─── Global error handler (must be last) ─────────────────────────────────────
app.use(errorHandler);

export default app;