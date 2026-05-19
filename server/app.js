// server/app.js
import express       from "express";
import cors          from "cors";
import helmet        from "helmet";
import cookieParser  from "cookie-parser";
import morgan        from "morgan";
import mongoSanitize from "express-mongo-sanitize";
import hpp           from "hpp";
import passport      from "./src/config/passport.js";
import { apiLimiter }  from "./src/middleware/rateLimiter.js";
import errorHandler    from "./src/middleware/errorHandler.js";

// ─── Route imports ────────────────────────────────────────────────────────────
import authRoutes  from "./src/routes/auth.routes.js";
import postRoutes  from "./src/routes/post.routes.js";
import eventRoutes from "./src/routes/event.routes.js";
import clubRoutes  from "./src/routes/club.routes.js";
import notifRoutes from "./src/routes/notification.routes.js";

const app = express();

// ─── Trust proxy — required when behind Nginx / Render / Railway ──────────────
app.set("trust proxy", 1);

// ─── Security headers ─────────────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }, // allow Cloudinary images
  contentSecurityPolicy: false,                          // configure separately if needed
}));

// ─── CORS ─────────────────────────────────────────────────────────────────────
app.use(cors({
  origin(origin, callback) {
    const whitelist = [
      process.env.CLIENT_URL,
      "http://localhost:5173",  // Vite dev server
      "http://localhost:3000",
    ];
    // Allow requests with no origin (Postman, curl, mobile apps)
    if (!origin || whitelist.includes(origin)) return callback(null, true);
    return callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
  methods:     ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

// ─── NoSQL injection + param pollution guards ─────────────────────────────────
app.use(mongoSanitize());
app.use(hpp());

// ─── Body parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser());

// ─── OAuth middleware ─────────────────────────────────────────────────────────
app.use(passport.initialize());
// No passport.session() — we use JWT, not sessions

// ─── HTTP logger (dev only) ───────────────────────────────────────────────────
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// ─── Global API rate limit ────────────────────────────────────────────────────
app.use("/api", apiLimiter);

// ─── Health check — used by deployment platforms ──────────────────────────────
app.get("/health", (req, res) =>
  res.status(200).json({
    status:    "ok",
    env:       process.env.NODE_ENV,
    uptime:    `${Math.floor(process.uptime())}s`,
    timestamp: new Date().toISOString(),
    memory:    `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
  })
);

// ─── API v1 routes ────────────────────────────────────────────────────────────
app.use("/api/v1/auth",          authRoutes);
app.use("/api/v1/posts",         postRoutes);
app.use("/api/v1/events",        eventRoutes);
app.use("/api/v1/clubs",         clubRoutes);
app.use("/api/v1/notifications", notifRoutes);

// ─── 404 — catch all unmatched routes ────────────────────────────────────────
app.use((req, res) =>
  res.status(404).json({
    success:   false,
    message:   `Route ${req.originalUrl} not found`,
    timestamp: new Date().toISOString(),
  })
);

// ─── Global error handler — MUST be last middleware ──────────────────────────
app.use(errorHandler);

export default app;