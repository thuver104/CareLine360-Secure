const express = require("express");
const router = express.Router();
const { authMiddleware, roleMiddleware } = require("../middleware/auth");
const validateRequest = require("../middleware/validateRequest");
const {
  createAppointmentRules,
  updateAppointmentRules,
  statusTransitionRules,
  rescheduleRules,
  cancelRules,
} = require("../validators/appointmentValidator");
const {
  createAppointment,
  getAppointments,
  getAppointmentById,
  updateAppointment,
  deleteAppointment,
  transitionStatus,
  rescheduleAppointment,
  cancelAppointment,
  getAppointmentStats,
} = require("../controllers/appointmentController");
const { submitRating, getAppointmentRating } = require("../controllers/ratingController");
const { createRatingRules } = require("../validators/ratingValidator");

// All appointment routes require authentication
router.use(authMiddleware);

router.post("/", roleMiddleware(["patient", "user"]), createAppointmentRules, validateRequest, createAppointment);
router.get("/stats", getAppointmentStats); // Must be before /:id
router.get("/", getAppointments);
router.get("/:id", getAppointmentById);
router.put("/:id", updateAppointmentRules, validateRequest, updateAppointment);
router.delete("/:id", deleteAppointment);
router.patch("/:id/status", roleMiddleware(["doctor"]), statusTransitionRules, validateRequest, transitionStatus);
router.patch("/:id/reschedule", rescheduleRules, validateRequest, rescheduleAppointment);
router.patch("/:id/cancel", cancelRules, validateRequest, cancelAppointment);

// Rating routes
router.post("/:id/rating", roleMiddleware(["patient"]), createRatingRules, validateRequest, submitRating);
router.get("/:id/rating", getAppointmentRating);

module.exports = router;
