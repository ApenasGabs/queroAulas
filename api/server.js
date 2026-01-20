import cors from "cors";
import express from "express";
import authRoutes from "./routes/auth.js";
import driveRoutes from "./routes/drive.js";

// Load environment variables from .env.local in development
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const app = express();

// Middleware
app.use(
  cors({
    origin: (origin, callback) => {
      const allowedOrigins =
        process.env.NODE_ENV === "production"
          ? ["https://queroaulas.vercel.app", "https://queroaulas.com"]
          : /^http:\/\/localhost:\d+$/.test(origin || "") || !origin
            ? origin
            : false;

      if (allowedOrigins === false) {
        callback(new Error("Not allowed by CORS"));
      } else {
        callback(null, allowedOrigins);
      }
    },
    credentials: true,
  }),
);

app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/drive", driveRoutes);

// Health check
app.get("/api/ping", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Error handler
app.use((err, req, res, next) => {
  if (process.env.NODE_ENV === "development") {
    console.error("[Error]", err);
  }
  res.status(500).json({
    error: "Internal server error",
    message: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// For local development
if (process.env.NODE_ENV !== "production") {
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`🚀 API ready on port ${port}`);
  });
}

export default app;
