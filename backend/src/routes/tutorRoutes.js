const express = require("express");
const router = express.Router();
const tutorController = require("../controllers/tutorController");
const { authenticateToken, requireRole } = require("../middleware/authMiddleware");

// Public tutor discovery
router.get("/", tutorController.getTutors);
router.get("/:tutorId", tutorController.getTutorById);
router.get("/:tutorId/profile", tutorController.getTutorProfile);
router.get("/:tutorId/reviews", tutorController.getTutorReviews);

// Payment methods
router.get("/:tutorId/payment-methods", tutorController.getPaymentMethods);
router.post("/:tutorId/payment-methods", authenticateToken, requireRole("tutor", "admin"), tutorController.savePaymentMethods);
router.put("/:tutorId/payment-methods/:pmId", authenticateToken, requireRole("tutor", "admin"), tutorController.updatePaymentMethod);
router.delete("/:tutorId/payment-methods/:pmId", authenticateToken, requireRole("tutor", "admin"), tutorController.deletePaymentMethod);

// Tutor profile update (atomic)
router.patch("/:tutorId/profile", authenticateToken, requireRole("tutor", "admin"), tutorController.updateTutorProfile);

// Availability
router.get("/:tutorId/availability", tutorController.getAvailability);
router.post("/:tutorId/availability", authenticateToken, requireRole("tutor", "admin"), tutorController.createAvailability);
router.put("/:tutorId/availability/:availabilityId", authenticateToken, requireRole("tutor", "admin"), tutorController.updateAvailability);
router.delete("/:tutorId/availability/:availabilityId", authenticateToken, requireRole("tutor", "admin"), tutorController.deleteAvailability);

// 1. Tutor Education
router.get("/:tutorId/education", tutorController.getEducation);
router.post("/:tutorId/education", authenticateToken, requireRole("tutor", "admin"), tutorController.addEducation);
router.delete("/:tutorId/education/:id", authenticateToken, requireRole("tutor", "admin"), tutorController.deleteEducation);

// 2. Tutor Certifications
router.get("/:tutorId/certifications", tutorController.getCertifications);
router.post("/:tutorId/certifications", authenticateToken, requireRole("tutor", "admin"), tutorController.addCertification);
router.delete("/:tutorId/certifications/:id", authenticateToken, requireRole("tutor", "admin"), tutorController.deleteCertification);

// 3. Tutor Languages
router.get("/:tutorId/languages", tutorController.getLanguages);
router.post("/:tutorId/languages", authenticateToken, requireRole("tutor", "admin"), tutorController.addLanguage);
router.delete("/:tutorId/languages/:id", authenticateToken, requireRole("tutor", "admin"), tutorController.deleteLanguage);

// 4. Tutor Subjects
router.get("/:tutorId/subjects", tutorController.getSubjects);
router.post("/:tutorId/subjects", authenticateToken, requireRole("tutor", "admin"), tutorController.addSubject);
router.delete("/:tutorId/subjects/:id", authenticateToken, requireRole("tutor", "admin"), tutorController.deleteSubject);

// 5. Tutor Education Levels
router.get("/:tutorId/education-levels", tutorController.getEducationLevels);
router.post("/:tutorId/education-levels", authenticateToken, requireRole("tutor", "admin"), tutorController.addEducationLevel);
router.delete("/:tutorId/education-levels/:id", authenticateToken, requireRole("tutor", "admin"), tutorController.deleteEducationLevel);

// 6. Tutor Tags
router.get("/:tutorId/tags", tutorController.getTags);
router.post("/:tutorId/tags", authenticateToken, requireRole("tutor", "admin"), tutorController.addTag);
router.delete("/:tutorId/tags/:id", authenticateToken, requireRole("tutor", "admin"), tutorController.deleteTag);

module.exports = router;
