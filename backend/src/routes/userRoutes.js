const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const { authenticateToken, requireRole } = require("../middleware/authMiddleware");

// Admin-only pending lists — must come BEFORE /:id routes
router.get("/pending/students", authenticateToken, requireRole("admin"), userController.getPendingStudents);
router.get("/pending/tutors",   authenticateToken, requireRole("admin"), userController.getPendingTutors);

// General user management
router.get("/",        authenticateToken, requireRole("admin"), userController.getAllUsers);
router.get("/:id",     authenticateToken, userController.getUserById);
router.patch("/:id",          authenticateToken, userController.updateUserProfile);
router.patch("/:id/status",   authenticateToken, requireRole("admin"), userController.updateUserStatus);

// Legacy PUT aliases (keep for backward compat)
router.put("/:id/status",  authenticateToken, requireRole("admin"), userController.updateUserStatus);
router.put("/:id/profile", authenticateToken, userController.updateUserProfile);

module.exports = router;
