const express = require("express");
const router = express.Router();
const courseController = require("../controllers/courseController");
const { authenticateToken, requireRole } = require("../middleware/authMiddleware");

// Public course browsing (preview only — no lesson video content)
router.get("/", courseController.getCourses);
router.get("/:id", courseController.getCourseById);

// Protected lesson/video content — requires auth + verified booking/payment access
router.get("/:id/learn", authenticateToken, courseController.getCourseForLearning);

// Tutor & Admin Course Management
router.post("/", authenticateToken, requireRole("tutor", "admin"), courseController.createCourse);
router.put("/:id", authenticateToken, requireRole("tutor", "admin"), courseController.updateCourse);
router.patch("/:id", authenticateToken, requireRole("tutor", "admin"), courseController.updateCourse);
router.delete("/:id", authenticateToken, requireRole("tutor", "admin"), courseController.deleteCourse);
router.patch("/:id/status", authenticateToken, requireRole("tutor", "admin"), courseController.updateCourseStatus);

module.exports = router;
