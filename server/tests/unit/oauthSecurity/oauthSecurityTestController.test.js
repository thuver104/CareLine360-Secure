/**
 * Unit tests for the TEMPORARY security-testing controller
 * (server/controllers/oauthSecurityTestController.js).
 *
 * This controller/route is temporary, for Postman evidence-gathering only,
 * and must be removed before production deployment. These tests verify it
 * correctly delegates to the existing oauthSecurity.js validators and never
 * echoes back sensitive input values.
 */

const { runOauthSecurityTest } = require("../../../controllers/oauthSecurityTestController");
const { deriveCodeChallengeS256 } = require("../../../middleware/oauthSecurity");

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe("oauthSecurityTestController - runOauthSecurityTest", () => {
  test("rejects a request with a missing 'test' field with HTTP 400", () => {
    const req = { body: {} };
    const res = mockRes();

    runOauthSecurityTest(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false })
    );
  });

  test("rejects a request with an unsupported 'test' value with HTTP 400", () => {
    const req = { body: { test: "not-a-real-test" } };
    const res = mockRes();

    runOauthSecurityTest(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false })
    );
  });

  test("state test: returns HTTP 200 and valid:true for a matching state", () => {
    const req = { body: { test: "state", receivedState: "abc", expectedState: "abc" } };
    const res = mockRes();

    runOauthSecurityTest(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      test: "state",
      valid: true,
      message: "OAuth security validation passed",
    });
  });

  test("state test: returns HTTP 200 and valid:false for a mismatched state", () => {
    const req = { body: { test: "state", receivedState: "attacker", expectedState: "abc" } };
    const res = mockRes();

    runOauthSecurityTest(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      test: "state",
      valid: false,
      message: "OAuth security validation rejected",
    });
  });

  test("state test: response never echoes back receivedState or expectedState", () => {
    const req = { body: { test: "state", receivedState: "abc", expectedState: "abc" } };
    const res = mockRes();

    runOauthSecurityTest(req, res);

    const responseBody = res.json.mock.calls[0][0];
    expect(responseBody).not.toHaveProperty("receivedState");
    expect(responseBody).not.toHaveProperty("expectedState");
    expect(responseBody).not.toHaveProperty("reason");
  });

  test("nonce test: returns HTTP 200 and valid:true for a matching nonce", () => {
    const req = { body: { test: "nonce", receivedNonce: "n1", expectedNonce: "n1" } };
    const res = mockRes();

    runOauthSecurityTest(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ test: "nonce", valid: true })
    );
  });

  test("nonce test: returns HTTP 200 and valid:false for a mismatched nonce", () => {
    const req = { body: { test: "nonce", receivedNonce: "attacker-nonce", expectedNonce: "n1" } };
    const res = mockRes();

    runOauthSecurityTest(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ test: "nonce", valid: false })
    );
  });

  test("redirect test: returns HTTP 200 and valid:true for an exact-matching redirect URI", () => {
    const req = {
      body: {
        test: "redirect",
        redirectUri: "http://localhost:5173/auth/google/callback",
        allowedRedirectUri: "http://localhost:5173/auth/google/callback",
      },
    };
    const res = mockRes();

    runOauthSecurityTest(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ test: "redirect", valid: true })
    );
  });

  test("redirect test: returns HTTP 200 and valid:false for an unauthorized redirect URI", () => {
    const req = {
      body: {
        test: "redirect",
        redirectUri: "http://attacker.example.com/callback",
        allowedRedirectUri: "http://localhost:5173/auth/google/callback",
      },
    };
    const res = mockRes();

    runOauthSecurityTest(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ test: "redirect", valid: false })
    );
  });

  test("redirect test: falls back to process.env.GOOGLE_REDIRECT_URI when allowedRedirectUri is omitted", () => {
    const originalEnv = process.env.GOOGLE_REDIRECT_URI;
    process.env.GOOGLE_REDIRECT_URI = "http://localhost:5173/auth/google/callback";

    const req = {
      body: {
        test: "redirect",
        redirectUri: "http://localhost:5173/auth/google/callback",
      },
    };
    const res = mockRes();

    runOauthSecurityTest(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ test: "redirect", valid: true })
    );

    process.env.GOOGLE_REDIRECT_URI = originalEnv;
  });

  test("pkce test: returns HTTP 200 and valid:true for a matching code_verifier/code_challenge", () => {
    const verifier = "a".repeat(43);
    const challenge = deriveCodeChallengeS256(verifier);
    const req = { body: { test: "pkce", codeVerifier: verifier, expectedCodeChallenge: challenge } };
    const res = mockRes();

    runOauthSecurityTest(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ test: "pkce", valid: true })
    );
  });

  test("pkce test: returns HTTP 200 and valid:false for a mismatched code_verifier", () => {
    const challenge = deriveCodeChallengeS256("a".repeat(43));
    const req = { body: { test: "pkce", codeVerifier: "b".repeat(43), expectedCodeChallenge: challenge } };
    const res = mockRes();

    runOauthSecurityTest(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ test: "pkce", valid: false })
    );
  });

  test("pkce test: response never echoes back codeVerifier or expectedCodeChallenge", () => {
    const verifier = "a".repeat(43);
    const challenge = deriveCodeChallengeS256(verifier);
    const req = { body: { test: "pkce", codeVerifier: verifier, expectedCodeChallenge: challenge } };
    const res = mockRes();

    runOauthSecurityTest(req, res);

    const responseBody = res.json.mock.calls[0][0];
    expect(responseBody).not.toHaveProperty("codeVerifier");
    expect(responseBody).not.toHaveProperty("expectedCodeChallenge");
    expect(responseBody).not.toHaveProperty("reason");
  });
});
