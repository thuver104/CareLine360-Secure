/**
 * ──────────────────────────────────────────────────────────────────────────────
 * INTEGRATION TESTS – Doctor Dashboard API Endpoints
 *
 * Full end-to-end HTTP tests using Supertest against an Express app backed by
 * an in-memory MongoDB. Tests cover:
 *   • Authentication & role-based access
 *   • All /api/doctor/* endpoints
 *   • Request validation
 *   • Error scenarios (404, 400, 403, 401)
 * ──────────────────────────────────────────────────────────────────────────────
 */

const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const express = require("express");
const request = require("supertest");
const jwt = require("jsonwebtoken");

// Models
const User = require("../../../models/User");
const Doctor = require("../../../models/Doctor");
const Patient = require("../../../models/Patient");
const Appointment = require("../../../models/Appointment");
const MedicalRecord = require("../../../models/MedicalRecord");
const Prescription = require("../../../models/Prescription");
const Rating = require("../../../models/Rating");
const Counter = require("../../../models/Counter");

// Routes & middleware
const doctorRoutes = require("../../../routes/doctorRoutes");
const errorHandler = require("../../../middleware/errorHandler");

// ── Mock external services so tests don't hit Cloudinary / SMTP ───────────────
jest.mock("../../../services/uploadService", () => ({
  uploadBase64Image: jest.fn().mockResolvedValue({
    url: "https://res.cloudinary.com/demo/image/upload/mock.jpg",
    publicId: "mock_public_id",
  }),
  deleteCloudinaryFile: jest.fn().mockResolvedValue(true),
}));
jest.mock("../../../services/emailService", () => ({
  sendEmail: jest.fn().mockResolvedValue(true),
}));
jest.mock("../../../services/meetingScheduler", () => ({
  checkAndNotify: jest.fn().mockResolvedValue(true),
  getMeetingUrl: jest.fn().mockReturnValue("https://meet.careline360.lk/mock"),
  startMeetingScheduler: jest.fn(),
}));
jest.mock("../../../services/prescriptionPdfService", () => ({
  generatePrescriptionBuffer: jest.fn().mockResolvedValue(Buffer.from("mock-pdf")),
  uploadPrescriptionBuffer: jest.fn().mockResolvedValue({
    fileUrl: "https://res.cloudinary.com/demo/raw/upload/rx.pdf",
    publicId: "rx_mock",
  }),
}));

// ── Setup ────────────────────────────────────────────────────────────────────

let mongoServer, app;
let doctorUser, doctorProfile, patientUser, patientProfile;
let doctorToken, patientToken;

const JWT_SECRET = "test-jwt-secret-for-doctor-integration";

/**
 * Generate a real JWT that the auth middleware will accept.
 */
const generateToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "1h" });
};

