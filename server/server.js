// server/server.js
import "dotenv/config";
import http from "http";
import app from "./app.js";
import connectDB  from "./src/config/db.js";
import { initSocket } from "./src/sockets/index.js";

const PORT = process.env.PORT || 8000;

const startServer = async () => {
  // 1. Connect to DB first — everything depends on it
  await connectDB();

  // 2. Create HTTP server wrapping Express
  const httpServer = http.createServer(app);

  // 3. Attach Socket.io to same HTTP server
  initSocket(httpServer);

  // 4. Start listening
  httpServer.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
    console.log(`🔌 Socket.io attached`);
  });
};

startServer();