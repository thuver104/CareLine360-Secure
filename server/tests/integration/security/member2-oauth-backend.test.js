/**
 * OAuth backend: code exchange + ID-token verification + session.
 * google-auth-library is mocked so tests run without hitting Google.
 * oauthService (Member 3) and the token util are mocked to isolate this layer.
 */
const express = require("express");
const request = require("supertest");

const mockGetToken = jest.fn();
const mockVerifyIdToken = jest.fn();
jest.mock("google-auth-library", () => ({
  OAuth2Client: jest.fn().mockImplementation(() => ({
    getToken: mockGetToken,
    verifyIdToken: mockVerifyIdToken,
  })),
}));

jest.mock("../../../services/oauthService", () => ({
  resolveOrCreateOAuthUser: jest.fn(),
}));
jest.mock("../../../utils/tokens", () => ({
  signAccessToken: jest.fn(() => "access.jwt.token"),
  signRefreshToken: jest.fn(() => "refresh.jwt.token"),
}));
jest.mock("bcryptjs", () => ({ hash: jest.fn(async () => "hashed") }));

const { resolveOrCreateOAuthUser } = require("../../../services/oauthService");
const { googleLogin } = require("../../../controllers/oauthController");

const buildApp = () => {
  const app = express();
  app.use(express.json());
  app.post("/api/auth/google", googleLogin);
  return app;
};

const app = buildApp();
const goodTicket = (over = {}) => ({
  getPayload: () => ({
    sub: "google-sub-123",
    email: "patient@example.com",
    email_verified: true,
    name: "Test Patient",
    ...over,
  }),
});
const fakeUser = {
  _id: "64b000000000000000000a01",
  role: "patient",
  email: "patient@example.com",
  phone: null,
  fullName: "Test Patient",
  isVerified: true,
  save: jest.fn(async function () {
    return this;
  }),
};

beforeEach(() => {
  jest.clearAllMocks();
  process.env.GOOGLE_CLIENT_ID = "test-client-id";
});

describe("Member 2 - OAuth backend endpoint", () => {
  test("valid code + verified token issues a CareLine360 session", async () => {
    mockGetToken.mockResolvedValue({ tokens: { id_token: "valid.id.token" } });
    mockVerifyIdToken.mockResolvedValue(goodTicket());
    resolveOrCreateOAuthUser.mockResolvedValue({
      status: 200,
      user: { ...fakeUser },
      created: false,
      linked: false,
    });

    const res = await request(app)
      .post("/api/auth/google")
      .send({ code: "auth-code", code_verifier: "verifier" })
      .expect(200);

    expect(res.body.accessToken).toBe("access.jwt.token");
    expect(res.body.refreshToken).toBe("refresh.jwt.token");
    expect(res.body.user.email).toBe("patient@example.com");
    expect(resolveOrCreateOAuthUser).toHaveBeenCalledWith(
      expect.objectContaining({ sub: "google-sub-123", email_verified: true }),
    );
  });

  test("missing code is rejected before any Google call", async () => {
    const res = await request(app)
      .post("/api/auth/google")
      .send({ code_verifier: "verifier" })
      .expect(400);
    expect(mockGetToken).not.toHaveBeenCalled();
    expect(res.body.message).toMatch(/authorization code/i);
  });

  test("missing PKCE verifier is rejected", async () => {
    await request(app)
      .post("/api/auth/google")
      .send({ code: "auth-code" })
      .expect(400);
    expect(mockGetToken).not.toHaveBeenCalled();
  });

  test("invalid/expired code (exchange fails) returns generic 401", async () => {
    mockGetToken.mockRejectedValue(new Error("invalid_grant: bad code"));
    const res = await request(app)
      .post("/api/auth/google")
      .send({ code: "bad", code_verifier: "verifier" })
      .expect(401);
    expect(res.body.message).toBe("Google sign-in failed");
    expect(res.body.message).not.toMatch(/invalid_grant/);
  });

  test("tampered/invalid ID token (verify fails) returns generic 401", async () => {
    mockGetToken.mockResolvedValue({ tokens: { id_token: "tampered" } });
    mockVerifyIdToken.mockRejectedValue(
      new Error("Wrong recipient, payload audience != requiredAudience"),
    );
    const res = await request(app)
      .post("/api/auth/google")
      .send({ code: "auth-code", code_verifier: "verifier" })
      .expect(401);
    expect(res.body.message).toBe("Google sign-in failed");
    expect(res.body.message).not.toMatch(/audience/i);
  });

  test("mapping rejection (e.g. staff role) is surfaced with its safe code", async () => {
    mockGetToken.mockResolvedValue({ tokens: { id_token: "valid.id.token" } });
    mockVerifyIdToken.mockResolvedValue(
      goodTicket({ email: "admin@example.com" }),
    );
    resolveOrCreateOAuthUser.mockResolvedValue({
      status: 403,
      data: {
        code: "OAUTH_ROLE_NOT_ALLOWED",
        message: "Please sign in with your email and password.",
      },
    });
    const res = await request(app)
      .post("/api/auth/google")
      .send({ code: "auth-code", code_verifier: "verifier" })
      .expect(403);
    expect(res.body.code).toBe("OAUTH_ROLE_NOT_ALLOWED");
    expect(res.body.accessToken).toBeUndefined();
  });

  test("no id_token in Google response returns generic 401", async () => {
    mockGetToken.mockResolvedValue({ tokens: {} });
    await request(app)
      .post("/api/auth/google")
      .send({ code: "auth-code", code_verifier: "verifier" })
      .expect(401);
  });
});
