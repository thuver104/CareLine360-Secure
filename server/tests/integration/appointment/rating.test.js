const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const express = require("express");
const request = require("supertest");

const User = require("../../../models/User");
const Appointment = require("../../../models/Appointment");
const Rating = require("../../../models/Rating");
const Doctor = require("../../../models/Doctor");
const appointmentRoutes = require("../../../routes/appointmentRoutes");
const errorHandler = require("../../../middleware/errorHandler");
const { signAccessToken } = require("../../../utils/tokens");

// Mock email service
jest.mock("../../../services/emailService", () => ({
  sendAppointmentCreated: jest.fn(),
  sendAppointmentConfirmed: jest.fn(),
  sendAppointmentRescheduled: jest.fn(),
  sendAppointmentCancelled: jest.fn(),
}));

let mongoServer;
let app;
let patient, doctor, doctorProfile;
let patientToken, doctorToken;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  process.env.JWT_ACCESS_SECRET = "test-secret";

  app = express();
  app.use(express.json());
  app.use("/api/appointments", appointmentRoutes);
  app.use(errorHandler);

  patient = await User.create({
    fullName: "Test Patient",
    email: "patient@test.com",
    role: "patient",
    passwordHash: "hashedpassword123",
  });
  doctor = await User.create({
    fullName: "Test Doctor",
    email: "doctor@test.com",
    role: "doctor",
    passwordHash: "hashedpassword123",
  });

  doctorProfile = await Doctor.create({
    userId: doctor._id,
    doctorId: "DOC-000001",
    fullName: "Test Doctor",
    rating: 0,
    totalRatings: 0,
  });

  patientToken = signAccessToken({ userId: patient._id, role: "patient" });
  doctorToken = signAccessToken({ userId: doctor._id, role: "doctor" });
}, 30000);

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  await Appointment.deleteMany({});
  await Rating.deleteMany({});
  await Doctor.updateOne({ _id: doctorProfile._id }, { rating: 0, totalRatings: 0 });
});

describe("Appointment Rating Integration", () => {
  const createCompletedAppointment = async () => {
    const appointment = await Appointment.create({
      patient: patient._id,
      doctor: doctor._id,
      date: new Date("2026-03-01"),
      time: "10:00",
      consultationType: "video",
      status: "completed",
    });
    return appointment;
  };

  it("POST /:id/rating - should submit a rating for completed appointment", async () => {
    const appointment = await createCompletedAppointment();

    const res = await request(app)
      .post(`/api/appointments/${appointment._id}/rating`)
      .set("Authorization", `Bearer ${patientToken}`)
      .send({ rating: 5, review: "Excellent consultation" });

    expect(res.status).toBe(201);
    expect(res.body.data.rating).toBe(5);
    expect(res.body.data.review).toBe("Excellent consultation");

    // Check doctor average updated
    const updatedDoctor = await Doctor.findById(doctorProfile._id);
    expect(updatedDoctor.rating).toBe(5);
    expect(updatedDoctor.totalRatings).toBe(1);
  });

  it("GET /:id/rating - should return the rating for an appointment", async () => {
    const appointment = await createCompletedAppointment();

    await Rating.create({
      doctorId: doctor._id,
      patientId: patient._id,
      appointmentId: appointment._id,
      rating: 4,
      review: "Good",
    });

    const res = await request(app)
      .get(`/api/appointments/${appointment._id}/rating`)
      .set("Authorization", `Bearer ${patientToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.rating).toBe(4);
  });

  it("POST /:id/rating - should reject rating for non-completed appointment", async () => {
    const appointment = await Appointment.create({
      patient: patient._id,
      doctor: doctor._id,
      date: new Date("2026-03-01"),
      time: "10:00",
      consultationType: "video",
      status: "pending",
    });

    const res = await request(app)
      .post(`/api/appointments/${appointment._id}/rating`)
      .set("Authorization", `Bearer ${patientToken}`)
      .send({ rating: 5 });

    expect(res.status).toBe(400);
  });

  it("GET /stats - should return appointment statistics", async () => {
    await createCompletedAppointment();
    await Appointment.create({
      patient: patient._id,
      doctor: doctor._id,
      date: new Date("2026-03-02"),
      time: "11:00",
      consultationType: "video",
      status: "pending",
    });

    const res = await request(app)
      .get("/api/appointments/stats")
      .set("Authorization", `Bearer ${patientToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.total).toBe(2);
    expect(res.body.data.completed).toBe(1);
    expect(res.body.data.pending).toBe(1);
  });
});
