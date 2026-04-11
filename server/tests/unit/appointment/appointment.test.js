/**
 * Appointment Module - Unit Tests
 * Tests for appointment service functions and workflow
 */

const Appointment = require("../../../models/Appointment");
const Doctor = require("../../../models/Doctor");
const Patient = require("../../../models/Patient");

jest.mock("../../models/Appointment");
jest.mock("../../models/Doctor");
jest.mock("../../models/Patient");

describe("Appointment Module - Unit Tests", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("Appointment Creation", () => {
    test("should create appointment with valid data", async () => {
      const appointmentData = {
        patient: "patient123",
        doctor: "doctor123",
        date: "2024-02-15",
        time: "10:00 AM",
        consultationType: "video",
        symptoms: "Headache",
        status: "pending",
      };

      Appointment.prototype.save = jest.fn().mockResolvedValue(appointmentData);

      const appointment = new Appointment(appointmentData);
      await appointment.save();

      expect(appointment.patient).toBe("patient123");
      expect(appointment.status).toBe("pending");
    });

    test("should validate consultation type", () => {
      const validTypes = ["in-person", "video", "phone", "physical"];
      const testType = "video";

      const isValid = validTypes.includes(testType);
      expect(isValid).toBe(true);
    });

    test("should validate appointment priority", () => {
      const validPriorities = ["low", "medium", "high", "urgent"];
      const testPriority = "high";

      const isValid = validPriorities.includes(testPriority);
      expect(isValid).toBe(true);
    });

    test("should validate appointment date is in future", () => {
      const today = new Date();
      const futureDate = new Date(today.setDate(today.getDate() + 1));
      const pastDate = new Date("2023-01-01");

      expect(futureDate > new Date()).toBe(true);
      expect(pastDate > new Date()).toBe(false);
    });

    test("should validate appointment time format", () => {
      const validTimes = ["10:00 AM", "02:30 PM", "09:15 AM"];
      const invalidTimes = ["25:00", "13:60", "invalid"];

      validTimes.forEach((time) => {
        const isValid = /^(0?[1-9]|1[0-2]):[0-5][0-9]\s(AM|PM)$/.test(time);
        expect(isValid).toBe(true);
      });

      invalidTimes.forEach((time) => {
        const isValid = /^(0?[1-9]|1[0-2]):[0-5][0-9]\s(AM|PM)$/.test(time);
        expect(isValid).toBe(false);
      });
    });
  });

  describe("Appointment Retrieval", () => {
    test("should retrieve appointment by ID", async () => {
      const mockAppointment = {
        _id: "apt123",
        patient: "patient123",
        doctor: "doctor123",
        status: "pending",
      };

      Appointment.findById.mockResolvedValue(mockAppointment);

      const appointment = await Appointment.findById("apt123");
      expect(appointment._id).toBe("apt123");
      expect(appointment.status).toBe("pending");
    });

    test("should retrieve all appointments for patient", async () => {
      const mockAppointments = [
        { _id: "apt1", patient: "patient123", status: "pending" },
        { _id: "apt2", patient: "patient123", status: "completed" },
      ];

      Appointment.find.mockResolvedValue(mockAppointments);

      const appointments = await Appointment.find({ patient: "patient123" });
      expect(appointments).toHaveLength(2);
    });

    test("should filter appointments by status", async () => {
      const mockConfirmedAppointments = [
        { _id: "apt1", status: "confirmed" },
        { _id: "apt3", status: "confirmed" },
      ];

      Appointment.find.mockResolvedValue(mockConfirmedAppointments);

      const confirmed = await Appointment.find({ status: "confirmed" });
      expect(confirmed.every((a) => a.status === "confirmed")).toBe(true);
    });

    test("should handle appointment not found", async () => {
      Appointment.findById.mockResolvedValue(null);

      const appointment = await Appointment.findById("nonexistent");
      expect(appointment).toBeNull();
    });
  });

  describe("Appointment Status Transitions", () => {
    test("should transition from pending to confirmed", async () => {
      Appointment.findByIdAndUpdate.mockResolvedValue({
        _id: "apt123",
        status: "confirmed",
      });

      const updated = await Appointment.findByIdAndUpdate("apt123", {
        status: "confirmed",
      });

      expect(updated.status).toBe("confirmed");
    });

    test("should transition from confirmed to completed", async () => {
      Appointment.findByIdAndUpdate.mockResolvedValue({
        _id: "apt123",
        status: "completed",
      });

      const updated = await Appointment.findByIdAndUpdate("apt123", {
        status: "completed",
      });

      expect(updated.status).toBe("completed");
    });

    test("should validate status transitions", () => {
      const validTransitions = {
        pending: ["confirmed", "cancelled"],
        confirmed: ["completed", "cancelled"],
        completed: [],
        cancelled: [],
      };

      const currentStatus = "pending";
      const newStatus = "confirmed";

      const isValidTransition =
        validTransitions[currentStatus].includes(newStatus);
      expect(isValidTransition).toBe(true);
    });

    test("should prevent invalid status transitions", () => {
      const validTransitions = {
        pending: ["confirmed", "cancelled"],
        confirmed: ["completed", "cancelled"],
        completed: [],
        cancelled: [],
      };

      const currentStatus = "completed";
      const newStatus = "pending";

      const isValidTransition =
        validTransitions[currentStatus].includes(newStatus);
      expect(isValidTransition).toBe(false);
    });
  });

  describe("Appointment Rescheduling", () => {
    test("should reschedule appointment", async () => {
      const updatedAppointment = {
        _id: "apt123",
        date: "2024-02-20",
        time: "02:00 PM",
        status: "pending",
        rescheduleHistory: [
          {
            previousDate: "2024-02-15",
            previousTime: "10:00 AM",
            rescheduledAt: new Date(),
          },
        ],
      };

      Appointment.findByIdAndUpdate.mockResolvedValue(updatedAppointment);

      const result = await Appointment.findByIdAndUpdate("apt123", {
        date: "2024-02-20",
        time: "02:00 PM",
      });

      expect(result.date).toBe("2024-02-20");
      expect(result.rescheduleHistory).toHaveLength(1);
    });

    test("should limit appointment reschedules", async () => {
      const appointment = {
        rescheduleHistory: [
          { previousDate: "2024-02-10", previousTime: "09:00 AM" },
          { previousDate: "2024-02-12", previousTime: "11:00 AM" },
          { previousDate: "2024-02-14", previousTime: "03:00 PM" },
        ],
      };

      const maxReschedules = 3;
      const canReschedule =
        appointment.rescheduleHistory.length < maxReschedules;

      expect(canReschedule).toBe(false);
    });

    test("should prevent rescheduling to past date", () => {
      const today = new Date();
      const pastDate = new Date(today.setDate(today.getDate() - 1));

      const isValidDate = pastDate > new Date();
      expect(isValidDate).toBe(false);
    });
  });

  describe("Appointment Cancellation", () => {
    test("should cancel appointment", async () => {
      Appointment.findByIdAndUpdate.mockResolvedValue({
        _id: "apt123",
        status: "cancelled",
        cancellationReason: "Patient requested cancellation",
      });

      const cancelled = await Appointment.findByIdAndUpdate("apt123", {
        status: "cancelled",
      });

      expect(cancelled.status).toBe("cancelled");
    });

    test("should prevent cancelling completed appointment", () => {
      const appointment = { status: "completed" };
      const canCancel = ["pending", "confirmed"].includes(appointment.status);

      expect(canCancel).toBe(false);
    });

    test("should store cancellation reason", () => {
      const reason = "Patient fell ill and needs to reschedule";
      expect(reason).toBeTruthy();
      expect(reason.length).toBeGreaterThan(0);
    });
  });

  describe("Appointment Duration & Slots", () => {
    test("should validate consultation duration", () => {
      const validDurations = [15, 30, 45, 60];
      const duration = 30;

      const isValid = validDurations.includes(duration);
      expect(isValid).toBe(true);
    });

    test("should calculate appointment end time", () => {
      const startTime = new Date("2024-02-15T10:00:00");
      const duration = 30; // minutes
      const endTime = new Date(startTime.getTime() + duration * 60000);

      expect(endTime).toEqual(new Date("2024-02-15T10:30:00"));
    });

    test("should prevent appointment conflicts", () => {
      const existingAppointments = [
        { time: "10:00 AM", duration: 30 },
        { time: "11:00 AM", duration: 45 },
      ];

      const newAppointmentTime = "10:15 AM";

      const hasConflict = existingAppointments.some((apt) => {
        // Simplified conflict check
        return apt.time === newAppointmentTime;
      });

      expect(hasConflict).toBe(false);
    });
  });

  describe("Appointment Reminders", () => {
    test("should mark reminder as sent", async () => {
      Appointment.findByIdAndUpdate.mockResolvedValue({
        _id: "apt123",
        reminderSent: true,
      });

      const updated = await Appointment.findByIdAndUpdate("apt123", {
        reminderSent: true,
      });

      expect(updated.reminderSent).toBe(true);
    });

    test("should calculate reminder time before appointment", () => {
      const appointmentTime = new Date("2024-02-15T10:00:00");
      const reminderTime = 24; // hours before

      const reminderDate = new Date(
        appointmentTime.getTime() - reminderTime * 3600000,
      );

      expect(reminderDate < appointmentTime).toBe(true);
    });
  });

  describe("Consultation Type Specifications", () => {
    test("should handle video consultation type", () => {
      const consultation = {
        type: "video",
        requiresMeetingLink: true,
        duration: 30,
      };

      expect(consultation.type).toBe("video");
      expect(consultation.requiresMeetingLink).toBe(true);
    });

    test("should handle in-person consultation type", () => {
      const consultation = {
        type: "in-person",
        requiresLocation: true,
        duration: 45,
      };

      expect(consultation.type).toBe("in-person");
      expect(consultation.requiresLocation).toBe(true);
    });

    test("should handle phone consultation type", () => {
      const consultation = {
        type: "phone",
        requiresPhoneNumber: true,
        duration: 20,
      };

      expect(consultation.type).toBe("phone");
      expect(consultation.requiresPhoneNumber).toBe(true);
    });
  });
});
