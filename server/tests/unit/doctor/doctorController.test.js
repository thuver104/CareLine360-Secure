/**
 * ──────────────────────────────────────────────────────────────────────────────
 * UNIT TESTS – doctorController.js
 *
 * Controller tests use mocked service layer — no DB involved.
 * Validates that each controller:
 *   • reads the correct data from req (params, query, body, user)
 *   • forwards it to the service
 *   • returns the correct HTTP status and JSON body
 * ──────────────────────────────────────────────────────────────────────────────
 */

const { validationResult } = require("express-validator");

// Mock doctorService
jest.mock("../../../services/doctorService");
const doctorService = require("../../../services/doctorService");

// Mock external deps that the controller imports
jest.mock("../../../services/emailService", () => ({
  sendEmail: jest.fn().mockResolvedValue(true),
}));
jest.mock("../../../services/meetingScheduler", () => ({
  checkAndNotify: jest.fn().mockResolvedValue(true),
  getMeetingUrl: jest.fn().mockReturnValue("https://meet.careline360.lk/mock"),
}));

const controller = require("../../../controllers/doctorController");

// ── Helper: build mock req / res ──────────────────────────────────────────────

const mockReq = (overrides = {}) => ({
  user: { userId: "mock-user-id", role: "doctor" },
  body: {},
  params: {},
  query: {},
  headers: {},
  ...overrides,
});

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.setHeader = jest.fn().mockReturnValue(res);
  res.end = jest.fn().mockReturnValue(res);
  return res;
};

// ═══════════════════════════════════════════════════════════════════════════════

