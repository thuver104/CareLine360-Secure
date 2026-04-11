const { body, param } = require("express-validator");

const createAppointmentRules = [
  // patient is set server-side from JWT (req.user.userId)
  body("doctor")
    .notEmpty().withMessage("Doctor ID is required")
    .isMongoId().withMessage("Invalid doctor ID"),

  body("date")
    .notEmpty().withMessage("Date is required")
    .isISO8601().withMessage("Invalid date format")
    .custom((value) => {
      const appointmentDate = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (appointmentDate < today) {
        throw new Error("Appointment date cannot be in the past");
      }
      return true;
    }),

  body("time")
    .notEmpty().withMessage("Time is required")
    .trim()
    .matches(/^([01]\d|2[0-3]):[0-5]\d$/).withMessage("Time must be in HH:mm format (e.g. 09:30)"),

  body("consultationType")
    .notEmpty().withMessage("Consultation type is required")
    .isIn(["in-person", "video", "phone"]).withMessage("Invalid consultation type"),

  body("symptoms")
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage("Symptoms must be under 500 characters"),

  body("notes")
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage("Notes must be under 1000 characters"),

  body("priority")
    .optional()
    .isIn(["low", "medium", "high", "urgent"]).withMessage("Invalid priority"),
];

const updateAppointmentRules = [
  param("id").isMongoId().withMessage("Invalid appointment ID"),

  body("date")
    .optional()
    .isISO8601().withMessage("Invalid date format")
    .custom((value) => {
      const appointmentDate = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (appointmentDate < today) {
        throw new Error("Appointment date cannot be in the past");
      }
      return true;
    }),

  body("time")
    .optional()
    .trim()
    .matches(/^([01]\d|2[0-3]):[0-5]\d$/).withMessage("Time must be in HH:mm format"),

  body("consultationType")
    .optional()
    .isIn(["in-person", "video", "phone"]).withMessage("Invalid consultation type"),

  body("symptoms")
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage("Symptoms must be under 500 characters"),

  body("notes")
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage("Notes must be under 1000 characters"),

  body("priority")
    .optional()
    .isIn(["low", "medium", "high", "urgent"]).withMessage("Invalid priority"),
];

const statusTransitionRules = [
  param("id").isMongoId().withMessage("Invalid appointment ID"),
  body("status")
    .notEmpty().withMessage("Status is required")
    .isIn(["confirmed", "completed", "cancelled"]).withMessage("Invalid status"),
];

const rescheduleRules = [
  param("id").isMongoId().withMessage("Invalid appointment ID"),

  body("date")
    .notEmpty().withMessage("New date is required")
    .isISO8601().withMessage("Invalid date format")
    .custom((value) => {
      const appointmentDate = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (appointmentDate < today) {
        throw new Error("Rescheduled date cannot be in the past");
      }
      return true;
    }),

  body("time")
    .notEmpty().withMessage("New time is required")
    .trim()
    .matches(/^([01]\d|2[0-3]):[0-5]\d$/).withMessage("Time must be in HH:mm format"),
];

const cancelRules = [
  param("id").isMongoId().withMessage("Invalid appointment ID"),
  body("reason")
    .notEmpty().withMessage("Cancellation reason is required")
    .trim()
    .isLength({ max: 500 }).withMessage("Cancellation reason must be under 500 characters"),
];

module.exports = {
  createAppointmentRules,
  updateAppointmentRules,
  statusTransitionRules,
  rescheduleRules,
  cancelRules,
};
