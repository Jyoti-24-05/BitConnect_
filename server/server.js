// server/server.js
import "dotenv/config";
import http              from "http";
import app               from "./app.js";
import connectDB         from "./src/config/db.js";
import { connectRedis }  from "./src/config/redis.js";
import { initSocket }    from "./src/sockets/index.js";

const PORT = process.env.PORT || 8000;

const startServer = async () => {
  // 1. DB — nothing works without this
  await connectDB();

  // 2. Redis — non-fatal, app works without it
  await connectRedis();

  // 3. HTTP server wrapping Express
  const httpServer = http.createServer(app);

  // 4. Socket.io on same HTTP server
  initSocket(httpServer);

  // 5. Listen
  httpServer.listen(PORT, () => {
    console.log(`🚀 Server running   → http://localhost:${PORT}`);
    console.log(`🌍 Environment      → ${process.env.NODE_ENV}`);
    console.log(`🔌 Socket.io        → attached`);
    console.log(`❤️  Health check     → http://localhost:${PORT}/health`);
  });
};

startServer();