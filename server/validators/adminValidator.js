const { body, param } = require("express-validator");

// ─── Reusable: validate a route param is a valid MongoDB ObjectId ─────────────
const mongoIdParam = (paramName = "id") => [
  param(paramName)
    .isMongoId()
    .withMessage(`Invalid ${paramName} format`),
];

// ─── Create User ──────────────────────────────────────────────────────────────
const createUserRules = [
  body("password")
    .isLength({ min: 8 }).withMessage("Password must be at least 8 characters")
    .matches(/[A-Z]/).withMessage("Password must contain at least one uppercase letter")
    .matches(/[a-z]/).withMessage("Password must contain at least one lowercase letter")
    .matches(/\d/).withMessage("Password must contain at least one digit"),

  body().custom((value) => {
    if (!value.email && !value.phone) {
      throw new Error("Email or phone is required");
    }
    return true;
  }),

  body("email")
    .optional()
    .trim()
    .isEmail().withMessage("Invalid email format")
    .normalizeEmail(),

  body("phone")
    .optional()
    .trim()
    .matches(/^(?:\+94|0)?\d{9,10}$/).withMessage("Invalid phone number format"),

  body("fullName")
    .trim()
    .notEmpty().withMessage("Full name is required")
    .isLength({ min: 2, max: 100 }).withMessage("Full name must be 2–100 characters"),

  body("role")
    .notEmpty().withMessage("Role is required")
    .isIn(["patient", "doctor", "responder", "admin"]).withMessage("Invalid role"),
];

// ─── Patch User Status ────────────────────────────────────────────────────────
const patchUserStatusRules = [
  ...mongoIdParam("id"),

  body("status")
    .notEmpty().withMessage("Status is required")
    .isIn(["ACTIVE", "PENDING", "REJECTED", "SUSPENDED"]).withMessage("Invalid status value"),
];

// ─── Update User ──────────────────────────────────────────────────────────────
const updateUserRules = [
  ...mongoIdParam("id"),

  body("fullName")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage("Full name must be 2–100 characters"),

  body("email")
    .optional()
    .trim()
    .isEmail().withMessage("Invalid email format")
    .normalizeEmail(),

  body("phone")
    .optional()
    .trim()
    .matches(/^(?:\+94|0)?\d{9,10}$/).withMessage("Invalid phone number format"),

  body("role")
    .optional()
    .isIn(["patient", "doctor", "responder", "admin"]).withMessage("Invalid role"),

  body("status")
    .optional()
    .isIn(["ACTIVE", "PENDING", "REJECTED", "SUSPENDED"]).withMessage("Invalid status value"),
];

// ─── Reset Password ──────────────────────────────────────────────────────────
const resetPasswordRules = [
  ...mongoIdParam("id"),

  body("password")
    .optional()
    .isLength({ min: 8 }).withMessage("Password must be at least 8 characters")
    .matches(/[A-Z]/).withMessage("Password must contain at least one uppercase letter")
    .matches(/[a-z]/).withMessage("Password must contain at least one lowercase letter")
    .matches(/\d/).withMessage("Password must contain at least one digit"),
];

// ─── Generate Report ──────────────────────────────────────────────────────────
const generateReportRules = [
  body("category")
    .notEmpty().withMessage("Report category is required")
    .isIn(["appointments", "emergencies", "patients", "doctors", "trends"])
    .withMessage("Category must be appointments, emergencies, patients, doctors, or trends"),

  body("fromDate")
    .notEmpty().withMessage("From date is required")
    .isISO8601().withMessage("From date must be a valid date (ISO 8601)"),

  body("toDate")
    .notEmpty().withMessage("To date is required")
    .isISO8601().withMessage("To date must be a valid date (ISO 8601)")
    .custom((value, { req }) => {
      if (req.body.fromDate && new Date(value) < new Date(req.body.fromDate)) {
        throw new Error("To date must be after from date");
      }
      return true;
    }),
];

// ─── Toggle User Status ──────────────────────────────────────────────────────
const toggleUserStatusRules = [
  ...mongoIdParam("id"),
];

// ─── Delete User ──────────────────────────────────────────────────────────────
const deleteUserRules = [
  ...mongoIdParam("id"),
];

// ─── Meeting Link ─────────────────────────────────────────────────────────────
const createMeetingLinkRules = [
  ...mongoIdParam("id"),
];

module.exports = {
  mongoIdParam,
  createUserRules,
  patchUserStatusRules,
  updateUserRules,
  resetPasswordRules,
  generateReportRules,
  toggleUserStatusRules,
  deleteUserRules,
  createMeetingLinkRules,
};
