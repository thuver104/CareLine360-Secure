const express = require("express");
const { authMiddleware, roleMiddleware } = require("../middleware/auth");
const validateRequest = require("../middleware/validateRequest");

const {
  createUserRules,
  patchUserStatusRules,
  updateUserRules,
  resetPasswordRules,
  generateReportRules,
  toggleUserStatusRules,
  deleteUserRules,
  createMeetingLinkRules,
  mongoIdParam,
} = require("../validators/adminValidator");

const {
  getPendingDoctors,
  patchUserStatus,
  postCreateUser,
  getAllUsers,
  toggleUserStatus,
  deleteUser,
  getStats,
  getAppointments,
  createMeetingLink,
  putUpdateUser,
  postResetPassword,
  postGenerateReport,
} = require("../controllers/adminController");

const router = express.Router();

// admin-only for most routes
router.use(authMiddleware);

// Emergency tab endpoints (accessible by admin and responder)
const {
  getAllEmergencies,
  getEmergencyById,
  updateStatus,
  getNearestHospital,
} = require("../controllers/emergencyController");
router.get(
  "/emergencies",
  roleMiddleware(["admin", "responder"]),
  getAllEmergencies,
);
router.get(
  "/emergencies/:id",
  roleMiddleware(["admin", "responder"]),
  mongoIdParam("id"),
  validateRequest,
  getEmergencyById,
);
router.patch(
  "/emergencies/:id/status",
  roleMiddleware(["admin", "responder"]),
  mongoIdParam("id"),
  validateRequest,
  updateStatus,
);
router.get(
  "/emergencies/:id/nearest-hospital",
  roleMiddleware(["admin", "responder"]),
  mongoIdParam("id"),
  validateRequest,
  getNearestHospital,
);

// All other admin routes remain admin-only
router.get("/doctors/pending", roleMiddleware(["admin"]), getPendingDoctors);
router.get("/users", roleMiddleware(["admin"]), getAllUsers);
router.get("/appointments", roleMiddleware(["admin"]), getAppointments);
router.post(
  "/appointments/:id/meeting",
  roleMiddleware(["admin"]),
  createMeetingLinkRules,
  validateRequest,
  createMeetingLink,
);
router.patch(
  "/users/:id/toggle-status",
  roleMiddleware(["admin"]),
  toggleUserStatusRules,
  validateRequest,
  toggleUserStatus,
);
router.put(
  "/users/:id",
  roleMiddleware(["admin"]),
  updateUserRules,
  validateRequest,
  putUpdateUser,
);
router.post(
  "/users/:id/reset-password",
  roleMiddleware(["admin"]),
  resetPasswordRules,
  validateRequest,
  postResetPassword,
);
router.delete(
  "/users/:id",
  roleMiddleware(["admin"]),
  deleteUserRules,
  validateRequest,
  deleteUser,
);
router.get("/stats", roleMiddleware(["admin"]), getStats);
router.post(
  "/reports/generate",
  roleMiddleware(["admin"]),
  generateReportRules,
  validateRequest,
  postGenerateReport,
);

router.patch(
  "/users/:id/status",
  roleMiddleware(["admin"]),
  patchUserStatusRules,
  validateRequest,
  patchUserStatus,
);

router.post(
  "/users",
  roleMiddleware(["admin"]),
  createUserRules,
  validateRequest,
  postCreateUser,
);

module.exports = router;
