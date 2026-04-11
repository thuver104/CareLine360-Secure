const { body, param } = require("express-validator");

// ─── Reusable: validate a route param is a valid MongoDB ObjectId ─────────────
const mongoIdParam = (paramName = "id") => [
  param(paramName)
    .isMongoId()
    .withMessage(`Invalid ${paramName} format`),
];

// ─── Profile: Update ──────────────────────────────────────────────────────────
const updateProfileRules = [
  body("fullName")
    .optional()
    .trim()
    .isLength({ min: 3, max: 100 }).withMessage("Full name must be 3–100 characters"),

  body("dob")
    .optional({ values: "null" })
    .isISO8601().withMessage("Invalid date of birth format")
    .custom((value) => {
      if (value && new Date(value) > new Date()) {
        throw new Error("Date of birth cannot be in the future");
      }
      return true;
    }),

  body("gender")
    .optional()
    .isIn(["male", "female", "other", ""]).withMessage("Gender must be male, female, or other"),

  body("nic")
    .optional({ values: "null" })
    .trim()
    .custom((value) => {
      if (value === "" || value === null) return true; // allow clearing
      const nicRegex = /^[0-9]{9}[vVxX]$|^[0-9]{12}$/;
      if (!nicRegex.test(value)) {
        throw new Error("Invalid NIC format (e.g. 123456789V or 200012345678)");
      }
      return true;
    }),

  body("address")
    .optional()
    .isObject().withMessage("Address must be an object"),

  body("address.district")
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage("District must be under 100 characters"),

  body("address.city")
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage("City must be under 100 characters"),

  body("address.line1")
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage("Address line must be under 200 characters"),

  body("emergencyContact")
    .optional()
    .isObject().withMessage("Emergency contact must be an object"),

  body("emergencyContact.name")
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage("Emergency contact name must be under 100 characters"),

  body("emergencyContact.phone")
    .optional({ values: "null" })
    .custom((value) => {
      if (!value || value === "" || value === null) return true; // allow clearing
      const p = String(value).replace(/\s+/g, "");
      const phoneRegex = /^(?:\+94|0)?\d{9}$/;
      if (!phoneRegex.test(p)) {
        throw new Error("Invalid emergency phone number format");
      }
      return true;
    }),

  body("emergencyContact.relationship")
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage("Relationship must be under 50 characters"),

  body("bloodGroup")
    .optional({ values: "null" })
    .custom((value) => {
      if (!value || value === "" || value === null) return true; // allow clearing
      const bgRegex = /^(A|B|AB|O)[+-]$/i;
      if (!bgRegex.test(String(value).trim())) {
        throw new Error("Invalid blood group (e.g. A+, O-, AB+)");
      }
      return true;
    }),

  body("allergies")
    .optional()
    .isArray().withMessage("Allergies must be an array"),

  body("allergies.*")
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 }).withMessage("Each allergy must be 1–100 characters"),

  body("chronicConditions")
    .optional()
    .isArray().withMessage("Chronic conditions must be an array"),

  body("chronicConditions.*")
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 }).withMessage("Each condition must be 1–100 characters"),

  body("heightCm")
    .optional()
    .isFloat({ min: 30, max: 250 }).withMessage("Height must be between 30 and 250 cm"),

  body("weightKg")
    .optional()
    .isFloat({ min: 2, max: 300 }).withMessage("Weight must be between 2 and 300 kg"),
];

// ─── AI Explain ───────────────────────────────────────────────────────────────
const explainMedicalTextRules = [
  body("text")
    .trim()
    .notEmpty().withMessage("Text is required for explanation")
    .isLength({ max: 5000 }).withMessage("Text must be under 5000 characters"),

  body("language")
    .optional()
    .trim()
    .isIn(["english", "sinhala", "tamil"])
    .withMessage("Language must be english, sinhala, or tamil"),
];

module.exports = {
  mongoIdParam,
  updateProfileRules,
  explainMedicalTextRules,
};
