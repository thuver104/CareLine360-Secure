const { body, param } = require("express-validator");

const createRatingRules = [
  param("id").isMongoId().withMessage("Invalid appointment ID"),
  body("rating")
    .isInt({ min: 1, max: 5 })
    .withMessage("Rating must be between 1 and 5"),
  body("review")
    .optional()
    .isString()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Review must be under 500 characters"),
];

module.exports = { createRatingRules };
