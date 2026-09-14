const express = require("express");
const router = express.Router();
const bookingController = require("../controllers/bookingController");
const { authenticateToken, requireRole } = require("../middleware/authMiddleware");

// Booking endpoints
router.get("/",                     authenticateToken, bookingController.getBookings);
router.get("/:bookingId",           authenticateToken, bookingController.getBookingById);
router.post("/",                    authenticateToken, requireRole("student"), bookingController.createBooking);
router.patch("/:bookingId/status",  authenticateToken, bookingController.updateBookingStatus);

// Receipt flow
router.post("/:bookingId/receipt",          authenticateToken, requireRole("student"), bookingController.submitReceipt);
router.patch("/:bookingId/receipt/approve", authenticateToken, requireRole("tutor","admin"), bookingController.approveReceipt);
router.patch("/:bookingId/receipt/reject",  authenticateToken, requireRole("tutor","admin"), bookingController.rejectReceipt);

// Legacy aliases
router.put("/:bookingId/approve", authenticateToken, requireRole("tutor","admin"), bookingController.approveReceipt);
router.put("/:bookingId/reject",  authenticateToken, requireRole("tutor","admin"), bookingController.rejectReceipt);

module.exports = router;
