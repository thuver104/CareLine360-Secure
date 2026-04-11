/**
 * Admin Module - Integration Tests
 * Tests for admin operations and user management workflows
 */

const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

let mongoServer;

const User = require("../../../models/User");
const Doctor = require("../../../models/Doctor");
const Appointment = require("../../../models/Appointment");
const EmergencyCase = require("../../../models/EmergencyCase");

describe("Admin Module - Integration Tests", () => {
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
    await User.deleteMany({});
    await Doctor.deleteMany({});
    await Appointment.deleteMany({});
    await EmergencyCase.deleteMany({});
  });

  describe("User Management Workflow", () => {
    test("should create and retrieve multiple users with different roles", async () => {
      const users = await User.create([
        { email: "patient@example.com", role: "patient" },
        { email: "doctor@example.com", role: "doctor" },
        { email: "admin@example.com", role: "admin" },
      ]);

      expect(users).toHaveLength(3);

      const patients = await User.find({ role: "patient" });
      expect(patients).toHaveLength(1);
      expect(patients[0].email).toBe("patient@example.com");
    });

    test("should update user status and track changes", async () => {
      const user = await User.create({
        email: "newuser@example.com",
        role: "patient",
        status: "PENDING",
      });

      // Admin approves user
      const approved = await User.findByIdAndUpdate(
        user._id,
        { status: "ACTIVE" },
        { new: true }
      );

      expect(approved.status).toBe("ACTIVE");
    });

    test("should suspend user account", async () => {
      const user = await User.create({
        email: "suspend@example.com",
        role: "patient",
        status: "ACTIVE",
      });

      const suspended = await User.findByIdAndUpdate(
        user._id,
        { status: "SUSPENDED" },
        { new: true }
      );

      expect(suspended.status).toBe("SUSPENDED");
    });

    test("should delete user and maintain data integrity", async () => {
      const user = await User.create({
        email: "delete@example.com",
        role: "patient",
      });

      await User.findByIdAndDelete(user._id);

      const found = await User.findById(user._id);
      expect(found).toBeNull();
    });
  });

  describe("Doctor Verification Workflow", () => {
    test("should handle doctor verification process", async () => {
      const user = await User.create({
        email: "doctor@medical.com",
        role: "doctor",
      });

      const doctor = await Doctor.create({
        userId: user._id,
        fullName: "Dr. Smith",
        specialization: "Cardiology",
        licenseNumber: "MED-2024-001",
        status: "PENDING",
      });

      // Admin verifies doctor
      const verified = await Doctor.findByIdAndUpdate(
        doctor._id,
        { status: "VERIFIED" },
        { new: true }
      );

      expect(verified.status).toBe("VERIFIED");
    });

    test("should retrieve pending doctors for admin review", async () => {
      await Doctor.create([
        {
          userId: new mongoose.Types.ObjectId(),
          fullName: "Dr. Johnson",
          status: "PENDING",
        },
        {
          userId: new mongoose.Types.ObjectId(),
          fullName: "Dr. Williams",
          status: "PENDING",
        },
        {
          userId: new mongoose.Types.ObjectId(),
          fullName: "Dr. Brown",
          status: "VERIFIED",
        },
      ]);

      const pending = await Doctor.find({ status: "PENDING" });
      expect(pending).toHaveLength(2);
    });

    test("should reject doctor application", async () => {
      const doctor = await Doctor.create({
        userId: new mongoose.Types.ObjectId(),
        fullName: "Dr. Applicant",
        status: "PENDING",
      });

      const rejected = await Doctor.findByIdAndUpdate(
        doctor._id,
        { status: "REJECTED" },
        { new: true }
      );

      expect(rejected.status).toBe("REJECTED");
    });
  });

  describe("Appointment Oversight", () => {
    test("should retrieve all appointments for admin dashboard", async () => {
      await Appointment.create([
        {
          patientId: new mongoose.Types.ObjectId(),
          doctorId: new mongoose.Types.ObjectId(),
          status: "pending",
        },
        {
          patientId: new mongoose.Types.ObjectId(),
          doctorId: new mongoose.Types.ObjectId(),
          status: "confirmed",
        },
        {
          patientId: new mongoose.Types.ObjectId(),
          doctorId: new mongoose.Types.ObjectId(),
          status: "completed",
        },
      ]);

      const allAppointments = await Appointment.find();
      expect(allAppointments).toHaveLength(3);

      const confirmed = await Appointment.find({ status: "confirmed" });
      expect(confirmed).toHaveLength(1);
    });

    test("should calculate appointment statistics", async () => {
      await Appointment.create([
        { patientId: new mongoose.Types.ObjectId(), status: "completed" },
        { patientId: new mongoose.Types.ObjectId(), status: "completed" },
        { patientId: new mongoose.Types.ObjectId(), status: "cancelled" },
      ]);

      const completed = await Appointment.countDocuments({
        status: "completed",
      });
      const cancelled = await Appointment.countDocuments({
        status: "cancelled",
      });

      expect(completed).toBe(2);
      expect(cancelled).toBe(1);
    });
  });

  describe("Emergency Response Management", () => {
    test("should create and track emergency cases", async () => {
      const emergency = await EmergencyCase.create({
        patientId: new mongoose.Types.ObjectId(),
        title: "Severe Chest Pain",
        severity: "critical",
        status: "pending",
        location: { latitude: 6.9271, longitude: 80.7744 },
      });

      expect(emergency.status).toBe("pending");
      expect(emergency.severity).toBe("critical");
    });

    test("should update emergency status through workflow", async () => {
      const emergency = await EmergencyCase.create({
        patientId: new mongoose.Types.ObjectId(),
        title: "Emergency",
        status: "pending",
      });

      // Responder accepts
      let updated = await EmergencyCase.findByIdAndUpdate(
        emergency._id,
        { status: "responding" },
        { new: true }
      );
      expect(updated.status).toBe("responding");

      // Emergency resolved
      updated = await EmergencyCase.findByIdAndUpdate(
        emergency._id,
        { status: "resolved" },
        { new: true }
      );
      expect(updated.status).toBe("resolved");
    });

    test("should retrieve emergencies by severity", async () => {
      await EmergencyCase.create([
        { patientId: new mongoose.Types.ObjectId(), severity: "critical" },
        { patientId: new mongoose.Types.ObjectId(), severity: "critical" },
        { patientId: new mongoose.Types.ObjectId(), severity: "high" },
      ]);

      const critical = await EmergencyCase.find({ severity: "critical" });
      expect(critical).toHaveLength(2);
    });
  });

  describe("System Statistics and Reporting", () => {
    test("should calculate system-wide statistics", async () => {
      // Create test data
      await User.create([
        { email: "user1@example.com", role: "patient" },
        { email: "user2@example.com", role: "patient" },
        { email: "user3@example.com", role: "doctor" },
      ]);

      const totalUsers = await User.countDocuments();
      const patientCount = await User.countDocuments({ role: "patient" });
      const doctorCount = await User.countDocuments({ role: "doctor" });

      expect(totalUsers).toBe(3);
      expect(patientCount).toBe(2);
      expect(doctorCount).toBe(1);
    });

    test("should generate appointment statistics", async () => {
      await Appointment.create([
        { status: "pending" },
        { status: "confirmed" },
        { status: "completed" },
        { status: "completed" },
      ]);

      const stats = {
        total: await Appointment.countDocuments(),
        pending: await Appointment.countDocuments({ status: "pending" }),
        confirmed: await Appointment.countDocuments({ status: "confirmed" }),
        completed: await Appointment.countDocuments({ status: "completed" }),
      };

      expect(stats.total).toBe(4);
      expect(stats.completed).toBe(2);
      expect(stats.pending).toBe(1);
    });

    test("should calculate emergency statistics", async () => {
      await EmergencyCase.create([
        { severity: "critical", status: "pending" },
        { severity: "critical", status: "pending" },
        { severity: "high", status: "resolved" },
      ]);

      const stats = {
        total: await EmergencyCase.countDocuments(),
        critical: await EmergencyCase.countDocuments({
          severity: "critical",
        }),
        pending: await EmergencyCase.countDocuments({ status: "pending" }),
        resolved: await EmergencyCase.countDocuments({ status: "resolved" }),
      };

      expect(stats.total).toBe(3);
      expect(stats.critical).toBe(2);
      expect(stats.pending).toBe(2);
    });
  });

  describe("Data Integrity and Constraints", () => {
    test("should maintain user role integrity", async () => {
      const validRoles = ["patient", "doctor", "admin", "responder"];

      const users = await User.create([
        { email: "valid1@example.com", role: "patient" },
        { email: "valid2@example.com", role: "doctor" },
      ]);

      users.forEach((user) => {
        expect(validRoles).toContain(user.role);
      });
    });

    test("should track user creation timestamps", async () => {
      const user = await User.create({
        email: "timestamp@example.com",
        role: "patient",
      });

      expect(user.createdAt).toBeDefined();
      expect(user.createdAt instanceof Date).toBe(true);
    });
  });
});
