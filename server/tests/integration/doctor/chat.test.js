const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const express = require("express");
const request = require("supertest");
const jwt = require("jsonwebtoken");

const User = require("../../../models/User");
const Appointment = require("../../../models/Appointment");
const ChatMessage = require("../../../models/ChatMessage");
const chatRoutes = require("../../../routes/chatRoutes");
const errorHandler = require("../../../middleware/errorHandler");

let mongoServer, app;
let patient, doctor, appointment, patientToken;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  process.env.JWT_ACCESS_SECRET = "test-secret";

  app = express();
  app.use(express.json());
  app.use("/api/chat", chatRoutes);
  app.use(errorHandler);

  patient = await User.create({ email: "patient@chat.com", role: "patient", passwordHash: "hashed" });
  doctor = await User.create({ email: "doctor@chat.com", role: "doctor", passwordHash: "hashed" });
  appointment = await Appointment.create({
    patient: patient._id,
    doctor: doctor._id,
    date: new Date("2026-04-01"),
    time: "10:00",
    consultationType: "video",
    status: "confirmed",
  });

  patientToken = jwt.sign({ userId: patient._id.toString(), role: "patient" }, process.env.JWT_ACCESS_SECRET);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  await ChatMessage.deleteMany({});
});

describe("Chat API", () => {
  describe("GET /api/chat/:appointmentId", () => {
    it("should return messages for an appointment", async () => {
      await ChatMessage.create({
        appointmentId: appointment._id,
        senderId: patient._id,
        senderRole: "patient",
        message: "Hello doctor",
      });
      await ChatMessage.create({
        appointmentId: appointment._id,
        senderId: doctor._id,
        senderRole: "doctor",
        message: "Hi, how can I help?",
      });

      const res = await request(app)
        .get(`/api/chat/${appointment._id}`)
        .set("Authorization", `Bearer ${patientToken}`)
        .expect(200);

      expect(res.body.messages).toHaveLength(2);
      expect(res.body.messages[0].message).toBe("Hello doctor");
      expect(res.body.messages[1].message).toBe("Hi, how can I help?");
    });

    it("should return empty array for appointment with no messages", async () => {
      const res = await request(app)
        .get(`/api/chat/${appointment._id}`)
        .set("Authorization", `Bearer ${patientToken}`)
        .expect(200);

      expect(res.body.messages).toHaveLength(0);
    });

    it("should return 403 for unauthorized user", async () => {
      const stranger = await User.create({ email: "stranger@chat.com", role: "patient", passwordHash: "h" });
      const strangerToken = jwt.sign({ userId: stranger._id.toString(), role: "patient" }, process.env.JWT_ACCESS_SECRET);

      const res = await request(app)
        .get(`/api/chat/${appointment._id}`)
        .set("Authorization", `Bearer ${strangerToken}`)
        .expect(403);

      expect(res.body.message).toBe("Access denied");
    });

    it("should return 401 without auth token", async () => {
      const res = await request(app)
        .get(`/api/chat/${appointment._id}`)
        .expect(401);
    });
  });

  describe("GET /api/chat/unread/count", () => {
    it("should return unread count for user", async () => {
      await ChatMessage.create({
        appointmentId: appointment._id,
        senderId: doctor._id,
        senderRole: "doctor",
        message: "Please check results",
        isRead: false,
      });

      const res = await request(app)
        .get("/api/chat/unread/count")
        .set("Authorization", `Bearer ${patientToken}`)
        .expect(200);

      expect(res.body.unreadCount).toBe(1);
    });
  });

  describe("GET /api/chat/inbox", () => {
    it("should return chat inbox for user", async () => {
      await ChatMessage.create({
        appointmentId: appointment._id,
        senderId: doctor._id,
        senderRole: "doctor",
        message: "Last message",
      });

      const res = await request(app)
        .get("/api/chat/inbox")
        .set("Authorization", `Bearer ${patientToken}`)
        .expect(200);

      expect(res.body.chats).toBeDefined();
    });
  });
});
