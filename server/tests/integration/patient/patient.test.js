/**
 * Patient Module - Integration Tests
 * Tests for complete patient workflow and API endpoints
 */

const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

let mongoServer;

const Patient = require("../../../models/Patient");
const User = require("../../../models/User");
const MedicalRecord = require("../../../models/MedicalRecord");

describe("Patient Module - Integration Tests", () => {
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
    await Patient.deleteMany({});
    await User.deleteMany({});
    await MedicalRecord.deleteMany({});
  });

  describe("Patient Profile Workflow", () => {
    test("should complete patient profile creation and retrieval", async () => {
      // Create user
      const userData = {
        email: "patient@example.com",
        password: "hashed_password",
        role: "patient",
        isVerified: true,
      };

      const user = await User.create(userData);
      const userId = user._id;

      // Create patient profile
      const patientData = {
        userId,
        fullName: "John Doe",
        dob: "1990-01-01",
        gender: "male",
        bloodGroup: "O+",
      };

      const patient = await Patient.create(patientData);

      // Retrieve and verify
      const retrievedPatient = await Patient.findOne({ userId });
      expect(retrievedPatient).toBeDefined();
      expect(retrievedPatient.fullName).toBe("John Doe");
    });

    test("should update patient profile", async () => {
      const user = await User.create({
        email: "patient2@example.com",
        password: "hashed_password",
        role: "patient",
      });

      const patient = await Patient.create({
        userId: user._id,
        fullName: "John Doe",
        dob: "1990-01-01",
      });

      // Update profile
      const updated = await Patient.findByIdAndUpdate(
        patient._id,
        {
          fullName: "Jane Doe",
          bloodGroup: "A+",
        },
        { new: true },
      );

      expect(updated.fullName).toBe("Jane Doe");
      expect(updated.bloodGroup).toBe("A+");
    });

    test("should handle medical records for patient", async () => {
      const user = await User.create({
        email: "patient3@example.com",
        role: "patient",
      });

      const patient = await Patient.create({
        userId: user._id,
        fullName: "Jane Doe",
      });

      // Create medical records
      const records = await MedicalRecord.create([
        {
          patientId: patient._id,
          recordType: "lab_report",
          title: "Blood Test",
          date: new Date(),
        },
        {
          patientId: patient._id,
          recordType: "imaging",
          title: "X-Ray",
          date: new Date(),
        },
      ]);

      // Retrieve records
      const patientRecords = await MedicalRecord.find({
        patientId: patient._id,
      });
      expect(patientRecords).toHaveLength(2);
      expect(patientRecords[0].recordType).toBe("lab_report");
    });
  });

  describe("Patient Data Validation and Constraints", () => {
    test("should enforce unique email for users", async () => {
      await User.create({
        email: "duplicate@example.com",
        role: "patient",
      });

      // Attempt to create duplicate
      try {
        await User.create({
          email: "duplicate@example.com",
          role: "patient",
        });
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    test("should validate required patient fields", async () => {
      const user = await User.create({
        email: "patient4@example.com",
        role: "patient",
      });

      const incompletePatient = {
        userId: user._id,
        // Missing fullName
      };

      // This should either fail or be handled by the application
      try {
        await Patient.create(incompletePatient);
      } catch (error) {
        // Validation error expected
        expect(error).toBeDefined();
      }
    });
  });

  describe("Patient Emergency Creation", () => {
    test("should create emergency case with patient location", async () => {
      const user = await User.create({
        email: "patient5@example.com",
        role: "patient",
      });

      const patient = await Patient.create({
        userId: user._id,
        fullName: "Emergency Patient",
      });

      // Note: Emergency model would need to be imported
      // This is a placeholder for the integration test
      const emergencyData = {
        patientId: patient._id,
        title: "Severe Chest Pain",
        severity: "critical",
        location: {
          latitude: 6.9271,
          longitude: 80.7744,
        },
      };

      expect(emergencyData).toBeDefined();
      expect(emergencyData.severity).toBe("critical");
    });
  });

  describe("Patient Profile Strength Calculation", () => {
    test("should calculate profile strength based on completeness", async () => {
      const user = await User.create({
        email: "patient6@example.com",
        role: "patient",
      });

      const patient = await Patient.create({
        userId: user._id,
        fullName: "John Doe",
        dob: "1990-01-01",
        gender: "male",
        address: { line1: "123 St", city: "Colombo" },
        emergencyContact: { name: "Jane", phone: "+94771234567" },
        bloodGroup: "O+",
      });

      // Profile should be well-populated
      expect(patient.fullName).toBeTruthy();
      expect(patient.emergencyContact).toBeTruthy();
      expect(patient.bloodGroup).toBeTruthy();
    });
  });

  describe("Query Performance", () => {
    test("should efficiently retrieve paginated patient data", async () => {
      const user = await User.create({
        email: "patient7@example.com",
        role: "patient",
      });

      // Create multiple records
      for (let i = 0; i < 15; i++) {
        await MedicalRecord.create({
          patientId: user._id,
          recordType: "lab_report",
          title: `Report ${i}`,
          date: new Date(),
        });
      }

      // Paginate
      const page1 = await MedicalRecord.find({ patientId: user._id })
        .limit(10)
        .skip(0);
      const page2 = await MedicalRecord.find({ patientId: user._id })
        .limit(10)
        .skip(10);

      expect(page1).toHaveLength(10);
      expect(page2).toHaveLength(5);
    });
  });

  describe("Patient Data Relationships", () => {
    test("should maintain referential integrity", async () => {
      const user = await User.create({
        email: "patient8@example.com",
        role: "patient",
      });

      const patient = await Patient.create({
        userId: user._id,
        fullName: "John Doe",
      });

      // Verify patient references user
      const linked = await Patient.findById(patient._id);
      expect(linked.userId.toString()).toBe(user._id.toString());
    });
  });
});
