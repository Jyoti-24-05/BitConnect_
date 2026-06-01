// server/app.js — 
import express          from "express";
import cors             from "cors";
import helmet           from "helmet";
import cookieParser     from "cookie-parser";
import morgan           from "morgan";
import mongoSanitize    from "express-mongo-sanitize";
import hpp              from "hpp";
import passport         from "./src/config/passport.js";
import { apiLimiter }   from "./src/middleware/rateLimiter.js";
import errorHandler     from "./src/middleware/errorHandler.js";

import authRoutes         from "./src/routes/auth.routes.js";
import postRoutes         from "./src/routes/post.routes.js";
import eventRoutes        from "./src/routes/event.routes.js";
import clubRoutes         from "./src/routes/club.routes.js";
import notifRoutes        from "./src/routes/notification.routes.js";
import userRoutes         from "./src/routes/user.routes.js";
import adminRoutes        from "./src/routes/admin.routes.js";

const app = express();

app.set("trust proxy", 1);

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy:     false,
}));

app.use(cors({
  origin(origin, callback) {
    const whitelist = [
  process.env.CLIENT_URL,
  process.env.CLIENT_URL_2,
  "http://localhost:5173",
  "http://localhost:3000",
].filter(Boolean);
    if (!origin || whitelist.includes(origin)) return callback(null, true);
    return callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials:    true,
  methods:        ["GET","POST","PUT","PATCH","DELETE","OPTIONS"],
  allowedHeaders: ["Content-Type","Authorization"],
}));

app.use(mongoSanitize());
app.use(hpp());
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser());
app.use(passport.initialize());

if (process.env.NODE_ENV === "development") app.use(morgan("dev"));

app.use("/api", apiLimiter);

app.get("/health", (req, res) =>
  res.status(200).json({
    status:    "ok",
    env:       process.env.NODE_ENV,
    uptime:    `${Math.floor(process.uptime())}s`,
    timestamp: new Date().toISOString(),
  })
);

// ── Routes — order matters, verify these paths are correct ───────────────────
app.use("/api/v1/auth",          authRoutes);
app.use("/api/v1/admin",         adminRoutes);
app.use("/api/v1/posts",         postRoutes);
app.use("/api/v1/events",        eventRoutes);   // ← events only
app.use("/api/v1/clubs",         clubRoutes);    // ← clubs only
app.use("/api/v1/notifications", notifRoutes);
app.use("/api/v1/users",         userRoutes);


app.use("*", (req, res) =>
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  })
);

app.use(errorHandler);

export default app;