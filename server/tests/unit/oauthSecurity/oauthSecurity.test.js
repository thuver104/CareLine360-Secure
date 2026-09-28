const crypto = require("crypto");
const {
  timingSafeStringEqual,
  validateState,
  validateNonce,
  validateRedirectUri,
  isValidPkceVerifierFormat,
  deriveCodeChallengeS256,
  validatePkce,
} = require("../../../middleware/oauthSecurity");

// A valid RFC 7636 verifier is 43-128 chars from [A-Za-z0-9-._~].
const VALID_43 = "a".repeat(43);
const VALID_128 = "a".repeat(128);

describe("oauthSecurity - timingSafeStringEqual", () => {
  test("returns true for equal non-empty strings", () => {
    expect(timingSafeStringEqual("abc123", "abc123")).toBe(true);
  });

  test("returns false for different strings", () => {
    expect(timingSafeStringEqual("abc123", "xyz789")).toBe(false);
  });

  test("returns false for different-length strings", () => {
    expect(timingSafeStringEqual("short", "muchlongerstring")).toBe(false);
  });

  test("returns false when either value is empty", () => {
    expect(timingSafeStringEqual("", "abc")).toBe(false);
    expect(timingSafeStringEqual("abc", "")).toBe(false);
  });

  test("returns false when either value is not a string", () => {
    expect(timingSafeStringEqual(undefined, "abc")).toBe(false);
    expect(timingSafeStringEqual("abc", null)).toBe(false);
  });
});

describe("oauthSecurity - validateState", () => {
  test("valid when received matches expected", () => {
    expect(validateState("state123", "state123")).toEqual({ valid: true });
  });

  test("invalid when state is undefined (fails type check before missing check)", () => {
    expect(validateState(undefined, "state123")).toEqual({ valid: false, reason: "invalid_state_format" });
    expect(validateState("state123", undefined)).toEqual({ valid: false, reason: "invalid_state_format" });
  });

  test("invalid when state is an empty string", () => {
    expect(validateState("", "state123")).toEqual({ valid: false, reason: "missing_state" });
    expect(validateState("state123", "")).toEqual({ valid: false, reason: "missing_state" });
  });

  test("invalid when state does not match (CSRF case)", () => {
    expect(validateState("attacker-state", "state123")).toEqual({ valid: false, reason: "state_mismatch" });
  });

  test("invalid when received state is an array (duplicated query param)", () => {
    expect(validateState(["a", "b"], "state123")).toEqual({ valid: false, reason: "invalid_state_format" });
  });

  test("invalid when received state is an object", () => {
    expect(validateState({ foo: "bar" }, "state123")).toEqual({ valid: false, reason: "invalid_state_format" });
  });
});

describe("oauthSecurity - validateNonce", () => {
  test("valid when received matches expected", () => {
    expect(validateNonce("nonce123", "nonce123")).toEqual({ valid: true });
  });

  test("invalid when nonce is missing", () => {
    expect(validateNonce("", "nonce123")).toEqual({ valid: false, reason: "missing_nonce" });
  });

  test("invalid when nonce does not match (ID token replay case)", () => {
    expect(validateNonce("replayed-nonce", "nonce123")).toEqual({ valid: false, reason: "nonce_mismatch" });
  });

  test("invalid when received nonce is an array (duplicated query param)", () => {
    expect(validateNonce(["a", "b"], "nonce123")).toEqual({ valid: false, reason: "invalid_nonce_format" });
  });

  test("invalid when received nonce is an object", () => {
    expect(validateNonce({ foo: "bar" }, "nonce123")).toEqual({ valid: false, reason: "invalid_nonce_format" });
  });
});

describe("oauthSecurity - validateRedirectUri", () => {
  const allowed = "http://localhost:5173/auth/google/callback";

  test("valid when redirect URI exactly matches allowed URI", () => {
    expect(validateRedirectUri(allowed, allowed)).toEqual({ valid: true });
  });

  test("invalid when redirect URI is undefined (fails type check before missing check)", () => {
    expect(validateRedirectUri(undefined, allowed)).toEqual({ valid: false, reason: "invalid_redirect_uri_format" });
  });

  test("invalid when allowed URI is not configured (undefined)", () => {
    expect(validateRedirectUri(allowed, undefined)).toEqual({ valid: false, reason: "invalid_redirect_uri_format" });
  });

  test("invalid when redirect URI is an empty string", () => {
    expect(validateRedirectUri("", allowed)).toEqual({ valid: false, reason: "missing_redirect_uri" });
  });

  test("invalid when redirect URI points to an unauthorized host", () => {
    expect(validateRedirectUri("http://evil.example.com/callback", allowed)).toEqual({
      valid: false,
      reason: "redirect_uri_not_allowed",
    });
  });

  test("invalid when redirect URI is a subpath/prefix variant of the allowed URI", () => {
    expect(validateRedirectUri(`${allowed}/extra`, allowed)).toEqual({
      valid: false,
      reason: "redirect_uri_not_allowed",
    });
  });

  test("invalid when redirect URI is an array", () => {
    expect(validateRedirectUri([allowed], allowed)).toEqual({
      valid: false,
      reason: "invalid_redirect_uri_format",
    });
  });

  test("invalid when redirect URI is an object", () => {
    expect(validateRedirectUri({ url: allowed }, allowed)).toEqual({
      valid: false,
      reason: "invalid_redirect_uri_format",
    });
  });
});

