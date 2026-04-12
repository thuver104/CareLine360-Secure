const express = require("express");
const { authMiddleware, roleMiddleware } = require("../middleware/auth");
const validateRequest = require("../middleware/validateRequest");

const {
  createProfileRules,
  updateProfileRules,
  updateAvatarRules,
  addSlotsRules,
  updateSlotRules,
  updateAppointmentStatusRules,
  createMedicalRecordRules,
  updateMedicalRecordRules,
  savePrescriptionRules,
  mongoIdParam,
} = require("../validators/doctorValidator");

const {
  getDoctorPublicById,
  createProfile,
  getProfile,
  updateProfile,
  updateAvatar,
  getDashboard,
  getAnalytics,
  getAvailability,
  addSlots,
  deleteSlot,
  updateSlot,
  getAppointments,
  updateAppointment,
  deleteAppointment,
  getPatients,
  getPatientDetail,
  createRecord,
  getRecordsByPatient,
  updateRecord,
  savePrescription,
  getPrescriptions,
  downloadPrescription,
  getRatings,
  listDoctors,
  deactivateAccount,
  getMeetings,
  triggerReminder,
  sendTestEmail,
} = require("../controllers/doctorController");

const {
  generatePrescriptionPdf,
} = require("../controllers/prescriptionController");

const router = express.Router();

// ── Public ────────────────────────────────────────────────────────────────────
router.get("/public", listDoctors);
router.get("/public/:id", getDoctorPublicById);

// ── Doctor-only protected ─────────────────────────────────────────────────────
const doctorAuth = [authMiddleware, roleMiddleware(["doctor"])];

// Profile
router.post(
  "/profile",
  doctorAuth,
  createProfileRules,
  validateRequest,
  createProfile,
);
router.get("/profile", doctorAuth, getProfile);
router.put(
  "/profile",
  doctorAuth,
  updateProfileRules,
  validateRequest,
  updateProfile,
);

// Account deactivation (soft-delete)
router.delete("/account", doctorAuth, deactivateAccount);

// Avatar — base64 via JSON body: { image: "data:image/jpeg;base64,..." }
router.put(
  "/profile/avatar",
  doctorAuth,
  updateAvatarRules,
  validateRequest,
  updateAvatar,
);

// Dashboard & analytics
router.get("/dashboard", doctorAuth, getDashboard);
router.get("/analytics", doctorAuth, getAnalytics);

// Availability
router.get("/availability", doctorAuth, getAvailability);
router.post(
  "/availability",
  doctorAuth,
  addSlotsRules,
  validateRequest,
  addSlots,
);
router.delete(
  "/availability/:slotId",
  doctorAuth,
  mongoIdParam("slotId"),
  validateRequest,
  deleteSlot,
);
router.put(
  "/availability/:slotId",
  doctorAuth,
  updateSlotRules,
  validateRequest,
  updateSlot,
);

// Appointments
router.get("/appointments", doctorAuth, getAppointments);
router.patch(
  "/appointments/:appointmentId",
  doctorAuth,
  updateAppointmentStatusRules,
  validateRequest,
  updateAppointment,
);
router.delete(
  "/appointments/:appointmentId",
  doctorAuth,
  mongoIdParam("appointmentId"),
  validateRequest,
  deleteAppointment,
);

// Meetings (video-call appointments)
router.get("/meetings", doctorAuth, getMeetings);

// Debug / test routes (doctor-auth protected)
router.get("/trigger-reminder", doctorAuth, triggerReminder);
router.post("/test-email", doctorAuth, sendTestEmail);

// Patients
router.get("/patients", doctorAuth, getPatients);
router.get(
  "/patients/:patientId",
  doctorAuth,
  mongoIdParam("patientId"),
  validateRequest,
  getPatientDetail,
);

// Medical records
router.post(
  "/records",
  doctorAuth,
  createMedicalRecordRules,
  validateRequest,
  createRecord,
);
router.get(
  "/records/:patientId",
  doctorAuth,
  mongoIdParam("patientId"),
  validateRequest,
  getRecordsByPatient,
);
router.put(
  "/records/:recordId",
  doctorAuth,
  updateMedicalRecordRules,
  validateRequest,
  updateRecord,
);

// Prescriptions
router.post("/prescriptions/generate", doctorAuth, generatePrescriptionPdf);
router.post(
  "/prescriptions",
  doctorAuth,
  savePrescriptionRules,
  validateRequest,
  savePrescription,
);
router.get("/prescriptions", doctorAuth, getPrescriptions);
router.get("/prescriptions/download", doctorAuth, downloadPrescription);

// Ratings
router.get("/ratings", doctorAuth, getRatings);

module.exports = router;
