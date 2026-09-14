const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const path = require("path");
require("dotenv").config();

require("./src/config/db"); // triggers pool connection test on startup

// Routes
const authRoutes = require("./src/routes/authRoutes");
const userRoutes = require("./src/routes/userRoutes");
const tutorRoutes = require("./src/routes/tutorRoutes");
const bookingRoutes = require("./src/routes/bookingRoutes");
const courseRoutes = require("./src/routes/courseRoutes");
const uploadRoutes = require("./src/routes/uploadRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(morgan("dev"));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Serve uploaded videos as static files so students can stream them
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Health Check API
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "Abugida Express PostgreSQL Backend is running.",
    database: process.env.DB_NAME || "abugida_db",
    timestamp: new Date().toISOString(),
  });
});

// Mount Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/tutors", tutorRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/upload", uploadRoutes);

// Root Route
app.get("/", (req, res) => {
  res.send(`
    <div style="font-family: system-ui, sans-serif; padding: 2rem; max-width: 600px; margin: 0 auto; text-align: center;">
      <h1 style="color: #0f766e;">🎓 Abugida API Server</h1>
      <p style="color: #334155;">Connected to PostgreSQL (<strong>${process.env.DB_NAME || "abugida_db"}</strong>).</p>
      <div style="padding: 1rem; background: #f0fdf4; border-radius: 8px; border: 1px solid #bbf7d0; color: #166534;">
        ✓ Server is healthy and running on port ${PORT}.
      </div>
    </div>
  `);
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.originalUrl}` });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("Global Error Handler:", err);
  res.status(500).json({ success: false, message: err.message || "Internal server error." });
});

app.listen(PORT, () => {
  console.log(`=============================================`);
  console.log(`🚀 Abugida Backend Server is running!`);
  console.log(`📡 URL: http://localhost:${PORT}`);
  console.log(`🗄️  Database: ${process.env.DB_NAME || "abugida_db"} (PostgreSQL)`);
  console.log(`=============================================`);
});

module.exports = app;