describe("oauthSecurity - PKCE format validation (RFC 7636 §4.1)", () => {
  test("isValidPkceVerifierFormat accepts a valid 43-character verifier (minimum length)", () => {
    expect(isValidPkceVerifierFormat(VALID_43)).toBe(true);
  });

  test("isValidPkceVerifierFormat accepts a valid 128-character verifier (maximum length)", () => {
    expect(isValidPkceVerifierFormat(VALID_128)).toBe(true);
  });

  test("isValidPkceVerifierFormat rejects a verifier shorter than 43 characters", () => {
    expect(isValidPkceVerifierFormat("a".repeat(42))).toBe(false);
  });

  test("isValidPkceVerifierFormat rejects a verifier longer than 128 characters", () => {
    expect(isValidPkceVerifierFormat("a".repeat(129))).toBe(false);
  });

  test("isValidPkceVerifierFormat rejects a verifier with invalid characters", () => {
    // 43 chars but includes '+' and '/', which are outside the RFC 7636 unreserved set
    expect(isValidPkceVerifierFormat("a".repeat(41) + "+/")).toBe(false);
  });

  test("isValidPkceVerifierFormat rejects undefined, null, and non-string types", () => {
    expect(isValidPkceVerifierFormat(undefined)).toBe(false);
    expect(isValidPkceVerifierFormat(null)).toBe(false);
    expect(isValidPkceVerifierFormat(12345)).toBe(false);
    expect(isValidPkceVerifierFormat(["a".repeat(43)])).toBe(false);
    expect(isValidPkceVerifierFormat({ verifier: VALID_43 })).toBe(false);
  });
});

describe("oauthSecurity - deriveCodeChallengeS256", () => {
  test("matches manual SHA-256/base64url computation for a valid verifier", () => {
    const verifier = "a".repeat(43);
    const expected = crypto.createHash("sha256").update(verifier, "utf8").digest("base64url");

    expect(deriveCodeChallengeS256(verifier)).toBe(expected);
  });

  test("does not throw and returns null for undefined input", () => {
    expect(() => deriveCodeChallengeS256(undefined)).not.toThrow();
    expect(deriveCodeChallengeS256(undefined)).toBeNull();
  });

  test("does not throw and returns null for null input", () => {
    expect(() => deriveCodeChallengeS256(null)).not.toThrow();
    expect(deriveCodeChallengeS256(null)).toBeNull();
  });

  test("does not throw and returns null for array input", () => {
    expect(() => deriveCodeChallengeS256(["a".repeat(43)])).not.toThrow();
    expect(deriveCodeChallengeS256(["a".repeat(43)])).toBeNull();
  });

  test("does not throw and returns null for object input", () => {
    expect(() => deriveCodeChallengeS256({ verifier: VALID_43 })).not.toThrow();
    expect(deriveCodeChallengeS256({ verifier: VALID_43 })).toBeNull();
  });

  test("returns null for a string that is too short to be RFC-compliant", () => {
    expect(deriveCodeChallengeS256("too-short")).toBeNull();
  });
});

describe("oauthSecurity - validatePkce", () => {
  test("valid when code_verifier matches the expected code_challenge (43-char verifier)", () => {
    const challenge = deriveCodeChallengeS256(VALID_43);
    expect(validatePkce(VALID_43, challenge)).toEqual({ valid: true });
  });

  test("valid when code_verifier matches the expected code_challenge (128-char verifier)", () => {
    const challenge = deriveCodeChallengeS256(VALID_128);
    expect(validatePkce(VALID_128, challenge)).toEqual({ valid: true });
  });

  test("invalid when code_verifier is missing", () => {
    const challenge = deriveCodeChallengeS256(VALID_43);
    expect(validatePkce(undefined, challenge)).toEqual({ valid: false, reason: "missing_pkce_verifier" });
  });

  test("invalid when expected code_challenge is missing", () => {
    expect(validatePkce(VALID_43, undefined)).toEqual({ valid: false, reason: "missing_pkce_verifier" });
  });

  test("invalid when code_verifier does not correspond to the code_challenge", () => {
    const challenge = deriveCodeChallengeS256(VALID_43);
    const wrongVerifier = "b".repeat(43);
    expect(validatePkce(wrongVerifier, challenge)).toEqual({
      valid: false,
      reason: "pkce_verification_failed",
    });
  });

  test("invalid when code_verifier is shorter than 43 characters", () => {
    const shortVerifier = "a".repeat(42);
    const challenge = deriveCodeChallengeS256(VALID_43);
    expect(validatePkce(shortVerifier, challenge)).toEqual({
      valid: false,
      reason: "invalid_pkce_verifier_format",
    });
  });

  test("invalid when code_verifier is longer than 128 characters", () => {
    const longVerifier = "a".repeat(129);
    const challenge = deriveCodeChallengeS256(VALID_43);
    expect(validatePkce(longVerifier, challenge)).toEqual({
      valid: false,
      reason: "invalid_pkce_verifier_format",
    });
  });

  test("invalid when code_verifier contains characters outside the RFC 7636 unreserved set", () => {
    const invalidVerifier = "a".repeat(41) + "+/";
    const challenge = deriveCodeChallengeS256(VALID_43);
    expect(validatePkce(invalidVerifier, challenge)).toEqual({
      valid: false,
      reason: "invalid_pkce_verifier_format",
    });
  });

  test("invalid when code_verifier is an array or object (does not throw)", () => {
    const challenge = deriveCodeChallengeS256(VALID_43);
    expect(() => validatePkce(["a".repeat(43)], challenge)).not.toThrow();
    expect(validatePkce({ verifier: VALID_43 }, challenge)).toEqual({
      valid: false,
      reason: "invalid_pkce_verifier_format",
    });
  });
});
