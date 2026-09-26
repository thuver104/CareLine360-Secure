const mongoose = require("mongoose");
const express = require("express");
const request = require("supertest");
const jwt = require("jsonwebtoken");

const { MongoMemoryServer } = require("mongodb-memory-server");

const User = require("../../../models/User");

const userRoutes = require("../../../routes/userRoutes");

let mongoServer;
let app;

let patientUser;
let doctorUser;

let patientToken;

const createToken = (user) => {
  return jwt.sign(
    {
      userId: user._id.toString(),
      role: user.role,
    },
    process.env.JWT_ACCESS_SECRET,
    {
      expiresIn: "15m",
    },
  );
};

beforeAll(async () => {
  /*
   * Use an isolated secret for this automated test.
   * It does not depend on the developer's real .env secret.
   */
  process.env.JWT_ACCESS_SECRET = "member2-v3-automated-test-secret";

  /*
   * Start temporary in-memory MongoDB.
   */
  mongoServer = await MongoMemoryServer.create();

  await mongoose.connect(mongoServer.getUri());

  /*
   * Create controlled test accounts.
   */
  patientUser = await User.create({
    fullName: "V3 Test Patient",

    email: "v3patient-security@example.com",

    role: "patient",

    passwordHash: "dummy-password-hash",

    refreshTokenHash: "secret-refresh-token-hash",

    isVerified: true,

    isActive: true,

    status: "ACTIVE",
  });

  doctorUser = await User.create({
    fullName: "V3 Test Doctor",

    email: "v3doctor-security@example.com",

    role: "doctor",

    passwordHash: "dummy-password-hash",

    refreshTokenHash: "secret-doctor-refresh-hash",

    isVerified: true,

    isActive: true,

    status: "ACTIVE",
  });

  patientToken = createToken(patientUser);

  /*
   * Create a minimal Express application
   * containing only the routes needed for V3.
   */
  app = express();

  app.use(express.json());

  app.use("/api/users", userRoutes);
});

afterAll(async () => {
  await mongoose.disconnect();

  if (mongoServer) {
    await mongoServer.stop();
  }
});

describe("Member 2 - V3 Missing Authentication", () => {
  test("rejects unauthenticated GET /api/users", async () => {
    const response = await request(app).get("/api/users").expect(401);

    expect(response.body).toHaveProperty("message");
  });

  test("rejects unauthenticated GET /api/users/:id", async () => {
    const response = await request(app)
      .get(`/api/users/${doctorUser._id}`)
      .expect(401);

    expect(response.body).toHaveProperty("message");
  });

  test("rejects invalid JWT", async () => {
    await request(app)
      .get("/api/users")
      .set("Authorization", "Bearer invalid-token")
      .expect(401);
  });

  test("allows authenticated access to GET /api/users", async () => {
    const response = await request(app)
      .get("/api/users")
      .set("Authorization", `Bearer ${patientToken}`)
      .expect(200);

    expect(response.body.success).toBe(true);

    expect(Array.isArray(response.body.data)).toBe(true);
  });

  test("does not expose sensitive fields in user directory", async () => {
    const response = await request(app)
      .get("/api/users")
      .set("Authorization", `Bearer ${patientToken}`)
      .expect(200);

    for (const user of response.body.data) {
      expect(user).not.toHaveProperty("passwordHash");

      expect(user).not.toHaveProperty("refreshTokenHash");

      expect(user).not.toHaveProperty("email");

      expect(user).not.toHaveProperty("phone");
    }
  });

  test("returns only safe fields for authenticated single-user request", async () => {
    const response = await request(app)
      .get(`/api/users/${doctorUser._id}`)
      .set("Authorization", `Bearer ${patientToken}`)
      .expect(200);

    expect(response.body.success).toBe(true);

    expect(response.body.data.fullName).toBe("V3 Test Doctor");

    expect(response.body.data.role).toBe("doctor");

    expect(response.body.data).not.toHaveProperty("passwordHash");

    expect(response.body.data).not.toHaveProperty("refreshTokenHash");

    expect(response.body.data).not.toHaveProperty("email");

    expect(response.body.data).not.toHaveProperty("phone");
  });
});