beforeAll(async () => {
  // Set env variable so token utils work
  process.env.JWT_ACCESS_SECRET = JWT_SECRET;

  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  // Build Express app
  app = express();
  app.use(express.json({ limit: "20mb" }));
  app.use("/api/doctor", doctorRoutes);
  app.use(errorHandler);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

// ── Seed data before each describe block ──────────────────────────────────────

beforeEach(async () => {
  // Clean
  const collections = mongoose.connection.collections;
  for (const key in collections) await collections[key].deleteMany({});

  // Doctor user
  doctorUser = await User.create({
    role: "doctor",
    fullName: "Dr. Integration",
    email: "doc@integration.com",
    passwordHash: "hashed",
    status: "ACTIVE",
    isActive: true,
    isVerified: true,
  });
  doctorToken = generateToken(doctorUser._id);

  // Doctor profile
  doctorProfile = await Doctor.create({
    userId: doctorUser._id,
    doctorId: "DOC-999001",
    fullName: "Dr. Integration",
    specialization: "Internal Medicine",
    qualifications: ["MBBS", "MD"],
    experience: 8,
    consultationFee: 3000,
    phone: "+94771111111",
  });

  // Patient user
  patientUser = await User.create({
    role: "patient",
    fullName: "Patient Test",
    email: "pat@integration.com",
    passwordHash: "hashed",
    status: "ACTIVE",
    isActive: true,
    isVerified: true,
  });
  patientToken = generateToken(patientUser._id);

  // Patient profile
  patientProfile = await Patient.create({
    userId: patientUser._id,
    patientId: "PAT-999001",
    fullName: "Patient Test",
  });
});

// ═══════════════════════════════════════════════════════════════════════════════

describe("Doctor Dashboard API – Integration Tests", () => {
  // ── Authentication & Authorization ──────────────────────────────────────────

  describe("Auth Guard", () => {
    it("should return 401 without token", async () => {
      const res = await request(app).get("/api/doctor/profile");
      expect(res.status).toBe(401);
    });

    it("should return 401 with invalid token", async () => {
      const res = await request(app)
        .get("/api/doctor/profile")
        .set("Authorization", "Bearer invalid.token.here");
      expect(res.status).toBe(401);
    });

    it("should return 403 for patient role on doctor route", async () => {
      const res = await request(app)
        .get("/api/doctor/profile")
        .set("Authorization", `Bearer ${patientToken}`);
      expect(res.status).toBe(403);
    });
  });

  // ── Profile ─────────────────────────────────────────────────────────────────

  describe("GET /api/doctor/profile", () => {
    it("should return 200 with doctor profile", async () => {
      const res = await request(app)
        .get("/api/doctor/profile")
        .set("Authorization", `Bearer ${doctorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.doctor.fullName).toBe("Dr. Integration");
      expect(res.body.doctor.specialization).toBe("Internal Medicine");
    });
  });

  describe("PUT /api/doctor/profile", () => {
    it("should update profile fields", async () => {
      const res = await request(app)
        .put("/api/doctor/profile")
        .set("Authorization", `Bearer ${doctorToken}`)
        .send({ fullName: "Dr. Updated Name", consultationFee: 5000 });

      expect(res.status).toBe(200);
      expect(res.body.doctor.fullName).toBe("Dr. Updated Name");
      expect(res.body.doctor.consultationFee).toBe(5000);
    });
  });

  describe("POST /api/doctor/profile (create duplicate)", () => {
    it("should return 409 if profile already exists", async () => {
      const res = await request(app)
        .post("/api/doctor/profile")
        .set("Authorization", `Bearer ${doctorToken}`)
        .send({ fullName: "Dr. Dup", specialization: "General" });

      expect(res.status).toBe(409);
    });
  });

  // ── Dashboard ───────────────────────────────────────────────────────────────

  describe("GET /api/doctor/dashboard", () => {
    it("should return dashboard stats", async () => {
      // Create some appointments
      await Appointment.create({
        patient: patientUser._id,
        doctor: doctorUser._id,
        date: new Date(),
        time: "09:00",
        consultationType: "in-person",
        status: "pending",
      });

      const res = await request(app)
        .get("/api/doctor/dashboard")
        .set("Authorization", `Bearer ${doctorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.doctor).toBeDefined();
      expect(res.body.stats).toBeDefined();
      expect(res.body.stats.totalAppointments).toBe(1);
    });
  });

  describe("GET /api/doctor/analytics", () => {
    it("should return analytics with monthly trend", async () => {
      const res = await request(app)
        .get("/api/doctor/analytics")
        .set("Authorization", `Bearer ${doctorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.stats).toBeDefined();
      expect(res.body.monthlyTrend).toHaveLength(6);
      expect(res.body.appointmentsByStatus).toBeDefined();
    });
  });

  // ── Availability ────────────────────────────────────────────────────────────

  describe("POST /api/doctor/availability", () => {
    it("should add slots successfully", async () => {
      const res = await request(app)
        .post("/api/doctor/availability")
        .set("Authorization", `Bearer ${doctorToken}`)
        .send({
          slots: [
            { date: "2026-04-20", startTime: "09:00", endTime: "09:30" },
            { date: "2026-04-20", startTime: "09:30", endTime: "10:00" },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.slots).toHaveLength(2);
    });

    it("should return 400 for empty slots array", async () => {
      const res = await request(app)
        .post("/api/doctor/availability")
        .set("Authorization", `Bearer ${doctorToken}`)
        .send({ slots: [] });

      expect(res.status).toBe(400);
    });
  });

  describe("GET /api/doctor/availability", () => {
    it("should return availability slots", async () => {
      const res = await request(app)
        .get("/api/doctor/availability")
        .set("Authorization", `Bearer ${doctorToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.slots)).toBe(true);
    });
  });

  describe("DELETE /api/doctor/availability/:slotId", () => {
    it("should delete an unbooked slot", async () => {
      // Add a slot first
      const addRes = await request(app)
        .post("/api/doctor/availability")
        .set("Authorization", `Bearer ${doctorToken}`)
        .send({
          slots: [{ date: "2026-04-20", startTime: "11:00", endTime: "11:30" }],
        });

      const slotId = addRes.body.slots[addRes.body.slots.length - 1]._id;

      const res = await request(app)
        .delete(`/api/doctor/availability/${slotId}`)
        .set("Authorization", `Bearer ${doctorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Slot deleted");
    });

    it("should return 404 for non-existent slot", async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .delete(`/api/doctor/availability/${fakeId}`)
        .set("Authorization", `Bearer ${doctorToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe("PUT /api/doctor/availability/:slotId", () => {
    it("should update slot times", async () => {
      const addRes = await request(app)
        .post("/api/doctor/availability")
        .set("Authorization", `Bearer ${doctorToken}`)
        .send({
          slots: [{ date: "2026-04-20", startTime: "14:00", endTime: "14:30" }],
        });

      const slotId = addRes.body.slots[addRes.body.slots.length - 1]._id;

      const res = await request(app)
        .put(`/api/doctor/availability/${slotId}`)
        .set("Authorization", `Bearer ${doctorToken}`)
        .send({ startTime: "15:00", endTime: "15:30" });

      expect(res.status).toBe(200);
    });
  });

  // ── Appointments ────────────────────────────────────────────────────────────

  describe("GET /api/doctor/appointments", () => {
    it("should list doctor appointments with pagination", async () => {
      await Appointment.create([
        {
          patient: patientUser._id,
          doctor: doctorUser._id,
          date: new Date("2026-04-15"),
          time: "09:00",
          consultationType: "in-person",
          status: "pending",
        },
        {
          patient: patientUser._id,
          doctor: doctorUser._id,
          date: new Date("2026-04-16"),
          time: "10:00",
          consultationType: "video",
          status: "confirmed",
        },
      ]);

      const res = await request(app)
        .get("/api/doctor/appointments?page=1&limit=10")
        .set("Authorization", `Bearer ${doctorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.appointments).toHaveLength(2);
      expect(res.body.pagination.total).toBe(2);
    });

    it("should filter by status", async () => {
      await Appointment.create([
        {
          patient: patientUser._id,
          doctor: doctorUser._id,
          date: new Date(),
          time: "09:00",
          consultationType: "in-person",
          status: "pending",
        },
        {
          patient: patientUser._id,
          doctor: doctorUser._id,
          date: new Date(),
          time: "10:00",
          consultationType: "in-person",
          status: "completed",
        },
      ]);

      const res = await request(app)
        .get("/api/doctor/appointments?status=completed")
        .set("Authorization", `Bearer ${doctorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.appointments).toHaveLength(1);
    });
  });

  describe("PATCH /api/doctor/appointments/:appointmentId", () => {
    it("should update appointment status", async () => {
      const appt = await Appointment.create({
        patient: patientUser._id,
        doctor: doctorUser._id,
        date: new Date(),
        time: "09:00",
        consultationType: "in-person",
        status: "pending",
      });

      const res = await request(app)
        .patch(`/api/doctor/appointments/${appt._id}`)
        .set("Authorization", `Bearer ${doctorToken}`)
        .send({ status: "confirmed", notes: "Confirmed by doctor" });

      expect(res.status).toBe(200);
      expect(res.body.appointment.status).toBe("confirmed");
    });

    it("should return 400 for invalid status", async () => {
      const appt = await Appointment.create({
        patient: patientUser._id,
        doctor: doctorUser._id,
        date: new Date(),
        time: "09:00",
        consultationType: "in-person",
      });

      const res = await request(app)
        .patch(`/api/doctor/appointments/${appt._id}`)
        .set("Authorization", `Bearer ${doctorToken}`)
        .send({ status: "invalid" });

      expect(res.status).toBe(400);
    });
  });

  describe("DELETE /api/doctor/appointments/:appointmentId", () => {
    it("should delete an appointment", async () => {
      const appt = await Appointment.create({
        patient: patientUser._id,
        doctor: doctorUser._id,
        date: new Date(),
        time: "09:00",
        consultationType: "in-person",
      });

      const res = await request(app)
        .delete(`/api/doctor/appointments/${appt._id}`)
        .set("Authorization", `Bearer ${doctorToken}`);

      expect(res.status).toBe(200);

      const count = await Appointment.countDocuments({ _id: appt._id });
      expect(count).toBe(0);
    });

    it("should return 404 for non-existent appointment", async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .delete(`/api/doctor/appointments/${fakeId}`)
        .set("Authorization", `Bearer ${doctorToken}`);

      expect(res.status).toBe(404);
    });
  });

  // ── Meetings ────────────────────────────────────────────────────────────────

  describe("GET /api/doctor/meetings", () => {
    it("should return video-call appointments", async () => {
      await Appointment.create([
        {
          patient: patientUser._id,
          doctor: doctorUser._id,
          date: new Date(),
          time: "14:00",
          consultationType: "video",
          status: "confirmed",
        },
        {
          patient: patientUser._id,
          doctor: doctorUser._id,
          date: new Date(),
          time: "15:00",
          consultationType: "in-person",
          status: "confirmed",
        },
      ]);

      const res = await request(app)
        .get("/api/doctor/meetings")
        .set("Authorization", `Bearer ${doctorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.meetings).toHaveLength(1);
      expect(res.body.meetings[0].consultationType).toBe("video");
    });
  });

  // ── Patients ────────────────────────────────────────────────────────────────

  describe("GET /api/doctor/patients", () => {
    it("should list patients who had appointments", async () => {
      await Appointment.create({
        patient: patientUser._id,
        doctor: doctorUser._id,
        date: new Date(),
        time: "09:00",
        consultationType: "in-person",
        status: "completed",
      });

      const res = await request(app)
        .get("/api/doctor/patients")
        .set("Authorization", `Bearer ${doctorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.patients.length).toBeGreaterThanOrEqual(1);
      expect(res.body.pagination).toBeDefined();
    });
  });

  describe("GET /api/doctor/patients/:patientId", () => {
    it("should return patient detail with appointments and records", async () => {
      await Appointment.create({
        patient: patientUser._id,
        doctor: doctorUser._id,
        date: new Date(),
        time: "09:00",
        consultationType: "in-person",
      });

      const res = await request(app)
        .get(`/api/doctor/patients/${patientProfile._id}`)
        .set("Authorization", `Bearer ${doctorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.patient).toBeDefined();
      expect(res.body.appointments).toBeDefined();
      expect(res.body.records).toBeDefined();
    });

    it("should return 404 for non-existent patient", async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .get(`/api/doctor/patients/${fakeId}`)
        .set("Authorization", `Bearer ${doctorToken}`);

      expect(res.status).toBe(404);
    });
  });

  // ── Medical Records ─────────────────────────────────────────────────────────

  describe("POST /api/doctor/records", () => {
    it("should create a medical record", async () => {
      const res = await request(app)
        .post("/api/doctor/records")
        .set("Authorization", `Bearer ${doctorToken}`)
        .send({
          patientId: patientProfile._id.toString(),
          chiefComplaint: "Headache",
          diagnosis: "Tension headache",
          vitals: { bloodPressure: "120/80", heartRate: 72 },
          prescriptions: [
            { medicine: "Ibuprofen", dosage: "400mg", frequency: "TDS" },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.record).toBeDefined();
      expect(res.body.record.chiefComplaint).toBe("Headache");
    });
  });

  describe("GET /api/doctor/records/:patientId", () => {
    it("should get records for a patient", async () => {
      // Create a record first
      await request(app)
        .post("/api/doctor/records")
        .set("Authorization", `Bearer ${doctorToken}`)
        .send({
          patientId: patientProfile._id.toString(),
          diagnosis: "Test record",
        });

      const res = await request(app)
        .get(`/api/doctor/records/${patientProfile._id}`)
        .set("Authorization", `Bearer ${doctorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.records).toHaveLength(1);
    });
  });

  describe("PUT /api/doctor/records/:recordId", () => {
    it("should update a medical record", async () => {
      const createRes = await request(app)
        .post("/api/doctor/records")
        .set("Authorization", `Bearer ${doctorToken}`)
        .send({
          patientId: patientProfile._id.toString(),
          diagnosis: "Original",
        });

      const recordId = createRes.body.record._id;

      const res = await request(app)
        .put(`/api/doctor/records/${recordId}`)
        .set("Authorization", `Bearer ${doctorToken}`)
        .send({ diagnosis: "Updated diagnosis", notes: "Added notes" });

      expect(res.status).toBe(200);
      expect(res.body.record.diagnosis).toBe("Updated diagnosis");
    });
  });

  // ── Prescriptions ───────────────────────────────────────────────────────────

  describe("POST /api/doctor/prescriptions", () => {
    it("should save a prescription", async () => {
      const res = await request(app)
        .post("/api/doctor/prescriptions")
        .set("Authorization", `Bearer ${doctorToken}`)
        .send({
          patientId: patientProfile._id.toString(),
          medicines: [
            { medicine: "Paracetamol", dosage: "500mg", frequency: "QDS" },
          ],
          notes: "For fever",
        });

      expect(res.status).toBe(201);
      expect(res.body.prescription).toBeDefined();
    });
  });

  describe("GET /api/doctor/prescriptions", () => {
    it("should list prescriptions", async () => {
      await request(app)
        .post("/api/doctor/prescriptions")
        .set("Authorization", `Bearer ${doctorToken}`)
        .send({
          patientId: patientProfile._id.toString(),
          medicines: [],
        });

      const res = await request(app)
        .get("/api/doctor/prescriptions")
        .set("Authorization", `Bearer ${doctorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.prescriptions.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("GET /api/doctor/prescriptions/download", () => {
    it("should return 400 if url is missing", async () => {
      const res = await request(app)
        .get("/api/doctor/prescriptions/download")
        .set("Authorization", `Bearer ${doctorToken}`);

      expect(res.status).toBe(400);
    });

    it("should return 403 for non-Cloudinary URL", async () => {
      const res = await request(app)
        .get("/api/doctor/prescriptions/download?url=https://evil.com/file.pdf")
        .set("Authorization", `Bearer ${doctorToken}`);

      expect(res.status).toBe(403);
    });
  });

  // ── Ratings ─────────────────────────────────────────────────────────────────

  describe("GET /api/doctor/ratings", () => {
    it("should return ratings list", async () => {
      const appt = await Appointment.create({
        patient: patientUser._id,
        doctor: doctorUser._id,
        date: new Date(),
        time: "09:00",
        consultationType: "in-person",
      });

      await Rating.create({
        doctorId: doctorProfile._id,
        patientId: patientProfile._id,
        appointmentId: appt._id,
        rating: 4,
        review: "Good doctor",
      });

      const res = await request(app)
        .get("/api/doctor/ratings")
        .set("Authorization", `Bearer ${doctorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.ratings).toHaveLength(1);
      expect(res.body.ratings[0].rating).toBe(4);
    });
  });

  // ── Public ──────────────────────────────────────────────────────────────────

  describe("GET /api/doctor/public", () => {
    it("should list doctors without authentication", async () => {
      const res = await request(app).get("/api/doctor/public");

      expect(res.status).toBe(200);
      expect(res.body.doctors).toBeDefined();
      expect(Array.isArray(res.body.doctors)).toBe(true);
    });

    it("should filter by search term", async () => {
      const res = await request(app).get(
        "/api/doctor/public?search=Integration"
      );

      expect(res.status).toBe(200);
    });
  });

  // ── Account Deletion ────────────────────────────────────────────────────────

  describe("DELETE /api/doctor/account", () => {
    it("should permanently delete the doctor account", async () => {
      // Create a separate doctor for deletion test
      const delUser = await User.create({
        role: "doctor",
        email: "delete@test.com",
        passwordHash: "x",
        status: "ACTIVE",
        isActive: true,
      });
      await Doctor.create({
        userId: delUser._id,
        doctorId: "DOC-DEL001",
        fullName: "Dr. Delete",
        specialization: "Test",
      });
      const delToken = generateToken(delUser._id);

      const res = await request(app)
        .delete("/api/doctor/account")
        .set("Authorization", `Bearer ${delToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Account permanently deleted");

      // Verify deletion
      const doc = await Doctor.findOne({ userId: delUser._id });
      const usr = await User.findById(delUser._id);
      expect(doc).toBeNull();
      expect(usr).toBeNull();
    });
  });
});
