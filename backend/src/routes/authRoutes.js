const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { authenticateToken } = require("../middleware/authMiddleware");

// Authentication Endpoints
router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/quick-login", authController.quickLogin);
router.get("/me", authenticateToken, authController.getMe);

module.exports = router;
