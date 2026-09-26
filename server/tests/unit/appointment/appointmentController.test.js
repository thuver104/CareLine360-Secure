jest.mock("../../../services/appointmentService");

const appointmentService = require("../../../services/appointmentService");
const controller = require("../../../controllers/appointmentController");

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe("Appointment Controller", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  // ─── createAppointment ────────────────────────────────────────────

  describe("createAppointment", () => {
    it("should set req.body.patient from req.user and return 201", async () => {
      const req = {
        user: { userId: "user123" },
        body: { doctor: "doc1", date: "2026-04-01", time: "10:00" },
      };
      const res = mockRes();
      const next = jest.fn();

      const mockAppt = { _id: "appt1", status: "pending" };
      appointmentService.createAppointment.mockResolvedValue(mockAppt);

      await controller.createAppointment(req, res, next);

      expect(req.body.patient).toBe("user123");
      expect(appointmentService.createAppointment).toHaveBeenCalledWith(req.body);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: mockAppt });
    });

    it("should forward errors via next", async () => {
      const req = { user: { userId: "user123" }, body: {} };
      const res = mockRes();
      const next = jest.fn();
      const error = new Error("fail");

      appointmentService.createAppointment.mockRejectedValue(error);

      await controller.createAppointment(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  // ─── getAppointments ──────────────────────────────────────────────

  describe("getAppointments", () => {
    it("should return appointments with pagination", async () => {
      const req = { query: { status: "pending" } };
      const res = mockRes();
      const next = jest.fn();

      const mockResult = { appointments: [], pagination: { total: 0 } };
      appointmentService.getAppointments.mockResolvedValue(mockResult);

      await controller.getAppointments(req, res, next);

      expect(res.json).toHaveBeenCalledWith({ success: true, ...mockResult });
    });

    it("should forward errors via next", async () => {
      const req = { query: {} };
      const res = mockRes();
      const next = jest.fn();
      const error = new Error("fail");

      appointmentService.getAppointments.mockRejectedValue(error);

      await controller.getAppointments(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  // ─── getAppointmentById ───────────────────────────────────────────

  describe("getAppointmentById", () => {
    it("should return appointment by ID and pass req.user for ownership check", async () => {
      const req = { params: { id: "appt1" }, user: { userId: "user123", role: "patient" } };
      const res = mockRes();
      const next = jest.fn();

      const mockAppt = { _id: "appt1" };
      appointmentService.getAppointmentById.mockResolvedValue(mockAppt);

      await controller.getAppointmentById(req, res, next);

      expect(appointmentService.getAppointmentById).toHaveBeenCalledWith("appt1", req.user);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: mockAppt });
    });

    it("should forward errors via next", async () => {
      const req = { params: { id: "bad" }, user: { userId: "user123", role: "patient" } };
      const res = mockRes();
      const next = jest.fn();
      const error = new Error("not found");

      appointmentService.getAppointmentById.mockRejectedValue(error);

      await controller.getAppointmentById(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });

    it("should forward a 403 error from the service when access is denied", async () => {
      const req = { params: { id: "appt1" }, user: { userId: "attacker", role: "patient" } };
      const res = mockRes();
      const next = jest.fn();
      const error = new Error("Forbidden: you do not have access to this appointment");
      error.statusCode = 403;

      appointmentService.getAppointmentById.mockRejectedValue(error);

      await controller.getAppointmentById(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  // ─── updateAppointment ────────────────────────────────────────────

  describe("updateAppointment", () => {
    it("should update and return the appointment, passing req.user for ownership check", async () => {
      const req = {
        params: { id: "appt1" },
        body: { symptoms: "updated" },
        user: { userId: "user123", role: "patient" },
      };
      const res = mockRes();
      const next = jest.fn();

      const mockAppt = { _id: "appt1", symptoms: "updated" };
      appointmentService.updateAppointment.mockResolvedValue(mockAppt);

      await controller.updateAppointment(req, res, next);

      expect(appointmentService.updateAppointment).toHaveBeenCalledWith("appt1", { symptoms: "updated" }, req.user);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: mockAppt });
    });

    it("should forward errors via next", async () => {
      const req = { params: { id: "appt1" }, body: {}, user: { userId: "user123", role: "patient" } };
      const res = mockRes();
      const next = jest.fn();
      const error = new Error("fail");

      appointmentService.updateAppointment.mockRejectedValue(error);

      await controller.updateAppointment(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });

    it("should forward a 403 error from the service when a non-owner attempts to update", async () => {
      const req = {
        params: { id: "appt1" },
        body: { symptoms: "hacked" },
        user: { userId: "attacker", role: "patient" },
      };
      const res = mockRes();
      const next = jest.fn();
      const error = new Error("Forbidden: you do not have access to this appointment");
      error.statusCode = 403;

      appointmentService.updateAppointment.mockRejectedValue(error);

      await controller.updateAppointment(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  // ─── deleteAppointment ────────────────────────────────────────────

  describe("deleteAppointment", () => {
    it("should delete and return success message, passing req.user for ownership check", async () => {
      const req = { params: { id: "appt1" }, user: { userId: "user123", role: "patient" } };
      const res = mockRes();
      const next = jest.fn();

      appointmentService.deleteAppointment.mockResolvedValue({ message: "Appointment deleted" });

      await controller.deleteAppointment(req, res, next);

      expect(appointmentService.deleteAppointment).toHaveBeenCalledWith("appt1", req.user);
      expect(res.json).toHaveBeenCalledWith({ success: true, message: "Appointment deleted" });
    });

    it("should forward errors via next", async () => {
      const req = { params: { id: "appt1" }, user: { userId: "user123", role: "patient" } };
      const res = mockRes();
      const next = jest.fn();
      const error = new Error("fail");

      appointmentService.deleteAppointment.mockRejectedValue(error);

      await controller.deleteAppointment(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });

    it("should forward a 403 error from the service when a non-owner attempts to delete", async () => {
      const req = { params: { id: "appt1" }, user: { userId: "attacker", role: "patient" } };
      const res = mockRes();
      const next = jest.fn();
      const error = new Error("Forbidden: you do not have access to this appointment");
      error.statusCode = 403;

      appointmentService.deleteAppointment.mockRejectedValue(error);

      await controller.deleteAppointment(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  // ─── transitionStatus ─────────────────────────────────────────────

  describe("transitionStatus", () => {
    it("should transition status and return result, passing req.user for ownership check", async () => {
      const req = {
        params: { id: "appt1" },
        body: { status: "confirmed" },
        user: { userId: "doc123", role: "doctor" },
      };
      const res = mockRes();
      const next = jest.fn();

      const mockAppt = { _id: "appt1", status: "confirmed" };
      appointmentService.transitionStatus.mockResolvedValue(mockAppt);

      await controller.transitionStatus(req, res, next);

      expect(appointmentService.transitionStatus).toHaveBeenCalledWith("appt1", "confirmed", req.user);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: mockAppt });
    });

    it("should forward errors via next", async () => {
      const req = { params: { id: "appt1" }, body: { status: "bad" }, user: { userId: "doc123", role: "doctor" } };
      const res = mockRes();
      const next = jest.fn();
      const error = new Error("fail");

      appointmentService.transitionStatus.mockRejectedValue(error);

      await controller.transitionStatus(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });

    it("should forward a 403 error from the service when a non-owning doctor attempts to transition status", async () => {
      const req = {
        params: { id: "appt1" },
        body: { status: "confirmed" },
        user: { userId: "other-doctor", role: "doctor" },
      };
      const res = mockRes();
      const next = jest.fn();
      const error = new Error("Forbidden: you do not have access to this appointment");
      error.statusCode = 403;

      appointmentService.transitionStatus.mockRejectedValue(error);

      await controller.transitionStatus(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  // ─── rescheduleAppointment ────────────────────────────────────────

  describe("rescheduleAppointment", () => {
    it("should reschedule and return result, passing req.user for ownership check", async () => {
      const req = {
        params: { id: "appt1" },
        body: { date: "2026-05-01", time: "14:00" },
        user: { userId: "user123", role: "patient" },
      };
      const res = mockRes();
      const next = jest.fn();

      const mockAppt = { _id: "appt1", date: "2026-05-01", time: "14:00" };
      appointmentService.rescheduleAppointment.mockResolvedValue(mockAppt);

      await controller.rescheduleAppointment(req, res, next);

      expect(appointmentService.rescheduleAppointment).toHaveBeenCalledWith(
        "appt1",
        "2026-05-01",
        "14:00",
        req.user
      );
      expect(res.json).toHaveBeenCalledWith({ success: true, data: mockAppt });
    });

    it("should forward errors via next", async () => {
      const req = { params: { id: "appt1" }, body: {}, user: { userId: "user123", role: "patient" } };
      const res = mockRes();
      const next = jest.fn();
      const error = new Error("fail");

      appointmentService.rescheduleAppointment.mockRejectedValue(error);

      await controller.rescheduleAppointment(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });

    it("should forward a 403 error from the service when a non-owner attempts to reschedule", async () => {
      const req = {
        params: { id: "appt1" },
        body: { date: "2026-05-01", time: "14:00" },
        user: { userId: "attacker", role: "patient" },
      };
      const res = mockRes();
      const next = jest.fn();
      const error = new Error("Forbidden: you do not have access to this appointment");
      error.statusCode = 403;

      appointmentService.rescheduleAppointment.mockRejectedValue(error);

      await controller.rescheduleAppointment(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  // ─── cancelAppointment ────────────────────────────────────────────

  describe("cancelAppointment", () => {
    it("should cancel and return result, passing req.user for ownership check", async () => {
      const req = {
        params: { id: "appt1" },
        body: { reason: "conflict" },
        user: { userId: "user123", role: "patient" },
      };
      const res = mockRes();
      const next = jest.fn();

      const mockAppt = { _id: "appt1", status: "cancelled", cancellationReason: "conflict" };
      appointmentService.cancelAppointment.mockResolvedValue(mockAppt);

      await controller.cancelAppointment(req, res, next);

      expect(appointmentService.cancelAppointment).toHaveBeenCalledWith("appt1", "conflict", req.user);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: mockAppt });
    });

    it("should forward errors via next", async () => {
      const req = { params: { id: "appt1" }, body: {}, user: { userId: "user123", role: "patient" } };
      const res = mockRes();
      const next = jest.fn();
      const error = new Error("fail");

      appointmentService.cancelAppointment.mockRejectedValue(error);

      await controller.cancelAppointment(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });

    it("should forward a 403 error from the service when a non-owner attempts to cancel", async () => {
      const req = {
        params: { id: "appt1" },
        body: { reason: "conflict" },
        user: { userId: "attacker", role: "patient" },
      };
      const res = mockRes();
      const next = jest.fn();
      const error = new Error("Forbidden: you do not have access to this appointment");
      error.statusCode = 403;

      appointmentService.cancelAppointment.mockRejectedValue(error);

      await controller.cancelAppointment(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });
});
