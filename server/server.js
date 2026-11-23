import express from "express";
import mongoose from "mongoose";

import authRoutes from "./routes/auth.js";
import eventRoutes from "./routes/events.js";
import registrationRoutes from "./routes/registrations.js";
import feedbackRoutes from "./routes/feedback.js";
import adminRoutes from "./routes/admin.js";

const app = express();
const PORT = process.env.PORT || 5000;

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "http://localhost:5173");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  next();
});

app.use(express.json({ limit: "1mb" }));
app.use("/uploads", express.static("server/uploads"));

app.get("/api/health", (req, res) => {
  res.json({ message: "EventHive API is running." });
});

app.use("/api/auth", authRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/registrations", registrationRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/admin", adminRoutes);

app.use((req, res) => {
  res.status(404).json({ message: "API endpoint not found." });
});

app.use((error, req, res, _next) => {
  if (error instanceof Error && error.name === "MulterError") {
    return res.status(400).json({ message: "Poster upload failed. Maximum file size is 512 KB." });
  }

  res.status(500).json({ message: "An unexpected server error occurred." });
});

async function startServer() {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is missing from the environment.");
    }

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is missing from the environment.");
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB.");

    app.listen(PORT, () => {
      console.log(`EventHive API running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  }
}

startServer();

