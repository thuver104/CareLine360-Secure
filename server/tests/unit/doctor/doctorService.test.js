/**
 * ──────────────────────────────────────────────────────────────────────────────
 * UNIT TESTS – doctorService.js
 *
 * These tests run against an in-memory MongoDB instance so every service
 * function is validated in isolation from Controllers / HTTP layer.
 * ──────────────────────────────────────────────────────────────────────────────
 */

const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

// Models
const Doctor = require("../../../models/Doctor");
const User = require("../../../models/User");
const Appointment = require("../../../models/Appointment");
const MedicalRecord = require("../../../models/MedicalRecord");
const Prescription = require("../../../models/Prescription");
const Rating = require("../../../models/Rating");
const Patient = require("../../../models/Patient");
const Counter = require("../../../models/Counter");

// Module under test — mock uploadService so Cloudinary isn't called
jest.mock("../../../services/uploadService", () => ({
  uploadBase64Image: jest.fn().mockResolvedValue({
    url: "https://res.cloudinary.com/demo/image/upload/mock.jpg",
    publicId: "mock_public_id",
  }),
  deleteCloudinaryFile: jest.fn().mockResolvedValue(true),
}));

const doctorService = require("../../../services/doctorService");

let mongoServer;

// ── Lifecycle ────────────────────────────────────────────────────────────────

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  // Wipe every collection between tests for full isolation
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

// ── Helpers ──────────────────────────────────────────────────────────────────

const createDoctorUser = async (overrides = {}) => {
  return User.create({
    role: "doctor",
    fullName: "Test Doctor",
    email: `doc${Date.now()}@test.com`,
    passwordHash: "hashed_pw",
    status: "ACTIVE",
    isActive: true,
    isVerified: true,
    ...overrides,
  });
};

const createPatientUser = async (overrides = {}) => {
  return User.create({
    role: "patient",
    fullName: "Test Patient",
    email: `pat${Date.now()}@test.com`,
    passwordHash: "hashed_pw",
    status: "ACTIVE",
    isActive: true,
    isVerified: true,
    ...overrides,
  });
};

const createPatientProfile = async (userId) => {
  return Patient.create({
    userId,
    patientId: `PAT-${Date.now()}`,
    fullName: "Test Patient",
  });
};

const createDoctorProfile = async (userId) => {
  return doctorService.createDoctorProfile({
    userId,
    fullName: "Dr. Test",
    specialization: "General",
    qualifications: ["MBBS"],
    experience: 5,
    bio: "Test bio",
    licenseNumber: "LIC-001",
    consultationFee: 2000,
    phone: "+94771111111",
  });
};

// ═══════════════════════════════════════════════════════════════════════════════
// TESTS
// ═══════════════════════════════════════════════════════════════════════════════

