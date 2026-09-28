/**
 * OAuth Security Control Demonstration (standalone)
 *
 * This is NOT an end-to-end Google OAuth test. It does not exercise any
 * HTTP endpoint, authorization-code exchange, ID-token verification, or
 * frontend flow — none of that exists in the application yet.
 *
 * This file demonstrates, in isolation, that the standalone security
 * validators in server/middleware/oauthSecurity.js correctly accept
 * well-formed values and reject attacker-style/malformed values for:
 *   - state (CSRF protection)
 *   - nonce (OIDC replay protection)
 *   - redirect URI (allowlist enforcement)
 *   - PKCE code_verifier (RFC 7636 S256)
 *
 * All values used below are fixed, non-secret test fixtures — never real
 * OAuth codes, tokens, or credentials.
 */

const {
  validateState,
  validateNonce,
  validateRedirectUri,
  validatePkce,
  deriveCodeChallengeS256,
} = require("../../middleware/oauthSecurity");

// Fixed, non-secret test fixtures.
const EXPECTED_STATE = "fixed-test-state-value-001";
const EXPECTED_NONCE = "fixed-test-nonce-value-001";
const ALLOWED_REDIRECT_URI = "http://localhost:5173/auth/google/callback";

// A valid RFC 7636 code_verifier is 43-128 chars from [A-Za-z0-9-._~].
const VALID_CODE_VERIFIER = "a".repeat(43);
const EXPECTED_CODE_CHALLENGE = deriveCodeChallengeS256(VALID_CODE_VERIFIER);

// Tallies for the closing summary (updated by each test via a small helper).
const results = {
  attackCasesTotal: 0,
  attackCasesRejected: 0,
  validCasesTotal: 0,
  validCasesPassed: 0,
};

function expectRejected(result, expectedReason) {
  results.attackCasesTotal += 1;
  expect(result.valid).toBe(false);
  if (expectedReason) {
    expect(result.reason).toBe(expectedReason);
  }
  results.attackCasesRejected += 1;
}

function expectValid(result) {
  results.validCasesTotal += 1;
  expect(result).toEqual({ valid: true });
  results.validCasesPassed += 1;
}

describe("OAuth Security Control Demonstration - state (CSRF protection)", () => {
  test("1. rejects a callback request with state missing entirely", () => {
    expectRejected(validateState(undefined, EXPECTED_STATE), "invalid_state_format");
  });

  test("2. rejects a callback request with an invalid/mismatched state (CSRF attempt)", () => {
    expectRejected(validateState("attacker-forged-state", EXPECTED_STATE), "state_mismatch");
  });

  test("3. rejects a non-string / duplicated-query-style state value", () => {
    // Simulates ?state=a&state=b, which Express/qs parses as an array.
    expectRejected(validateState([EXPECTED_STATE, "attacker-injected"], EXPECTED_STATE), "invalid_state_format");
  });

  test("4. accepts a valid state that matches the originally issued value", () => {
    expectValid(validateState(EXPECTED_STATE, EXPECTED_STATE));
  });
});

describe("OAuth Security Control Demonstration - nonce (OIDC replay protection)", () => {
  test("5. rejects an ID token context with nonce missing entirely", () => {
    expectRejected(validateNonce(undefined, EXPECTED_NONCE), "invalid_nonce_format");
  });

  test("6. rejects an invalid/mismatched nonce (replayed ID token attempt)", () => {
    expectRejected(validateNonce("replayed-nonce-from-other-session", EXPECTED_NONCE), "nonce_mismatch");
  });

  test("7. rejects a non-string nonce value", () => {
    expectRejected(validateNonce({ nonce: EXPECTED_NONCE }, EXPECTED_NONCE), "invalid_nonce_format");
  });

  test("8. accepts a valid nonce that matches the originally issued value", () => {
    expectValid(validateNonce(EXPECTED_NONCE, EXPECTED_NONCE));
  });
});

describe("OAuth Security Control Demonstration - redirect URI (allowlist enforcement)", () => {
  test("9. rejects an unauthorized redirect URI (attacker-controlled domain)", () => {
    expectRejected(
      validateRedirectUri("http://attacker.example.com/callback", ALLOWED_REDIRECT_URI),
      "redirect_uri_not_allowed"
    );
  });

  test("10. rejects a malicious subpath/prefix variant of the allowed redirect URI", () => {
    expectRejected(
      validateRedirectUri(`${ALLOWED_REDIRECT_URI}/../attacker`, ALLOWED_REDIRECT_URI),
      "redirect_uri_not_allowed"
    );
  });

  test("11. rejects a non-string redirect URI value", () => {
    expectRejected(validateRedirectUri(["http://attacker.example.com"], ALLOWED_REDIRECT_URI), "invalid_redirect_uri_format");
  });

  test("12. accepts the exact configured redirect URI", () => {
    expectValid(validateRedirectUri(ALLOWED_REDIRECT_URI, ALLOWED_REDIRECT_URI));
  });
});

describe("OAuth Security Control Demonstration - PKCE code_verifier (RFC 7636, S256)", () => {
  test("13. rejects a missing code_verifier at token exchange", () => {
    expectRejected(validatePkce(undefined, EXPECTED_CODE_CHALLENGE), "missing_pkce_verifier");
  });

  test("14. rejects a code_verifier shorter than the RFC 7636 minimum (43 chars)", () => {
    const shortVerifier = "a".repeat(42);
    expectRejected(validatePkce(shortVerifier, EXPECTED_CODE_CHALLENGE), "invalid_pkce_verifier_format");
  });

  test("15. rejects a code_verifier longer than the RFC 7636 maximum (128 chars)", () => {
    const longVerifier = "a".repeat(129);
    expectRejected(validatePkce(longVerifier, EXPECTED_CODE_CHALLENGE), "invalid_pkce_verifier_format");
  });

  test("16. rejects a code_verifier containing characters outside the RFC 7636 unreserved set", () => {
    const invalidCharsVerifier = "a".repeat(41) + "+/";
    expectRejected(validatePkce(invalidCharsVerifier, EXPECTED_CODE_CHALLENGE), "invalid_pkce_verifier_format");
  });

  test("17. rejects a well-formed but wrong code_verifier (does not correspond to the issued code_challenge)", () => {
    const wrongVerifier = "b".repeat(43);
    expectRejected(validatePkce(wrongVerifier, EXPECTED_CODE_CHALLENGE), "pkce_verification_failed");
  });

  test("18. accepts a valid RFC 7636 code_verifier that matches the issued code_challenge", () => {
    expectValid(validatePkce(VALID_CODE_VERIFIER, EXPECTED_CODE_CHALLENGE));
  });
});

afterAll(() => {
  const attackLine = `Rejected attack cases: ${results.attackCasesRejected}/${results.attackCasesTotal}`;
  const validLine = `Valid security cases: ${results.validCasesPassed}/${results.validCasesTotal}`;
  const overall =
    results.attackCasesRejected === results.attackCasesTotal && results.validCasesPassed === results.validCasesTotal
      ? "PASS"
      : "FAIL";

  // eslint-disable-next-line no-console
  console.log("OAuth Security Control Demonstration");
  // eslint-disable-next-line no-console
  console.log(attackLine);
  // eslint-disable-next-line no-console
  console.log(validLine);
  // eslint-disable-next-line no-console
  console.log(`Overall: ${overall}`);
});
