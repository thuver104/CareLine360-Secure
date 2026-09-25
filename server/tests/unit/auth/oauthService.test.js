/**
 * UNIT TESTS – oauthService.resolveOrCreateOAuthUser
 *
 * Runs against an in-memory MongoDB with mock (already verified) Google
 * profiles — no real Google login needed.
 */

const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

const User = require("../../../models/User");
const Patient = require("../../../models/Patient");
const { resolveOrCreateOAuthUser } = require("../../../services/oauthService");
const { loginUser } = require("../../../services/authService");

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
  await User.syncIndexes();
});

afterEach(async () => {
  await Promise.all(Object.values(mongoose.connection.collections).map((c) => c.deleteMany({})));
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

const googleProfile = (overrides = {}) => ({
  sub: "google-sub-123",
  email: "jane@example.com",
  email_verified: true,
  name: "Jane Doe",
  ...overrides,
});

const createLocalUser = (overrides = {}) =>
  User.create({
    role: "patient",
    status: "ACTIVE",
    email: "jane@example.com",
    fullName: "Jane Local",
    passwordHash: "hash",
    isVerified: true,
    ...overrides,
  });

describe("new user (first Google sign-in)", () => {
  test("creates an ACTIVE, verified patient with a patient profile and no password", async () => {
    const result = await resolveOrCreateOAuthUser(googleProfile());

    expect(result.status).toBe(201);
    expect(result.created).toBe(true);
    expect(result.user.role).toBe("patient");
    expect(result.user.status).toBe("ACTIVE");
    expect(result.user.authProvider).toBe("google");
    expect(result.user.googleId).toBe("google-sub-123");
    expect(result.user.isVerified).toBe(true);
    expect(result.user.passwordHash).toBeUndefined();

    const patient = await Patient.findOne({ userId: result.user._id });
    expect(patient.fullName).toBe("Jane Doe");
    expect(patient.patientId).toMatch(/^PAT-\d{6}$/);
  });

  test("ignores a role field in the input", async () => {
    const result = await resolveOrCreateOAuthUser(googleProfile({ role: "admin" }));
    expect(result.user.role).toBe("patient");

    const other = await resolveOrCreateOAuthUser(
      googleProfile({ sub: "sub-2", email: "doc@example.com", role: "doctor" })
    );
    expect(other.user.role).toBe("patient");
  });

  test("normalizes email case", async () => {
    const result = await resolveOrCreateOAuthUser(googleProfile({ email: "Jane@Example.COM" }));
    expect(result.user.email).toBe("jane@example.com");
  });

  test("a Google-only user cannot log in with a password", async () => {
    await resolveOrCreateOAuthUser(googleProfile());
    const result = await loginUser({ identifier: "jane@example.com", password: "anything" });
    expect(result.status).toBe(401);
  });
});

describe("existing user", () => {
  test("links Google to a verified password account on email match", async () => {
    const local = await createLocalUser();

    const result = await resolveOrCreateOAuthUser(googleProfile());

    expect(result.status).toBe(200);
    expect(result.linked).toBe(true);
    expect(result.user._id.equals(local._id)).toBe(true);
    expect(result.user.authProvider).toBe("local");
    expect((await User.findById(local._id)).googleId).toBe("google-sub-123");
    expect(await User.countDocuments()).toBe(1);
  });

  test("returns the already linked user without relinking", async () => {
    await createLocalUser({ googleId: "google-sub-123" });
    const result = await resolveOrCreateOAuthUser(googleProfile());
    expect(result.status).toBe(200);
    expect(result.linked).toBe(false);
  });

  test("finds the user by Google id even after the Google email changed", async () => {
    const local = await createLocalUser({ googleId: "google-sub-123" });
    const result = await resolveOrCreateOAuthUser(googleProfile({ email: "new-address@example.com" }));
    expect(result.user._id.equals(local._id)).toBe(true);
  });

  test("keeps the existing role, ignoring a role field in the input", async () => {
    await createLocalUser({ role: "doctor" });
    const result = await resolveOrCreateOAuthUser(googleProfile({ role: "admin" }));
    expect(result.user.role).toBe("doctor");
  });

  test("does not link to an unverified password account", async () => {
    await createLocalUser({ isVerified: false });
    const result = await resolveOrCreateOAuthUser(googleProfile());
    expect(result.status).toBe(409);
    expect(result.data.code).toBe("OAUTH_LINK_REQUIRES_VERIFICATION");
    expect((await User.findOne({ email: "jane@example.com" })).googleId).toBeUndefined();
  });
});

describe("disallowed role / status", () => {
  test.each(["admin", "responder"])("rejects %s accounts", async (role) => {
    await createLocalUser({ role });
    const result = await resolveOrCreateOAuthUser(googleProfile());
    expect(result.status).toBe(403);
    expect(result.data.code).toBe("OAUTH_ROLE_NOT_ALLOWED");
  });

  test("rejects a PENDING doctor", async () => {
    await createLocalUser({ role: "doctor", status: "PENDING" });
    const result = await resolveOrCreateOAuthUser(googleProfile());
    expect(result.status).toBe(403);
    expect(result.data.message).toBe("Doctor account not approved yet");
  });

  test.each(["SUSPENDED", "REJECTED"])("rejects a %s account without linking it", async (status) => {
    await createLocalUser({ status });
    const result = await resolveOrCreateOAuthUser(googleProfile());
    expect(result.status).toBe(403);
    expect(result.data.code).toBe("ACCOUNT_NOT_ACTIVE");
    expect((await User.findOne({ email: "jane@example.com" })).googleId).toBeUndefined();
  });

  test("rejects a deactivated account", async () => {
    await createLocalUser({ isActive: false });
    const result = await resolveOrCreateOAuthUser(googleProfile());
    expect(result.status).toBe(403);
    expect(result.data.code).toBe("ACCOUNT_DEACTIVATED");
  });
});

describe("conflicts and invalid input", () => {
  test("rejects when the email already has a different Google account linked", async () => {
    await createLocalUser({ googleId: "other-sub" });
    const result = await resolveOrCreateOAuthUser(googleProfile());
    expect(result.status).toBe(409);
    expect(result.data.code).toBe("OAUTH_ACCOUNT_CONFLICT");
  });

  test("rejects when the Google id and the email belong to different users", async () => {
    await createLocalUser({ email: "someone@example.com", googleId: "google-sub-123" });
    await createLocalUser();
    const result = await resolveOrCreateOAuthUser(googleProfile());
    expect(result.status).toBe(409);
    expect(result.data.code).toBe("OAUTH_ACCOUNT_CONFLICT");
  });

  test.each([false, undefined, "false"])("rejects email_verified=%p", async (emailVerified) => {
    const result = await resolveOrCreateOAuthUser(googleProfile({ email_verified: emailVerified }));
    expect(result.status).toBe(403);
    expect(await User.countDocuments()).toBe(0);
  });

  test.each([
    ["missing sub", { sub: undefined }],
    ["missing email", { email: undefined }],
    ["non-string email", { email: { $ne: null } }],
  ])("rejects %s", async (_label, overrides) => {
    const result = await resolveOrCreateOAuthUser(googleProfile(overrides));
    expect(result.status).toBe(400);
  });

  test("rejects a missing profile", async () => {
    expect((await resolveOrCreateOAuthUser(undefined)).status).toBe(400);
  });
});