describe("Doctor Service – Unit Tests", () => {
  // ── 1. Profile CRUD ─────────────────────────────────────────────────────────

  describe("Profile Management", () => {
    it("should create a doctor profile successfully", async () => {
      const user = await createDoctorUser();
      const result = await createDoctorProfile(user._id);

      expect(result.status).toBe(201);
      expect(result.data.message).toBe("Doctor profile created");
      expect(result.data.doctor.fullName).toBe("Dr. Test");
      expect(result.data.doctor.doctorId).toMatch(/^DOC-\d{6}$/);
    });

    it("should return 409 if profile already exists", async () => {
      const user = await createDoctorUser();
      await createDoctorProfile(user._id);
      const result = await createDoctorProfile(user._id);

      expect(result.status).toBe(409);
      expect(result.data.message).toBe("Doctor profile already exists");
    });

    it("should return 403 for non-doctor role", async () => {
      const user = await User.create({
        role: "patient",
        email: "patient@test.com",
        passwordHash: "x",
        status: "ACTIVE",
      });

      const result = await doctorService.createDoctorProfile({
        userId: user._id,
        fullName: "Fake",
        specialization: "Fake",
      });

      expect(result.status).toBe(403);
      expect(result.data.message).toBe("Not a doctor account");
    });

    it("should return 403 if account not ACTIVE", async () => {
      const user = await createDoctorUser({ status: "PENDING" });
      const result = await doctorService.createDoctorProfile({
        userId: user._id,
        fullName: "Dr. Pending",
        specialization: "General",
      });

      expect(result.status).toBe(403);
      expect(result.data.message).toBe("Account not approved yet");
    });

    it("should get existing doctor profile", async () => {
      const user = await createDoctorUser();
      await createDoctorProfile(user._id);

      const result = await doctorService.getDoctorProfile({ userId: user._id });
      expect(result.status).toBe(200);
      expect(result.data.doctor.fullName).toBe("Dr. Test");
    });

    it("should return 404 when profile not found", async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const result = await doctorService.getDoctorProfile({ userId: fakeId });

      expect(result.status).toBe(404);
    });

    it("should update doctor profile with allowed fields only", async () => {
      const user = await createDoctorUser();
      await createDoctorProfile(user._id);

      const result = await doctorService.updateDoctorProfile({
        userId: user._id,
        updates: {
          fullName: "Dr. Updated",
          consultationFee: 5000,
          isDeleted: true, // should be ignored (not in whitelist)
        },
      });

      expect(result.status).toBe(200);
      expect(result.data.doctor.fullName).toBe("Dr. Updated");
      expect(result.data.doctor.consultationFee).toBe(5000);
      expect(result.data.doctor.isDeleted).toBe(false); // wasn't changed
    });

    it("should auto-increment doctorId (DOC-000001, DOC-000002, ...)", async () => {
      const user1 = await createDoctorUser({ email: "d1@test.com" });
      const user2 = await createDoctorUser({ email: "d2@test.com" });

      const r1 = await createDoctorProfile(user1._id);
      const r2 = await createDoctorProfile(user2._id);

      const id1 = parseInt(r1.data.doctor.doctorId.replace("DOC-", ""));
      const id2 = parseInt(r2.data.doctor.doctorId.replace("DOC-", ""));
      expect(id2).toBe(id1 + 1);
    });
  });

  // ── 2. Avatar ────────────────────────────────────────────────────────────────

  describe("Avatar Upload", () => {
    it("should update avatar with base64 image", async () => {
      const user = await createDoctorUser();
      await createDoctorProfile(user._id);

      const result = await doctorService.updateAvatarBase64({
        userId: user._id,
        base64Image: "data:image/jpeg;base64,/9j/mock...",
      });

      expect(result.status).toBe(200);
      expect(result.data.avatarUrl).toContain("cloudinary.com");
    });

    it("should return 400 for empty image", async () => {
      const user = await createDoctorUser();
      await createDoctorProfile(user._id);

      const result = await doctorService.updateAvatarBase64({
        userId: user._id,
        base64Image: "",
      });

      expect(result.status).toBe(400);
    });

    it("should return 404 if doctor not found", async () => {
      const result = await doctorService.updateAvatarBase64({
        userId: new mongoose.Types.ObjectId(),
        base64Image: "data:image/jpeg;base64,mock",
      });

      expect(result.status).toBe(404);
    });
  });

  // ── 3. Dashboard Stats ──────────────────────────────────────────────────────

  describe("Dashboard Stats", () => {
    it("should return correct dashboard statistics", async () => {
      const user = await createDoctorUser();
      await createDoctorProfile(user._id);
      const patientUser = await createPatientUser();
      const patientProfile = await createPatientProfile(patientUser._id);

      // Create appointments
      await Appointment.create([
        {
          patient: patientUser._id,
          doctor: user._id,
          date: new Date(),
          time: "09:00",
          consultationType: "in-person",
          status: "pending",
        },
        {
          patient: patientUser._id,
          doctor: user._id,
          date: new Date(),
          time: "10:00",
          consultationType: "in-person",
          status: "completed",
        },
      ]);

      const result = await doctorService.getDashboardStats({ userId: user._id });

      expect(result.status).toBe(200);
      expect(result.data.stats.totalAppointments).toBe(2);
      expect(result.data.stats.pendingAppointments).toBe(1);
      expect(result.data.stats.completedAppointments).toBe(1);
      expect(result.data.stats.todayAppointments).toBe(2);
      expect(result.data.stats.totalPatients).toBe(1);
      expect(result.data.doctor.fullName).toBe("Dr. Test");
    });

    it("should return 404 for non-existent doctor", async () => {
      const result = await doctorService.getDashboardStats({
        userId: new mongoose.Types.ObjectId(),
      });
      expect(result.status).toBe(404);
    });
  });

  // ── 4. Availability Slots ───────────────────────────────────────────────────

  describe("Availability Management", () => {
    it("should add availability slots", async () => {
      const user = await createDoctorUser();
      await createDoctorProfile(user._id);

      const result = await doctorService.addAvailabilitySlots({
        userId: user._id,
        slots: [
          { date: "2026-04-15", startTime: "09:00", endTime: "09:30" },
          { date: "2026-04-15", startTime: "09:30", endTime: "10:00" },
        ],
      });

      expect(result.status).toBe(201);
      expect(result.data.slots).toHaveLength(2);
      expect(result.data.slots[0].isBooked).toBe(false);
    });

    it("should get availability slots", async () => {
      const user = await createDoctorUser();
      await createDoctorProfile(user._id);
      await doctorService.addAvailabilitySlots({
        userId: user._id,
        slots: [{ date: "2026-04-15", startTime: "09:00", endTime: "09:30" }],
      });

      const result = await doctorService.getAvailability({ userId: user._id });
      expect(result.status).toBe(200);
      expect(result.data.slots).toHaveLength(1);
    });

    it("should delete an unbooked slot", async () => {
      const user = await createDoctorUser();
      await createDoctorProfile(user._id);
      const addResult = await doctorService.addAvailabilitySlots({
        userId: user._id,
        slots: [{ date: "2026-04-15", startTime: "09:00", endTime: "09:30" }],
      });
      const slotId = addResult.data.slots[0]._id;

      const result = await doctorService.deleteAvailabilitySlot({
        userId: user._id,
        slotId,
      });

      expect(result.status).toBe(200);
      expect(result.data.message).toBe("Slot deleted");
    });

    it("should NOT delete a booked slot", async () => {
      const user = await createDoctorUser();
      await createDoctorProfile(user._id);
      const addResult = await doctorService.addAvailabilitySlots({
        userId: user._id,
        slots: [{ date: "2026-04-15", startTime: "09:00", endTime: "09:30" }],
      });

      // Mark slot as booked
      const doctor = await Doctor.findOne({ userId: user._id });
      doctor.availabilitySlots[0].isBooked = true;
      await doctor.save();

      const result = await doctorService.deleteAvailabilitySlot({
        userId: user._id,
        slotId: doctor.availabilitySlots[0]._id,
      });

      expect(result.status).toBe(400);
      expect(result.data.message).toBe("Cannot delete a booked slot");
    });

    it("should update an unbooked slot", async () => {
      const user = await createDoctorUser();
      await createDoctorProfile(user._id);
      const addResult = await doctorService.addAvailabilitySlots({
        userId: user._id,
        slots: [{ date: "2026-04-15", startTime: "09:00", endTime: "09:30" }],
      });
      const slotId = addResult.data.slots[0]._id;

      const result = await doctorService.updateAvailabilitySlot({
        userId: user._id,
        slotId,
        startTime: "10:00",
        endTime: "10:30",
      });

      expect(result.status).toBe(200);
      expect(result.data.slots[0].startTime).toBe("10:00");
      expect(result.data.slots[0].endTime).toBe("10:30");
    });

    it("should reject update if endTime <= startTime", async () => {
      const user = await createDoctorUser();
      await createDoctorProfile(user._id);
      const addResult = await doctorService.addAvailabilitySlots({
        userId: user._id,
        slots: [{ date: "2026-04-15", startTime: "09:00", endTime: "09:30" }],
      });

      const result = await doctorService.updateAvailabilitySlot({
        userId: user._id,
        slotId: addResult.data.slots[0]._id,
        startTime: "10:30",
        endTime: "10:00",
      });

      expect(result.status).toBe(400);
      expect(result.data.message).toBe("End time must be after start time");
    });
  });

  // ── 5. Appointments ─────────────────────────────────────────────────────────

  describe("Appointment Management", () => {
    let docUser, patUser;

    beforeEach(async () => {
      docUser = await createDoctorUser();
      await createDoctorProfile(docUser._id);
      patUser = await createPatientUser();
    });

    it("should list appointments with pagination", async () => {
      // Create 3 appointments
      for (let i = 0; i < 3; i++) {
        await Appointment.create({
          patient: patUser._id,
          doctor: docUser._id,
          date: new Date("2026-04-15"),
          time: `0${9 + i}:00`,
          consultationType: "in-person",
          status: "pending",
        });
      }

      const result = await doctorService.getMyAppointments({
        userId: docUser._id,
        page: 1,
        limit: 2,
      });

      expect(result.status).toBe(200);
      expect(result.data.appointments).toHaveLength(2);
      expect(result.data.pagination.total).toBe(3);
      expect(result.data.pagination.pages).toBe(2);
    });

    it("should filter appointments by status", async () => {
      await Appointment.create([
        {
          patient: patUser._id,
          doctor: docUser._id,
          date: new Date(),
          time: "09:00",
          consultationType: "in-person",
          status: "pending",
        },
        {
          patient: patUser._id,
          doctor: docUser._id,
          date: new Date(),
          time: "10:00",
          consultationType: "in-person",
          status: "completed",
        },
      ]);

      const result = await doctorService.getMyAppointments({
        userId: docUser._id,
        status: "completed",
      });

      expect(result.data.appointments).toHaveLength(1);
      expect(result.data.appointments[0].status).toBe("completed");
    });

    it("should update appointment status to confirmed", async () => {
      const appt = await Appointment.create({
        patient: patUser._id,
        doctor: docUser._id,
        date: new Date(),
        time: "09:00",
        consultationType: "in-person",
        status: "pending",
      });

      const result = await doctorService.updateAppointmentStatus({
        userId: docUser._id,
        appointmentId: appt._id,
        status: "confirmed",
        notes: "Please arrive early",
      });

      expect(result.status).toBe(200);
      expect(result.data.appointment.status).toBe("confirmed");
      expect(result.data.appointment.notes).toBe("Please arrive early");
    });

    it("should reject invalid appointment status", async () => {
      const appt = await Appointment.create({
        patient: patUser._id,
        doctor: docUser._id,
        date: new Date(),
        time: "09:00",
        consultationType: "in-person",
      });

      const result = await doctorService.updateAppointmentStatus({
        userId: docUser._id,
        appointmentId: appt._id,
        status: "invalid_status",
      });

      expect(result.status).toBe(400);
      expect(result.data.message).toBe("Invalid status");
    });

    it("should delete an appointment", async () => {
      const appt = await Appointment.create({
        patient: patUser._id,
        doctor: docUser._id,
        date: new Date(),
        time: "09:00",
        consultationType: "in-person",
      });

      const result = await doctorService.deleteAppointment({
        userId: docUser._id,
        appointmentId: appt._id,
      });

      expect(result.status).toBe(200);
      const count = await Appointment.countDocuments({});
      expect(count).toBe(0);
    });

    it("should return 404 when deleting non-existent appointment", async () => {
      const result = await doctorService.deleteAppointment({
        userId: docUser._id,
        appointmentId: new mongoose.Types.ObjectId(),
      });

      expect(result.status).toBe(404);
    });
  });

  // ── 6. Medical Records ──────────────────────────────────────────────────────

  describe("Medical Records", () => {
    let docUser, patProfile;

    beforeEach(async () => {
      docUser = await createDoctorUser();
      await createDoctorProfile(docUser._id);
      const patUser = await createPatientUser();
      patProfile = await createPatientProfile(patUser._id);
    });

    it("should create a medical record", async () => {
      const result = await doctorService.createMedicalRecord({
        userId: docUser._id,
        data: {
          patientId: patProfile._id,
          chiefComplaint: "Chest pain",
          diagnosis: "Mild angina",
          notes: "Follow-up in 2 weeks",
          vitals: { bloodPressure: "130/85", heartRate: 78 },
          prescriptions: [
            {
              medicine: "Aspirin 100mg",
              dosage: "1 tab",
              frequency: "Daily",
              duration: "30 days",
            },
          ],
        },
      });

      expect(result.status).toBe(201);
      expect(result.data.record.chiefComplaint).toBe("Chest pain");
      expect(result.data.record.prescriptions).toHaveLength(1);
    });

    it("should auto-complete appointment when creating record with appointmentId", async () => {
      const patUser = await User.findById(patProfile.userId);
      const appt = await Appointment.create({
        patient: patUser._id,
        doctor: docUser._id,
        date: new Date(),
        time: "10:00",
        consultationType: "in-person",
        status: "confirmed",
      });

      await doctorService.createMedicalRecord({
        userId: docUser._id,
        data: {
          patientId: patProfile._id,
          appointmentId: appt._id,
          diagnosis: "Test",
        },
      });

      const updated = await Appointment.findById(appt._id);
      expect(updated.status).toBe("completed");
    });

    it("should return 404 for non-existent patient", async () => {
      const result = await doctorService.createMedicalRecord({
        userId: docUser._id,
        data: {
          patientId: new mongoose.Types.ObjectId(),
          diagnosis: "Test",
        },
      });

      expect(result.status).toBe(404);
      expect(result.data.message).toBe("Patient not found");
    });

    it("should get medical records by patient with pagination", async () => {
      // Create 3 records
      for (let i = 0; i < 3; i++) {
        await doctorService.createMedicalRecord({
          userId: docUser._id,
          data: {
            patientId: patProfile._id,
            diagnosis: `Diagnosis ${i}`,
          },
        });
      }

      const result = await doctorService.getMedicalRecordsByPatient({
        userId: docUser._id,
        patientId: patProfile._id,
        page: 1,
        limit: 2,
      });

      expect(result.status).toBe(200);
      expect(result.data.records).toHaveLength(2);
      expect(result.data.pagination.total).toBe(3);
    });

    it("should update a medical record", async () => {
      const createResult = await doctorService.createMedicalRecord({
        userId: docUser._id,
        data: {
          patientId: patProfile._id,
          diagnosis: "Old diagnosis",
        },
      });

      const result = await doctorService.updateMedicalRecord({
        userId: docUser._id,
        recordId: createResult.data.record._id,
        updates: {
          diagnosis: "Updated diagnosis",
          notes: "New notes",
        },
      });

      expect(result.status).toBe(200);
      expect(result.data.record.diagnosis).toBe("Updated diagnosis");
      expect(result.data.record.notes).toBe("New notes");
    });
  });

  // ── 7. Prescriptions ────────────────────────────────────────────────────────

  describe("Prescriptions", () => {
    it("should save a prescription", async () => {
      const docUser = await createDoctorUser();
      await createDoctorProfile(docUser._id);
      const patUser = await createPatientUser();
      const patProfile = await createPatientProfile(patUser._id);

      const result = await doctorService.savePrescription({
        userId: docUser._id,
        data: {
          patientId: patProfile._id,
          medicines: [
            { medicine: "Paracetamol", dosage: "500mg", frequency: "TDS" },
          ],
          notes: "For fever",
        },
      });

      expect(result.status).toBe(201);
      expect(result.data.prescription.medicines).toHaveLength(1);
    });

    it("should list prescriptions with pagination", async () => {
      const docUser = await createDoctorUser();
      await createDoctorProfile(docUser._id);
      const patUser = await createPatientUser();
      const patProfile = await createPatientProfile(patUser._id);

      await doctorService.savePrescription({
        userId: docUser._id,
        data: { patientId: patProfile._id, medicines: [] },
      });
      await doctorService.savePrescription({
        userId: docUser._id,
        data: { patientId: patProfile._id, medicines: [] },
      });

      const result = await doctorService.getMyPrescriptions({
        userId: docUser._id,
      });

      expect(result.status).toBe(200);
      expect(result.data.prescriptions).toHaveLength(2);
    });
  });

  // ── 8. Ratings ──────────────────────────────────────────────────────────────

  describe("Ratings", () => {
    it("should return ratings with average", async () => {
      const docUser = await createDoctorUser();
      const createResult = await createDoctorProfile(docUser._id);
      const doctor = createResult.data.doctor;
      const patUser = await createPatientUser();
      const patProfile = await createPatientProfile(patUser._id);

      const appt = await Appointment.create({
        patient: patUser._id,
        doctor: docUser._id,
        date: new Date(),
        time: "09:00",
        consultationType: "in-person",
      });

      await Rating.create({
        doctorId: doctor._id,
        patientId: patProfile._id,
        appointmentId: appt._id,
        rating: 5,
        review: "Excellent doctor!",
      });

      const result = await doctorService.getMyRatings({ userId: docUser._id });

      expect(result.status).toBe(200);
      expect(result.data.ratings).toHaveLength(1);
      expect(result.data.ratings[0].rating).toBe(5);
    });
  });

  // ── 9. Public Doctors ───────────────────────────────────────────────────────

  describe("Public Doctor List", () => {
    it("should list active doctors publicly", async () => {
      const user1 = await createDoctorUser({ email: "pub1@test.com" });
      const user2 = await createDoctorUser({ email: "pub2@test.com" });
      await createDoctorProfile(user1._id);
      await createDoctorProfile(user2._id);

      const result = await doctorService.getPublicDoctors({});

      expect(result.status).toBe(200);
      expect(result.data.doctors.length).toBeGreaterThanOrEqual(2);
    });

    it("should filter by specialization", async () => {
      const user = await createDoctorUser({ email: "cardio@test.com" });
      await doctorService.createDoctorProfile({
        userId: user._id,
        fullName: "Dr. Cardio",
        specialization: "Cardiology",
      });

      const result = await doctorService.getPublicDoctors({
        specialization: "Cardiology",
      });

      expect(result.status).toBe(200);
      expect(result.data.doctors.every((d) => /cardiology/i.test(d.specialization))).toBe(true);
    });

    it("should search by name", async () => {
      const user = await createDoctorUser({ email: "search@test.com" });
      await doctorService.createDoctorProfile({
        userId: user._id,
        fullName: "Dr. Unique Name",
        specialization: "Dermatology",
      });

      const result = await doctorService.getPublicDoctors({
        search: "Unique",
      });

      expect(result.status).toBe(200);
      expect(result.data.doctors.length).toBeGreaterThanOrEqual(1);
    });
  });

  // ── 10. Account Deactivation ────────────────────────────────────────────────

  describe("Account Deactivation (Hard Delete)", () => {
    it("should permanently delete doctor profile and user account", async () => {
      const user = await createDoctorUser();
      await createDoctorProfile(user._id);

      const result = await doctorService.deactivateDoctorAccount({
        userId: user._id,
      });

      expect(result.status).toBe(200);
      expect(result.data.message).toBe("Account permanently deleted");

      // Verify both documents are gone
      const doctorExists = await Doctor.findOne({ userId: user._id });
      const userExists = await User.findById(user._id);
      expect(doctorExists).toBeNull();
      expect(userExists).toBeNull();
    });

    it("should return 404 if doctor profile not found", async () => {
      const result = await doctorService.deactivateDoctorAccount({
        userId: new mongoose.Types.ObjectId(),
      });

      expect(result.status).toBe(404);
    });
  });

  // ── 11. Analytics ───────────────────────────────────────────────────────────

  describe("Analytics", () => {
    it("should return analytics data with monthly trend", async () => {
      const docUser = await createDoctorUser();
      await createDoctorProfile(docUser._id);
      const patUser = await createPatientUser();

      await Appointment.create([
        {
          patient: patUser._id,
          doctor: docUser._id,
          date: new Date(),
          time: "09:00",
          consultationType: "in-person",
          status: "completed",
        },
        {
          patient: patUser._id,
          doctor: docUser._id,
          date: new Date(),
          time: "10:00",
          consultationType: "in-person",
          status: "pending",
        },
      ]);

      const result = await doctorService.getDoctorAnalytics({
        userId: docUser._id,
      });

      expect(result.status).toBe(200);
      expect(result.data.stats.totalAppointments).toBe(2);
      expect(result.data.stats.completedAppointments).toBe(1);
      expect(result.data.stats.completionRate).toBe(50);
      expect(result.data.monthlyTrend).toHaveLength(6);
      expect(result.data.appointmentsByStatus.length).toBeGreaterThan(0);
    });
  });
});
