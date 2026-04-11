/**
 * Jest Setup File
 * Location: /server/tests/setup.js
 *
 * This file runs before all tests and sets up the test environment
 */

// Increase timeout for long-running tests
jest.setTimeout(30000);

// Suppress console logs during tests (optional)
// Uncomment if tests output is too noisy
// global.console = {
//   ...console,
//   log: jest.fn(),
//   debug: jest.fn(),
//   info: jest.fn(),
//   warn: jest.fn(),
// };

// Mock environment variables for testing
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test_jwt_secret_key_12345";
process.env.JWT_EXPIRY = "24h";
process.env.MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/careline360-test";

// Mock Cloudinary configuration
process.env.CLOUDINARY_NAME = "test_cloudinary";
process.env.CLOUDINARY_API_KEY = "test_api_key";
process.env.CLOUDINARY_API_SECRET = "test_api_secret";

// Mock email service
process.env.EMAIL_SERVICE = "gmail";
process.env.EMAIL_USER = "test@example.com";
process.env.EMAIL_PASSWORD = "test_password";

// Mock Gemini AI
process.env.GEMINI_API_KEY = "test_gemini_key";

/**
 * Global test utilities
 */
global.testUtils = {
  /**
   * Generate test user data
   */
  generateUserData: (role = "patient") => ({
    email: `test_${Date.now()}@example.com`,
    password: "TestPassword123!",
    fullName: "Test User",
    role,
  }),

  /**
   * Generate test patient data
   */
  generatePatientData: () => ({
    fullName: "Test Patient",
    dob: "1990-01-01",
    gender: "male",
    nic: "900112345V",
    bloodGroup: "O+",
    address: {
      line1: "123 Test St",
      city: "Test City",
      district: "Test District",
    },
    emergencyContact: {
      name: "Test Emergency",
      phone: "+94771234567",
      relationship: "Brother",
    },
    allergies: ["Test Allergy"],
    chronicConditions: ["Test Condition"],
  }),

  /**
   * Generate test appointment data
   */
  generateAppointmentData: (patientId, doctorId) => ({
    patient: patientId,
    doctor: doctorId,
    date: new Date(Date.now() + 86400000), // Tomorrow
    time: "10:00 AM",
    consultationType: "video",
    symptoms: "Test symptoms",
    priority: "medium",
    status: "pending",
  }),

  /**
   * Generate test doctor profile data
   */
  generateDoctorData: () => ({
    specialization: "Cardiology",
    licenseNumber: `LIC-${Date.now()}`,
    yearsExperience: 5,
    biography: "Experienced doctor with excellent patient care record",
    qualifications: ["MBBS", "MD Cardiology"],
    consultationFee: 2000,
    languages: ["English", "Sinhala"],
    registrationNumber: `REG-${Date.now()}`,
  }),

  /**
   * Generate test doctor availability slots
   */
  generateAvailabilitySlots: () => [
    {
      dayOfWeek: "Monday",
      startTime: "09:00",
      endTime: "17:00",
      maxConsultations: 8,
    },
    {
      dayOfWeek: "Wednesday",
      startTime: "10:00",
      endTime: "18:00",
      maxConsultations: 8,
    },
    {
      dayOfWeek: "Friday",
      startTime: "14:00",
      endTime: "20:00",
      maxConsultations: 6,
    },
  ],

  /**
   * Generate test medical record data
   */
  generateMedicalRecordData: () => ({
    diagnosis: "Hypertension",
    treatment: "Prescribed antihypertensive medication",
    notes: "Monitor blood pressure weekly",
    observations: "Patient responded well to initial treatment",
  }),

  /**
   * Generate test prescription data
   */
  generatePrescriptionData: () => ({
    medications: [
      {
        medicationName: "Aspirin",
        dosage: "100mg",
        frequency: "Once daily",
        duration: "30 days",
      },
      {
        medicationName: "Lisinopril",
        dosage: "10mg",
        frequency: "Once daily",
        duration: "90 days",
      },
    ],
    instructions: "Take with meals. Do not skip doses.",
  }),

  /**
   * Generate test payment data
   */
  generatePaymentData: (appointmentId, patientId, doctorId) => ({
    appointment: appointmentId,
    patient: patientId,
    doctor: doctorId,
    amount: 2500,
    paymentMethod: "card",
    transactionId: `TXN-${Date.now()}`,
    status: "pending",
    description: "Consultation fee",
  }),

  /**
   * Generate test payment transaction data
   */
  generatePaymentTransactionData: () => ({
    transactionId: `TXN-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    amount: 2500,
    currency: "LKR",
    method: "card",
    cardLast4: "4242",
    status: "completed",
    timestamp: new Date(),
  }),

  /**
   * Generate test emergency case data
   */
  generateEmergencyCaseData: (patientId) => ({
    patient: patientId,
    type: "medical",
    severity: "high",
    description: "Emergency medical attention required",
    location: "123 Test Street, Test City",
    status: "open",
    assignedStaff: [],
  }),

  /**
   * Generate test admin data
   */
  generateAdminData: () => ({
    fullName: "Test Admin",
    email: `admin_${Date.now()}@example.com`,
    password: "AdminPassword123!",
    role: "admin",
    status: "ACTIVE",
  }),

  /**
   * Delay execution for async operations
   */
  delay: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),

  /**
   * Generate random ID
   */
  generateId: () => {
    const mongoose = require("mongoose");
    return new mongoose.Types.ObjectId().toString();
  },

  /**
   * Generate random email
   */
  generateEmail: (prefix = "test") => {
    return `${prefix}_${Date.now()}_${Math.random()
      .toString(36)
      .substring(7)}@example.com`;
  },

  /**
   * Generate random phone number
   */
  generatePhone: () => {
    const areaCode = Math.floor(Math.random() * 9) + 7; // 7-9
    const middleThree = Math.floor(Math.random() * 999)
      .toString()
      .padStart(3, "0");
    const lastFour = Math.floor(Math.random() * 9999)
      .toString()
      .padStart(4, "0");
    return `+9477${middleThree}${lastFour}`;
  },

  /**
   * Get sample response assertion
   */
  assertSuccessResponse: (response) => {
    expect(response).toBeDefined();
    expect(response.statusCode).toBeLessThan(400);
  },

  /**
   * Get sample error assertion
   */
  assertErrorResponse: (response, expectedStatus = 400) => {
    expect(response).toBeDefined();
    expect(response.statusCode).toBe(expectedStatus);
  },
};

/**
 * Global test hooks
 */
beforeAll(async () => {
  // Optional: Set up test database
  console.log("🧪 Test environment initialized");
});

afterAll(async () => {
  // Optional: Clean up test database
  console.log("🧹 Test environment cleaned up");
});

/**
 * Handle unhandled promise rejections
 */
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

/**
 * Export for use in test files
 */
module.exports = {
  testUtils: global.testUtils,
};
