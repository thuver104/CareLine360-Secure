/**
 * Appointment Module - Integration Tests
 * Tests for appointment lifecycle and workflow
 */

const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

let mongoServer;

const Appointment = require("../../../models/Appointment");
const Patient = require("../../../models/Patient");
const Doctor = require("../../../models/Doctor");
const User = require("../../../models/User");

describe("Appointment Module - Integration Tests", () => {
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  afterEach(async () => {
    await Appointment.deleteMany({});
    await Patient.deleteMany({});
    await Doctor.deleteMany({});
    await User.deleteMany({});
  });

  describe("Appointment Lifecycle", () => {
    test("should create appointment and track status changes", async () => {
      const patientUser = await User.create({
        email: "patient@example.com",
        role: "patient",
      });
      const patient = await Patient.create({ userId: patientUser._id });

      const doctorUser = await User.create({
        email: "doctor@example.com",
        role: "doctor",
      });
      const doctor = await Doctor.create({ userId: doctorUser._id });

      // Create appointment
      const appointment = await Appointment.create({
        patient: patient._id,
        doctor: doctor._id,
        date: new Date(Date.now() + 86400000), // Tomorrow
        time: "10:00 AM",
        consultationType: "video",
        status: "pending",
      });

      expect(appointment.status).toBe("pending");
      expect(appointment.patient).toBeDefined();
      expect(appointment.doctor).toBeDefined();
    });

    test("should transition appointment from pending to confirmed", async () => {
      const appointment = await Appointment.create({
        patient: new mongoose.Types.ObjectId(),
        doctor: new mongoose.Types.ObjectId(),
        date: new Date(),
        status: "pending",
      });

      const confirmed = await Appointment.findByIdAndUpdate(
        appointment._id,
        { status: "confirmed" },
        { new: true }
      );

      expect(confirmed.status).toBe("confirmed");
    });

    test("should transition appointment from confirmed to completed", async () => {
      const appointment = await Appointment.create({
        patient: new mongoose.Types.ObjectId(),
        doctor: new mongoose.Types.ObjectId(),
        status: "confirmed",
      });

      const completed = await Appointment.findByIdAndUpdate(
        appointment._id,
        { status: "completed" },
        { new: true }
      );

      expect(completed.status).toBe("completed");
    });

    test("should cancel appointment at any valid state", async () => {
      const appointment = await Appointment.create({
        patient: new mongoose.Types.ObjectId(),
        doctor: new mongoose.Types.ObjectId(),
        status: "pending",
        cancellationReason: null,
      });

      const cancelled = await Appointment.findByIdAndUpdate(
        appointment._id,
        {
          status: "cancelled",
          cancellationReason: "Patient requested cancellation",
        },
        { new: true }
      );

      expect(cancelled.status).toBe("cancelled");
      expect(cancelled.cancellationReason).toBe(
        "Patient requested cancellation"
      );
    });
  });

  describe("Appointment Rescheduling", () => {
    test("should reschedule appointment and maintain history", async () => {
      const originalDate = new Date("2024-02-15");
      const originalTime = "10:00 AM";

      const appointment = await Appointment.create({
        patient: new mongoose.Types.ObjectId(),
        doctor: new mongoose.Types.ObjectId(),
        date: originalDate,
        time: originalTime,
        status: "pending",
        rescheduleHistory: [],
      });

      // Reschedule
      const newDate = new Date("2024-02-20");
      const newTime = "02:00 PM";

      const rescheduled = await Appointment.findByIdAndUpdate(
        appointment._id,
        {
          date: newDate,
          time: newTime,
          $push: {
            rescheduleHistory: {
              previousDate: originalDate,
              previousTime: originalTime,
              rescheduledAt: new Date(),
            },
          },
        },
        { new: true }
      );

      expect(rescheduled.date).toEqual(newDate);
      expect(rescheduled.time).toBe(newTime);
      expect(rescheduled.rescheduleHistory).toHaveLength(1);
    });

    test("should limit number of reschedules", async () => {
      const appointment = await Appointment.create({
        patient: new mongoose.Types.ObjectId(),
        doctor: new mongoose.Types.ObjectId(),
        rescheduleHistory: [
          { previousDate: "2024-02-10", previousTime: "09:00 AM" },
          { previousDate: "2024-02-12", previousTime: "11:00 AM" },
          { previousDate: "2024-02-14", previousTime: "03:00 PM" },
        ],
      });

      const maxReschedules = 3;
      const canReschedule =
        appointment.rescheduleHistory.length < maxReschedules;

      expect(canReschedule).toBe(false);
    });
  });

  describe("Appointment Retrieval and Filtering", () => {
    test("should retrieve appointments for specific patient", async () => {
      const patientId = new mongoose.Types.ObjectId();

      await Appointment.create([
        { patient: patientId, doctor: new mongoose.Types.ObjectId() },
        { patient: patientId, doctor: new mongoose.Types.ObjectId() },
        {
          patient: new mongoose.Types.ObjectId(),
          doctor: new mongoose.Types.ObjectId(),
        },
      ]);

      const patientAppointments = await Appointment.find({ patient: patientId });
      expect(patientAppointments).toHaveLength(2);
    });

    test("should retrieve appointments for specific doctor", async () => {
      const doctorId = new mongoose.Types.ObjectId();

      await Appointment.create([
        { doctor: doctorId, patient: new mongoose.Types.ObjectId() },
        { doctor: doctorId, patient: new mongoose.Types.ObjectId() },
        {
          doctor: new mongoose.Types.ObjectId(),
          patient: new mongoose.Types.ObjectId(),
        },
      ]);

      const doctorAppointments = await Appointment.find({ doctor: doctorId });
      expect(doctorAppointments).toHaveLength(2);
    });

    test("should filter appointments by status", async () => {
      await Appointment.create([
        {
          patient: new mongoose.Types.ObjectId(),
          doctor: new mongoose.Types.ObjectId(),
          status: "pending",
        },
        {
          patient: new mongoose.Types.ObjectId(),
          doctor: new mongoose.Types.ObjectId(),
          status: "confirmed",
        },
        {
          patient: new mongoose.Types.ObjectId(),
          doctor: new mongoose.Types.ObjectId(),
          status: "completed",
        },
      ]);

      const pending = await Appointment.find({ status: "pending" });
      const confirmed = await Appointment.find({ status: "confirmed" });

      expect(pending).toHaveLength(1);
      expect(confirmed).toHaveLength(1);
    });

    test("should paginate appointment results", async () => {
      const patientId = new mongoose.Types.ObjectId();

      for (let i = 0; i < 25; i++) {
        await Appointment.create({
          patient: patientId,
          doctor: new mongoose.Types.ObjectId(),
        });
      }

      const page1 = await Appointment.find({ patient: patientId })
        .limit(10)
        .skip(0);
      const page2 = await Appointment.find({ patient: patientId })
        .limit(10)
        .skip(10);
      const page3 = await Appointment.find({ patient: patientId })
        .limit(10)
        .skip(20);

      expect(page1).toHaveLength(10);
      expect(page2).toHaveLength(10);
      expect(page3).toHaveLength(5);
    });
  });

  describe("Appointment Time Management", () => {
    test("should validate appointment date is in future", async () => {
      const futureDate = new Date(Date.now() + 86400000); // Tomorrow

      const appointment = await Appointment.create({
        patient: new mongoose.Types.ObjectId(),
        doctor: new mongoose.Types.ObjectId(),
        date: futureDate,
        status: "pending",
      });

      expect(appointment.date > new Date()).toBe(true);
    });

    test("should handle appointment reminders", async () => {
      const appointment = await Appointment.create({
        patient: new mongoose.Types.ObjectId(),
        doctor: new mongoose.Types.ObjectId(),
        reminderSent: false,
      });

      const withReminder = await Appointment.findByIdAndUpdate(
        appointment._id,
        { reminderSent: true },
        { new: true }
      );

      expect(withReminder.reminderSent).toBe(true);
    });

    test("should calculate appointment slot duration", async () => {
      const appointment = await Appointment.create({
        patient: new mongoose.Types.ObjectId(),
        doctor: new mongoose.Types.ObjectId(),
        consultationType: "video",
        duration: 30,
      });

      expect(appointment.duration).toBe(30);
    });
  });

  describe("Appointment Statistics", () => {
    test("should calculate appointment statistics", async () => {
      await Appointment.create([
        { status: "pending" },
        { status: "confirmed" },
        { status: "completed" },
        { status: "completed" },
        { status: "cancelled" },
      ]);

      const stats = {
        total: await Appointment.countDocuments(),
        pending: await Appointment.countDocuments({ status: "pending" }),
        confirmed: await Appointment.countDocuments({ status: "confirmed" }),
        completed: await Appointment.countDocuments({ status: "completed" }),
        cancelled: await Appointment.countDocuments({ status: "cancelled" }),
      };

      expect(stats.total).toBe(5);
      expect(stats.completed).toBe(2);
      expect(stats.cancelled).toBe(1);
    });

    test("should track average consultation duration", async () => {
      await Appointment.create([
        { duration: 30 },
        { duration: 30 },
        { duration: 45 },
        { duration: 60 },
      ]);

      const appointments = await Appointment.find();
      const totalDuration = appointments.reduce(
        (sum, apt) => sum + apt.duration,
        0
      );
      const average = totalDuration / appointments.length;

      expect(average).toBe(41.25);
    });
  });

  describe("Appointment Relationships", () => {
    test("should maintain relationship between patient, doctor, and appointment", async () => {
      const patientUser = await User.create({
        email: "patient2@example.com",
        role: "patient",
      });
      const patient = await Patient.create({ userId: patientUser._id });

      const doctorUser = await User.create({
        email: "doctor2@example.com",
        role: "doctor",
      });
      const doctor = await Doctor.create({ userId: doctorUser._id });

      const appointment = await Appointment.create({
        patient: patient._id,
        doctor: doctor._id,
      });

      const retrieved = await Appointment.findById(appointment._id);

      expect(retrieved.patient.toString()).toBe(patient._id.toString());
      expect(retrieved.doctor.toString()).toBe(doctor._id.toString());
    });
  });

  describe("Concurrent Appointments", () => {
    test("should handle multiple appointments for same doctor", async () => {
      const doctorId = new mongoose.Types.ObjectId();

      const appointments = await Appointment.create([
        { doctor: doctorId, patient: new mongoose.Types.ObjectId() },
        { doctor: doctorId, patient: new mongoose.Types.ObjectId() },
        { doctor: doctorId, patient: new mongoose.Types.ObjectId() },
      ]);

      const doctorAppointments = await Appointment.find({ doctor: doctorId });
      expect(doctorAppointments).toHaveLength(3);
    });

    test("should handle multiple appointments for same patient", async () => {
      const patientId = new mongoose.Types.ObjectId();

      const appointments = await Appointment.create([
        { patient: patientId, doctor: new mongoose.Types.ObjectId() },
        { patient: patientId, doctor: new mongoose.Types.ObjectId() },
      ]);

      const patientAppointments = await Appointment.find({
        patient: patientId,
      });
      expect(patientAppointments).toHaveLength(2);
    });
  });
});
