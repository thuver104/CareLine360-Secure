/**
 * ============================================================================
 * TEMPORARY SECURITY TESTING ONLY — MUST BE REMOVED BEFORE PRODUCTION DEPLOYMENT
 * ============================================================================
 *
 * This controller exists solely so the OAuth security-control validators in
 * server/middleware/oauthSecurity.js can be exercised over HTTP (e.g. with
 * Postman) to capture security evidence. It does NOT implement the real
 * Google OAuth flow — no authorization-code exchange, no Google ID-token
 * verification, no CareLine360 JWT/session issuance happens here.
 *
 * Do not extend this controller with real OAuth logic. Delete this file
 * and its route before production deployment.
 */

const {
  validateState,
  validateNonce,
  validateRedirectUri,
  validatePkce,
} = require("../middleware/oauthSecurity");

const SUPPORTED_TESTS = ["state", "nonce", "redirect", "pkce"];

/**
 * POST /api/auth/oauth/security-test
 *
 * Runs one of the standalone oauthSecurity.js validators against the
 * provided input and reports only whether it passed or was rejected.
 * Never echoes back the values it was given, and never logs them.
 */
function runOauthSecurityTest(req, res) {
  const { test } = req.body || {};

  if (!SUPPORTED_TESTS.includes(test)) {
    return res.status(400).json({
      success: false,
      message: "Unsupported or missing 'test' value. Expected one of: state, nonce, redirect, pkce.",
    });
  }

  let result;

  switch (test) {
    case "state": {
      const { receivedState, expectedState } = req.body;
      result = validateState(receivedState, expectedState);
      break;
    }
    case "nonce": {
      const { receivedNonce, expectedNonce } = req.body;
      result = validateNonce(receivedNonce, expectedNonce);
      break;
    }
    case "redirect": {
      const { redirectUri, allowedRedirectUri } = req.body;
      result = validateRedirectUri(redirectUri, allowedRedirectUri || process.env.GOOGLE_REDIRECT_URI);
      break;
    }
    case "pkce": {
      const { codeVerifier, expectedCodeChallenge } = req.body;
      result = validatePkce(codeVerifier, expectedCodeChallenge);
      break;
    }
  }

  // Intentionally do not include result.reason, or any request input, in
  // the response — only the boolean outcome is exposed.
  return res.status(200).json({
    success: true,
    test,
    valid: result.valid,
    message: result.valid ? "OAuth security validation passed" : "OAuth security validation rejected",
  });
}

module.exports = { runOauthSecurityTest };
