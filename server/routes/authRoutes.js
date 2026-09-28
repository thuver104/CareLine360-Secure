const express = require("express");
const rateLimit = require("express-rate-limit");
const { body } = require("express-validator");
const { authMiddleware } = require("../middleware/auth");

const {
  register,
  login,
  refresh,
  logout,
  sendVerifyEmailOtp,
  confirmVerifyEmailOtp,
  forgotPassword,
  resetPassword,
} = require("../controllers/authController");

const { reactivateAccount } = require("../controllers/patientController");
const { googleLogin } = require("../controllers/oauthController");

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 30,
  message: { message: "Too many attempts, try again later" },
});

// Register
router.post(
  "/register",
  authLimiter,
  [
    body("role")
      .isIn(["patient", "doctor"])
      .withMessage("Role must be patient or doctor"),

    body("fullName")
      .notEmpty()
      .withMessage("fullName required"),

    body("identifier")
      .notEmpty()
      .withMessage("Email or phone is required"),

    body("password")
      .isLength({ min: 8 })
      .matches(/[A-Z]/)
      .withMessage("Must include uppercase")
      .matches(/[0-9]/)
      .withMessage("Must include number")
      .matches(/[^A-Za-z0-9]/)
      .withMessage("Must include special character"),
  ],
  register,
);

// Login
router.post(
  "/login",
  authLimiter,
  [
    body("identifier")
      .notEmpty()
      .withMessage("Email or phone is required"),

    body("password")
      .notEmpty()
      .withMessage("Password is required"),
  ],
  login,
);

// Google OAuth
// Exchange authorization code, verify Google ID token,
// and issue CareLine360 session
router.post("/google", authLimiter, googleLogin);

// Refresh token
router.post(
  "/refresh",
  authLimiter,
  [body("refreshToken").notEmpty()],
  refresh,
);

// Logout
router.post("/logout", authMiddleware, logout);

// Current authenticated user
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const User = require("../models/User");

    const user = await User.findById(req.user.userId).select(
      "fullName email phone role status isVerified isActive",
    );

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    return res.json({
      user: {
        id: user._id,
        fullName: user.fullName || null,
        email: user.email || null,
        phone: user.phone || null,
        role: user.role,
        status: user.status,
        isVerified: user.isVerified,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error",
    });
  }
});

// Send email verification OTP
router.post(
  "/email/send-verify-otp",
  authLimiter,
  [
    body("identifier")
      .notEmpty()
      .withMessage("Email or phone is required"),
  ],
  sendVerifyEmailOtp,
);

// Verify email OTP
router.post(
  "/email/verify-otp",
  authLimiter,
  [
    body("identifier").notEmpty(),

    body("otp")
      .isLength({ min: 6, max: 6 })
      .withMessage("OTP must be 6 digits"),
  ],
  confirmVerifyEmailOtp,
);

// Forgot password
router.post(
  "/password/forgot",
  authLimiter,
  [
    body("identifier")
      .notEmpty()
      .withMessage("Email or phone is required"),
  ],
  forgotPassword,
);

// Reset password
router.post(
  "/password/reset",
  authLimiter,
  [
    body("identifier").notEmpty(),

    body("otp")
      .isLength({ min: 6, max: 6 }),

    body("newPassword")
      .isLength({ min: 8 })
      .matches(/[A-Z]/)
      .matches(/[0-9]/)
      .matches(/[^A-Za-z0-9]/),
  ],
  resetPassword,
);

// Reactivate account
router.post(
  "/reactivate",
  authLimiter,
  reactivateAccount,
);

module.exports = router;