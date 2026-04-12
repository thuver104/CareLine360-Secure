const { body, param, query } = require("express-validator");

// ─── Reusable: validate a route param is a valid MongoDB ObjectId ─────────────
const mongoIdParam = (paramName = "id") => [
  param(paramName)
    .isMongoId()
    .withMessage(`Invalid ${paramName} format`),
];

// ─── Profile: Create ──────────────────────────────────────────────────────────
const createProfileRules = [
  body("fullName")
    .trim()
    .notEmpty().withMessage("Full name is required")
    .isLength({ min: 3, max: 100 }).withMessage("Full name must be 3–100 characters"),

  body("specialization")
    .trim()
    .notEmpty().withMessage("Specialization is required")
    .isLength({ max: 100 }).withMessage("Specialization must be under 100 characters"),

  body("licenseNumber")
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage("License number must be under 50 characters"),

  body("phone")
    .optional()
    .trim()
    .matches(/^(?:\+94|0)?\d{9,10}$/).withMessage("Invalid phone number format (e.g. +94771234567 or 0771234567)"),

  body("consultationFee")
    .optional()
    .isFloat({ min: 0 }).withMessage("Consultation fee must be a non-negative number"),

  body("experience")
    .optional()
    .isInt({ min: 0, max: 60 }).withMessage("Experience must be between 0 and 60 years"),

  body("qualifications")
    .optional()
    .isArray().withMessage("Qualifications must be an array"),

  body("qualifications.*")
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 }).withMessage("Each qualification must be 1–100 characters"),

  body("bio")
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage("Bio must be under 1000 characters"),
];

// ─── Profile: Update ──────────────────────────────────────────────────────────
const updateProfileRules = [
  body("fullName")
    .optional()
    .trim()
    .isLength({ min: 3, max: 100 }).withMessage("Full name must be 3–100 characters"),

  body("specialization")
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage("Specialization must be under 100 characters"),

  body("licenseNumber")
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage("License number must be under 50 characters"),

  body("phone")
    .optional()
    .trim()
    .matches(/^(?:\+94|0)?\d{9,10}$/).withMessage("Invalid phone number format"),

  body("consultationFee")
    .optional()
    .isFloat({ min: 0 }).withMessage("Consultation fee must be a non-negative number"),

  body("experience")
    .optional()
    .isInt({ min: 0, max: 60 }).withMessage("Experience must be between 0 and 60 years"),

  body("qualifications")
    .optional()
    .isArray().withMessage("Qualifications must be an array"),

  body("bio")
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage("Bio must be under 1000 characters"),
];

// ─── Avatar ───────────────────────────────────────────────────────────────────
const updateAvatarRules = [
  body("image")
    .notEmpty().withMessage("image (base64) is required in request body")
    .matches(/^data:image\/(jpeg|jpg|png|gif|webp);base64,/i)
    .withMessage("Image must be a valid base64 data URI (data:image/...;base64,...)"),
];

// ─── Availability: Add Slots ──────────────────────────────────────────────────
const addSlotsRules = [
  body("slots")
    .isArray({ min: 1 }).withMessage("slots must be a non-empty array"),

  body("slots.*.date")
    .notEmpty().withMessage("Each slot must have a date")
    .matches(/^\d{4}-\d{2}-\d{2}$/).withMessage("Slot date must be in YYYY-MM-DD format"),

  body("slots.*.startTime")
    .notEmpty().withMessage("Each slot must have a startTime")
    .matches(/^([01]\d|2[0-3]):[0-5]\d$/).withMessage("startTime must be in HH:mm format"),

  body("slots.*.endTime")
    .notEmpty().withMessage("Each slot must have an endTime")
    .matches(/^([01]\d|2[0-3]):[0-5]\d$/).withMessage("endTime must be in HH:mm format"),

  body("slots").custom((slots) => {
    for (let i = 0; i < slots.length; i++) {
      if (slots[i].startTime && slots[i].endTime && slots[i].startTime >= slots[i].endTime) {
        throw new Error(`Slot ${i + 1}: endTime must be after startTime`);
      }
    }
    return true;
  }),
];

