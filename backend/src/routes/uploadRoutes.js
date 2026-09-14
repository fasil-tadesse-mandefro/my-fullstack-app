const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const router = express.Router();
const { authenticateToken, requireRole } = require("../middleware/authMiddleware");

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, "../../uploads/videos");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer config — save video files to disk with a safe unique name
const storage = multer.diskStorage({
  destination(_req, _file, cb) {
    cb(null, uploadsDir);
  },
  filename(_req, file, cb) {
    // Sanitize original filename and prefix with timestamp to avoid collisions
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
    cb(null, `${Date.now()}-${safe}`);
  },
});

const fileFilter = (_req, file, cb) => {
  const allowed = ["video/mp4", "video/webm", "video/ogg", "video/quicktime", "video/x-msvideo"];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only video files (MP4, WebM, OGG, MOV, AVI) are allowed."), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 500 * 1024 * 1024, // 500 MB max per file
  },
});

/**
 * POST /api/upload/video
 * Tutor uploads a lesson video. Returns the public URL for the stored file.
 */
router.post(
  "/video",
  authenticateToken,
  requireRole("tutor", "admin"),
  upload.single("video"),
  (req, res) => {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No video file received." });
    }

    // Build the public URL students will use to stream the video
    const protocol = req.protocol;
    const host = req.get("host");
    const videoUrl = `${protocol}://${host}/uploads/videos/${req.file.filename}`;

    return res.status(201).json({
      success: true,
      message: "Video uploaded successfully.",
      videoUrl,
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
    });
  }
);

// Multer error handler
router.use((err, _req, res, _next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({ success: false, message: "File too large. Maximum size is 500 MB." });
    }
    return res.status(400).json({ success: false, message: err.message });
  }
  if (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
});

module.exports = router;
