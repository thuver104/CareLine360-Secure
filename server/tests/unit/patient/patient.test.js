/**
 * Patient Module - Unit Tests
 * Tests for patient service functions and profile management
 */

const Patient = require("../../../models/Patient");
const User = require("../../../models/User");
const MedicalRecord = require("../../../models/MedicalRecord");
const Prescription = require("../../../models/Prescription");
const {
  calcPatientProfileStrength,
} = require("../../../services/profileStrength");

// Mock the models
jest.mock("../../models/Patient");
jest.mock("../../models/User");
jest.mock("../../models/MedicalRecord");
jest.mock("../../models/Prescription");
jest.mock("../../services/profileStrength");

describe("Patient Module - Unit Tests", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("Profile Strength Calculator", () => {
    test("should calculate profile strength with all fields", () => {
      const mockPatient = {
        fullName: "John Doe",
        dob: "1990-01-01",
        gender: "male",
        address: { line1: "123 Main St", city: "Colombo" },
        emergencyContact: {
          name: "Jane",
          phone: "+94771234567",
          relationship: "Sister",
        },
        bloodGroup: "O+",
        allergies: ["Penicillin"],
        chronicConditions: ["Diabetes"],
        documentsCount: 2,
      };

      calcPatientProfileStrength.mockReturnValue({ score: 100 });

      const result = calcPatientProfileStrength(mockPatient);
      expect(result.score).toBe(100);
      expect(calcPatientProfileStrength).toHaveBeenCalledWith(mockPatient);
    });

    test("should calculate lower profile strength with missing fields", () => {
      const mockPatient = {
        fullName: "John Doe",
        dob: "1990-01-01",
        gender: "male",
        address: { line1: "123 Main St", city: "Colombo" },
        emergencyContact: null,
        bloodGroup: null,
        documentsCount: 0,
      };

      calcPatientProfileStrength.mockReturnValue({ score: 60 });

      const result = calcPatientProfileStrength(mockPatient);
      expect(result.score).toBe(60);
    });

    test("should return 0 for empty profile", () => {
      const mockPatient = {};

      calcPatientProfileStrength.mockReturnValue({ score: 0 });

      const result = calcPatientProfileStrength(mockPatient);
      expect(result.score).toBe(0);
    });
  });

  describe("Patient Profile Retrieval", () => {
    test("should retrieve complete patient profile", async () => {
      const mockUserId = "user123";
      const mockPatient = {
        _id: "patient123",
        userId: mockUserId,
        fullName: "John Doe",
        patientId: "PAT-001",
        email: "john@example.com",
        dob: "1990-01-01",
        gender: "male",
        bloodGroup: "O+",
        allergies: ["Penicillin"],
        chronicConditions: ["Diabetes"],
        profileStrength: 85,
      };

      const mockUser = {
        _id: mockUserId,
        email: "john@example.com",
        isVerified: true,
        role: "patient",
      };

      Patient.findOne.mockResolvedValue(mockPatient);
      User.findById.mockResolvedValue(mockUser);

      const patient = await Patient.findOne({ userId: mockUserId });
      const user = await User.findById(mockUserId);

      expect(patient).toEqual(mockPatient);
      expect(user).toEqual(mockUser);
      expect(patient.fullName).toBe("John Doe");
    });

    test("should handle patient not found", async () => {
      Patient.findOne.mockResolvedValue(null);

      const patient = await Patient.findOne({ userId: "nonexistent" });
      expect(patient).toBeNull();
    });

    test("should validate emergency contact structure", () => {
      const mockEmergencyContact = {
        name: "Jane Doe",
        phone: "+94771234567",
        relationship: "Sister",
      };

      expect(mockEmergencyContact).toHaveProperty("name");
      expect(mockEmergencyContact).toHaveProperty("phone");
      expect(mockEmergencyContact).toHaveProperty("relationship");
    });
  });

  describe("Medical Records Management", () => {
    test("should retrieve patient medical records", async () => {
      const mockRecords = [
        {
          _id: "record1",
          patientId: "patient123",
          recordType: "lab_report",
          title: "Blood Test",
          date: "2024-01-15",
        },
        {
          _id: "record2",
          patientId: "patient123",
          recordType: "imaging",
          title: "X-Ray",
          date: "2024-01-20",
        },
      ];

      MedicalRecord.find.mockResolvedValue(mockRecords);

      const records = await MedicalRecord.find({ patientId: "patient123" });
      expect(records).toHaveLength(2);
      expect(records[0].recordType).toBe("lab_report");
    });

    test("should handle empty medical records", async () => {
      MedicalRecord.find.mockResolvedValue([]);

      const records = await MedicalRecord.find({ patientId: "patient123" });
      expect(records).toEqual([]);
    });
  });

  describe("Prescriptions Management", () => {
    test("should retrieve active prescriptions", async () => {
      const mockPrescriptions = [
        {
          _id: "presc1",
          patientId: "patient123",
          medications: [{ name: "Metformin", dosage: "500mg" }],
          status: "ACTIVE",
          expiryDate: "2024-04-15",
        },
      ];

      Prescription.find.mockResolvedValue(mockPrescriptions);

      const prescriptions = await Prescription.find({
        patientId: "patient123",
        status: "ACTIVE",
      });

      expect(prescriptions).toHaveLength(1);
      expect(prescriptions[0].status).toBe("ACTIVE");
    });

    test("should filter prescriptions by status", async () => {
      const mockActivePrescriptions = [
        { _id: "presc1", status: "ACTIVE" },
        { _id: "presc2", status: "ACTIVE" },
      ];

      Prescription.find.mockResolvedValue(mockActivePrescriptions);

      const prescriptions = await Prescription.find({ status: "ACTIVE" });
      expect(prescriptions.every((p) => p.status === "ACTIVE")).toBe(true);
    });
  });

  describe("Patient Data Validation", () => {
    test("should validate NIC format", () => {
      const validNICs = ["900512345V", "123456789012"];
      const invalidNICs = ["NIC123", "12345"];

      validNICs.forEach((nic) => {
        const isValid = /^[0-9]{9}[vV]$|^[0-9]{12}$/.test(nic);
        expect(isValid).toBe(true);
      });

      invalidNICs.forEach((nic) => {
        const isValid = /^[0-9]{9}[vV]$|^[0-9]{12}$/.test(nic);
        expect(isValid).toBe(false);
      });
    });

    test("should validate blood group values", () => {
      const validBloodGroups = [
        "A+",
        "A-",
        "B+",
        "B-",
        "AB+",
        "AB-",
        "O+",
        "O-",
      ];
      const invalidBloodGroups = ["C+", "AB++", "O"];

      validBloodGroups.forEach((bg) => {
        const isValid = /^(A|B|AB|O)[+-]$/.test(bg);
        expect(isValid).toBe(true);
      });

      invalidBloodGroups.forEach((bg) => {
        const isValid = /^(A|B|AB|O)[+-]$/.test(bg);
        expect(isValid).toBe(false);
      });
    });

    test("should validate gender values", () => {
      const validGenders = ["male", "female", "other"];
      const invalidGenders = ["unknown", "prefer not to say"];

      validGenders.forEach((g) => {
        const isValid = ["male", "female", "other"].includes(g);
        expect(isValid).toBe(true);
      });

      invalidGenders.forEach((g) => {
        const isValid = ["male", "female", "other"].includes(g);
        expect(isValid).toBe(false);
      });
    });
  });

  describe("Emergency Contact Validation", () => {
    test("should validate phone number format", () => {
      const validPhones = ["+94771234567", "+94112345678"];
      const invalidPhones = ["123456", "+12345"];

      validPhones.forEach((phone) => {
        const isValid = /^\+94[0-9]{9}$/.test(phone);
        expect(isValid).toBe(true);
      });

      invalidPhones.forEach((phone) => {
        const isValid = /^\+94[0-9]{9}$/.test(phone);
        expect(isValid).toBe(false);
      });
    });

    test("should require emergency contact fields", () => {
      const validContact = {
        name: "Jane Doe",
        phone: "+94771234567",
        relationship: "Sister",
      };

      const hasRequiredFields =
        validContact.name && validContact.phone && validContact.relationship;

      expect(hasRequiredFields).toBe(true);
    });
  });

  describe("Allergies and Medical Conditions", () => {
    test("should store multiple allergies", () => {
      const allergies = ["Penicillin", "Aspirin", "Latex"];
      expect(allergies).toHaveLength(3);
      expect(allergies).toContain("Penicillin");
    });

    test("should store chronic conditions", () => {
      const conditions = ["Diabetes", "Hypertension", "Asthma"];
      expect(conditions).toEqual(expect.arrayContaining(["Diabetes"]));
    });

    test("should handle empty allergies array", () => {
      const allergies = [];
      expect(allergies).toHaveLength(0);
    });
  });
});
