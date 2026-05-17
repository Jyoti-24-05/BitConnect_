// server/src/config/db.js
import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      dbName: "bitconnect", // explicit db name
    });
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    console.error(`❌ MongoDB connection failed: ${err.message}`);
    process.exit(1); // crash fast — nothing works without DB
  }
};

// Reconnect on dropped connection (network blip)
mongoose.connection.on("disconnected", () => {
  console.warn("⚠️  MongoDB disconnected — retrying...");
  connectDB();
});

export default connectDB;