describe("Doctor Controller – Unit Tests", () => {
  afterEach(() => jest.clearAllMocks());

  // ── Profile ─────────────────────────────────────────────────────────────────

  describe("getProfile", () => {
    it("should return 200 with doctor profile", async () => {
      const mockProfile = { fullName: "Dr. Test", specialization: "General" };
      doctorService.getDoctorProfile.mockResolvedValue({
        status: 200,
        data: { doctor: mockProfile },
      });

      const req = mockReq();
      const res = mockRes();

      await controller.getProfile(req, res);

      expect(doctorService.getDoctorProfile).toHaveBeenCalledWith({
        userId: "mock-user-id",
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ doctor: mockProfile });
    });

    it("should return 404 if profile not found", async () => {
      doctorService.getDoctorProfile.mockResolvedValue({
        status: 404,
        data: { message: "Doctor profile not found. Please complete your profile." },
      });

      const req = mockReq();
      const res = mockRes();

      await controller.getProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe("updateProfile", () => {
    it("should pass updates to service and return result", async () => {
      const updates = { fullName: "Dr. Updated" };
      doctorService.updateDoctorProfile.mockResolvedValue({
        status: 200,
        data: { message: "Profile updated", doctor: updates },
      });

      const req = mockReq({ body: updates });
      const res = mockRes();

      await controller.updateProfile(req, res);

      expect(doctorService.updateDoctorProfile).toHaveBeenCalledWith({
        userId: "mock-user-id",
        updates,
      });
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  // ── Avatar ──────────────────────────────────────────────────────────────────

  describe("updateAvatar", () => {
    it("should return 400 if image is missing", async () => {
      const req = mockReq({ body: {} });
      const res = mockRes();

      await controller.updateAvatar(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.stringContaining("image") })
      );
    });

    it("should call service with base64 image", async () => {
      doctorService.updateAvatarBase64.mockResolvedValue({
        status: 200,
        data: { message: "Avatar updated", avatarUrl: "https://..." },
      });

      const req = mockReq({ body: { image: "data:image/jpeg;base64,abc" } });
      const res = mockRes();

      await controller.updateAvatar(req, res);

      expect(doctorService.updateAvatarBase64).toHaveBeenCalledWith({
        userId: "mock-user-id",
        base64Image: "data:image/jpeg;base64,abc",
      });
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  // ── Dashboard ───────────────────────────────────────────────────────────────

  describe("getDashboard", () => {
    it("should return dashboard stats", async () => {
      const mockData = {
        doctor: { fullName: "Dr. Test" },
        stats: { totalAppointments: 10 },
      };
      doctorService.getDashboardStats.mockResolvedValue({
        status: 200,
        data: mockData,
      });

      const req = mockReq();
      const res = mockRes();

      await controller.getDashboard(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockData);
    });
  });

  describe("getAnalytics", () => {
    it("should return analytics data", async () => {
      doctorService.getDoctorAnalytics.mockResolvedValue({
        status: 200,
        data: { stats: {}, monthlyTrend: [] },
      });

      const req = mockReq();
      const res = mockRes();

      await controller.getAnalytics(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  // ── Availability ────────────────────────────────────────────────────────────

  describe("getAvailability", () => {
    it("should return slots", async () => {
      doctorService.getAvailability.mockResolvedValue({
        status: 200,
        data: { slots: [] },
      });

      const req = mockReq();
      const res = mockRes();

      await controller.getAvailability(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe("deleteSlot", () => {
    it("should pass slotId from params", async () => {
      doctorService.deleteAvailabilitySlot.mockResolvedValue({
        status: 200,
        data: { message: "Slot deleted", slots: [] },
      });

      const req = mockReq({ params: { slotId: "slot123" } });
      const res = mockRes();

      await controller.deleteSlot(req, res);

      expect(doctorService.deleteAvailabilitySlot).toHaveBeenCalledWith({
        userId: "mock-user-id",
        slotId: "slot123",
      });
    });
  });

  // ── Appointments ────────────────────────────────────────────────────────────

  describe("getAppointments", () => {
    it("should pass all query params to service", async () => {
      doctorService.getMyAppointments.mockResolvedValue({
        status: 200,
        data: { appointments: [], pagination: {} },
      });

      const req = mockReq({
        query: { status: "pending", page: "1", limit: "5", search: "John" },
      });
      const res = mockRes();

      await controller.getAppointments(req, res);

      expect(doctorService.getMyAppointments).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: "mock-user-id",
          status: "pending",
          page: "1",
          limit: "5",
          search: "John",
        })
      );
    });
  });

  describe("updateAppointment", () => {
    it("should pass appointmentId, status, and notes", async () => {
      doctorService.updateAppointmentStatus.mockResolvedValue({
        status: 200,
        data: { message: "Appointment status updated" },
      });

      const req = mockReq({
        params: { appointmentId: "appt123" },
        body: { status: "confirmed", notes: "Note" },
      });
      const res = mockRes();

      await controller.updateAppointment(req, res);

      expect(doctorService.updateAppointmentStatus).toHaveBeenCalledWith({
        userId: "mock-user-id",
        appointmentId: "appt123",
        status: "confirmed",
        notes: "Note",
      });
    });
  });

  describe("deleteAppointment", () => {
    it("should delete with appointmentId", async () => {
      doctorService.deleteAppointment.mockResolvedValue({
        status: 200,
        data: { message: "Appointment deleted successfully" },
      });

      const req = mockReq({ params: { appointmentId: "appt456" } });
      const res = mockRes();

      await controller.deleteAppointment(req, res);

      expect(doctorService.deleteAppointment).toHaveBeenCalledWith({
        userId: "mock-user-id",
        appointmentId: "appt456",
      });
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  // ── Patients ────────────────────────────────────────────────────────────────

  describe("getPatients", () => {
    it("should pass query params to getMyPatients", async () => {
      doctorService.getMyPatients.mockResolvedValue({
        status: 200,
        data: { patients: [], pagination: {} },
      });

      const req = mockReq({ query: { search: "Jane", page: "2" } });
      const res = mockRes();

      await controller.getPatients(req, res);

      expect(doctorService.getMyPatients).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: "mock-user-id",
          search: "Jane",
          page: "2",
        })
      );
    });
  });

  describe("getPatientDetail", () => {
    it("should pass patientId from params", async () => {
      doctorService.getPatientDetail.mockResolvedValue({
        status: 200,
        data: { patient: {}, appointments: [], records: [] },
      });

      const req = mockReq({ params: { patientId: "pat123" } });
      const res = mockRes();

      await controller.getPatientDetail(req, res);

      expect(doctorService.getPatientDetail).toHaveBeenCalledWith({
        userId: "mock-user-id",
        patientDbId: "pat123",
      });
    });
  });

  // ── Medical Records ─────────────────────────────────────────────────────────

  describe("createRecord", () => {
    it("should pass request body as data", async () => {
      const body = { patientId: "p1", diagnosis: "Test" };
      doctorService.createMedicalRecord.mockResolvedValue({
        status: 201,
        data: { message: "Medical record created" },
      });

      const req = mockReq({ body });
      const res = mockRes();

      await controller.createRecord(req, res);

      expect(doctorService.createMedicalRecord).toHaveBeenCalledWith({
        userId: "mock-user-id",
        data: body,
      });
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  describe("updateRecord", () => {
    it("should pass recordId and updates", async () => {
      doctorService.updateMedicalRecord.mockResolvedValue({
        status: 200,
        data: { message: "Record updated" },
      });

      const req = mockReq({
        params: { recordId: "rec123" },
        body: { diagnosis: "Updated" },
      });
      const res = mockRes();

      await controller.updateRecord(req, res);

      expect(doctorService.updateMedicalRecord).toHaveBeenCalledWith({
        userId: "mock-user-id",
        recordId: "rec123",
        updates: { diagnosis: "Updated" },
      });
    });
  });

  // ── Prescriptions ───────────────────────────────────────────────────────────

  describe("savePrescription", () => {
    it("should call service with body data", async () => {
      doctorService.savePrescription.mockResolvedValue({
        status: 201,
        data: { message: "Prescription saved" },
      });

      const body = { patientId: "p1", medicines: [] };
      const req = mockReq({ body });
      const res = mockRes();

      await controller.savePrescription(req, res);

      expect(doctorService.savePrescription).toHaveBeenCalledWith({
        userId: "mock-user-id",
        data: body,
      });
    });
  });

  describe("getPrescriptions", () => {
    it("should pass query params", async () => {
      doctorService.getMyPrescriptions.mockResolvedValue({
        status: 200,
        data: { prescriptions: [], pagination: {} },
      });

      const req = mockReq({ query: { page: "1", limit: "10" } });
      const res = mockRes();

      await controller.getPrescriptions(req, res);

      expect(doctorService.getMyPrescriptions).toHaveBeenCalledWith(
        expect.objectContaining({ userId: "mock-user-id", page: "1" })
      );
    });
  });

  describe("downloadPrescription", () => {
    it("should return 400 if url is missing", async () => {
      const req = mockReq({ query: {} });
      const res = mockRes();

      await controller.downloadPrescription(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "url is required" });
    });

    it("should return 403 for non-Cloudinary URL", async () => {
      const req = mockReq({
        query: { url: "https://evil-site.com/malware.pdf" },
      });
      const res = mockRes();

      await controller.downloadPrescription(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: "URL not allowed" });
    });

    it("should return 400 for invalid URL", async () => {
      const req = mockReq({ query: { url: "not-a-url" } });
      const res = mockRes();

      await controller.downloadPrescription(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "Invalid URL" });
    });
  });

  // ── Ratings ─────────────────────────────────────────────────────────────────

  describe("getRatings", () => {
    it("should return ratings", async () => {
      doctorService.getMyRatings.mockResolvedValue({
        status: 200,
        data: { ratings: [], averageRating: 4.5 },
      });

      const req = mockReq({ query: { page: "1" } });
      const res = mockRes();

      await controller.getRatings(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  // ── Public ──────────────────────────────────────────────────────────────────

  describe("listDoctors", () => {
    it("should pass query to getPublicDoctors", async () => {
      doctorService.getPublicDoctors.mockResolvedValue({
        status: 200,
        data: { doctors: [] },
      });

      const req = mockReq({ query: { search: "Cardio" } });
      const res = mockRes();

      await controller.listDoctors(req, res);

      expect(doctorService.getPublicDoctors).toHaveBeenCalledWith({
        search: "Cardio",
      });
    });
  });

  // ── Account Deactivation ────────────────────────────────────────────────────

  describe("deactivateAccount", () => {
    it("should call deactivateDoctorAccount with userId", async () => {
      doctorService.deactivateDoctorAccount.mockResolvedValue({
        status: 200,
        data: { message: "Account permanently deleted" },
      });

      const req = mockReq();
      const res = mockRes();

      await controller.deactivateAccount(req, res);

      expect(doctorService.deactivateDoctorAccount).toHaveBeenCalledWith({
        userId: "mock-user-id",
      });
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });
});