// ─── Availability: Update Slot ────────────────────────────────────────────────
const updateSlotRules = [
  param("slotId")
    .isMongoId().withMessage("Invalid slot ID format"),

  body("startTime")
    .notEmpty().withMessage("startTime is required")
    .matches(/^([01]\d|2[0-3]):[0-5]\d$/).withMessage("startTime must be in HH:mm format"),

  body("endTime")
    .notEmpty().withMessage("endTime is required")
    .matches(/^([01]\d|2[0-3]):[0-5]\d$/).withMessage("endTime must be in HH:mm format"),

  body().custom((value) => {
    if (value.startTime && value.endTime && value.startTime >= value.endTime) {
      throw new Error("endTime must be after startTime");
    }
    return true;
  }),
];

// ─── Appointments: Update Status ──────────────────────────────────────────────
const updateAppointmentStatusRules = [
  param("appointmentId")
    .isMongoId().withMessage("Invalid appointment ID format"),

  body("status")
    .notEmpty().withMessage("Status is required")
    .isIn(["confirmed", "completed", "cancelled"]).withMessage("Status must be confirmed, completed, or cancelled"),

  body("notes")
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage("Notes must be under 1000 characters"),
];

// ─── Medical Records: Create ──────────────────────────────────────────────────
const createMedicalRecordRules = [
  body("patientId")
    .notEmpty().withMessage("Patient ID is required")
    .isMongoId().withMessage("Invalid patient ID format"),

  body("appointmentId")
    .optional()
    .isMongoId().withMessage("Invalid appointment ID format"),

  body("chiefComplaint")
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage("Chief complaint must be under 500 characters"),

  body("diagnosis")
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage("Diagnosis must be under 500 characters"),

  body("notes")
    .optional()
    .trim()
    .isLength({ max: 2000 }).withMessage("Notes must be under 2000 characters"),

  body("vitals")
    .optional()
    .isObject().withMessage("Vitals must be an object"),

  body("vitals.heartRate")
    .optional()
    .isInt({ min: 20, max: 300 }).withMessage("Heart rate must be between 20 and 300 bpm"),

  body("vitals.temperature")
    .optional()
    .isFloat({ min: 30, max: 45 }).withMessage("Temperature must be between 30 and 45 °C"),

  body("vitals.oxygenSaturation")
    .optional()
    .isFloat({ min: 0, max: 100 }).withMessage("Oxygen saturation must be between 0 and 100%"),

  body("prescriptions")
    .optional()
    .isArray().withMessage("Prescriptions must be an array"),
];

// ─── Medical Records: Update ──────────────────────────────────────────────────
const updateMedicalRecordRules = [
  param("recordId")
    .isMongoId().withMessage("Invalid record ID format"),

  body("chiefComplaint")
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage("Chief complaint must be under 500 characters"),

  body("diagnosis")
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage("Diagnosis must be under 500 characters"),

  body("notes")
    .optional()
    .trim()
    .isLength({ max: 2000 }).withMessage("Notes must be under 2000 characters"),

  body("vitals")
    .optional()
    .isObject().withMessage("Vitals must be an object"),

  body("prescriptions")
    .optional()
    .isArray().withMessage("Prescriptions must be an array"),
];

// ─── Prescriptions: Save ──────────────────────────────────────────────────────
const savePrescriptionRules = [
  body("patientId")
    .notEmpty().withMessage("Patient ID is required")
    .isMongoId().withMessage("Invalid patient ID format"),

  body("medicalRecordId")
    .optional()
    .isMongoId().withMessage("Invalid medical record ID format"),

  body("medicines")
    .optional()
    .isArray().withMessage("Medicines must be an array"),

  body("medicines.*.medicine")
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 }).withMessage("Medicine name must be 1–200 characters"),

  body("notes")
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage("Prescription notes must be under 1000 characters"),
];

module.exports = {
  mongoIdParam,
  createProfileRules,
  updateProfileRules,
  updateAvatarRules,
  addSlotsRules,
  updateSlotRules,
  updateAppointmentStatusRules,
  createMedicalRecordRules,
  updateMedicalRecordRules,
  savePrescriptionRules,
};
