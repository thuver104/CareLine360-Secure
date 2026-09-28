const crypto = require("crypto");

/**
 * OAuth / OIDC security-control validation module.
 *
 * Standalone, reusable validators for the security controls around the
 * Google OAuth authorization-code flow: `state` (CSRF), `nonce` (OIDC
 * replay), redirect URI allowlisting, and PKCE (`code_verifier` /
 * `code_challenge`, S256).
 *
 * This module intentionally does NOT perform the authorization-code
 * exchange, Google ID-token verification, or CareLine360 JWT/session
 * issuance — those belong to the OAuth controller/service layer. Functions
 * here are pure validators meant to be called from that layer.
 *
 * Security note: none of these functions log the values they receive
 * (state, nonce, code_verifier, tokens). Callers must not log them either.
 */

/**
 * Compares two strings without leaking timing information about where the
 * first mismatched character occurs, which prevents a timing side-channel
 * that could otherwise let an attacker guess `state`/`nonce` byte-by-byte.
 *
 * @param {string} a
 * @param {string} b
 * @returns {boolean} true only if both are non-empty strings of equal value
 */
function timingSafeStringEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string") return false;
  if (a.length === 0 || b.length === 0) return false;

  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");

  // timingSafeEqual requires equal-length buffers; unequal length is a
  // safe, immediate rejection (length alone isn't sensitive here).
  if (bufA.length !== bufB.length) return false;

  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Validates the OAuth `state` parameter returned on the callback against
 * the value originally issued when the authorization request was started.
 *
 * Security purpose: `state` is the primary CSRF defense for the OAuth
 * authorization-code flow. Without validating it, an attacker could trick
 * a victim's browser into completing an OAuth callback initiated by the
 * attacker, binding the victim's session to the attacker's identity.
 *
 * @param {string} receivedState - `state` value received on the callback request
 * @param {string} expectedState - `state` value originally issued/stored for this auth attempt
 * @returns {{ valid: boolean, reason?: string }}
 */
function validateState(receivedState, expectedState) {
  // Reject non-string input explicitly (e.g. duplicated query params like
  // ?state=a&state=b arrive as an array) rather than letting it fall
  // through to a misleading "mismatch" result.
  if (typeof receivedState !== "string" || typeof expectedState !== "string") {
    return { valid: false, reason: "invalid_state_format" };
  }

  if (!receivedState || !expectedState) {
    return { valid: false, reason: "missing_state" };
  }

  if (!timingSafeStringEqual(receivedState, expectedState)) {
    return { valid: false, reason: "state_mismatch" };
  }

  return { valid: true };
}

/**
 * Validates the OIDC `nonce` claim from an ID token against the value
 * originally issued when the authorization request was started.
 *
 * Security purpose: `nonce` binds the ID token to this specific
 * authentication request, preventing replay of a previously issued ID
 * token in a different session (ID token replay/injection).
 *
 * @param {string} receivedNonce - `nonce` claim extracted from the ID token
 * @param {string} expectedNonce - `nonce` value originally issued/stored for this auth attempt
 * @returns {{ valid: boolean, reason?: string }}
 */
function validateNonce(receivedNonce, expectedNonce) {
  // Reject non-string input explicitly, same rationale as validateState.
  if (typeof receivedNonce !== "string" || typeof expectedNonce !== "string") {
    return { valid: false, reason: "invalid_nonce_format" };
  }

  if (!receivedNonce || !expectedNonce) {
    return { valid: false, reason: "missing_nonce" };
  }

  if (!timingSafeStringEqual(receivedNonce, expectedNonce)) {
    return { valid: false, reason: "nonce_mismatch" };
  }

  return { valid: true };
}

/**
 * Validates a redirect URI against the single allowed redirect URI
 * configured for this application (`GOOGLE_REDIRECT_URI`).
 *
 * Security purpose: prevents authorization responses/codes from being
 * directed to, or accepted from, an unregistered redirect URI, which is a
 * common OAuth open-redirect / code-interception attack vector.
 *
 * @param {string} redirectUri - redirect URI to validate
 * @param {string} [allowedRedirectUri] - defaults to process.env.GOOGLE_REDIRECT_URI
 * @returns {{ valid: boolean, reason?: string }}
 */
function validateRedirectUri(redirectUri, allowedRedirectUri = process.env.GOOGLE_REDIRECT_URI) {
  // Reject non-string input explicitly, rather than relying on `!==` to
  // fail closed implicitly for non-string types.
  if (typeof redirectUri !== "string" || typeof allowedRedirectUri !== "string") {
    return { valid: false, reason: "invalid_redirect_uri_format" };
  }

  if (!redirectUri || !allowedRedirectUri) {
    return { valid: false, reason: "missing_redirect_uri" };
  }

  // Exact match only — no normalization, no prefix/substring matching,
  // which could otherwise be bypassed with attacker-controlled subpaths,
  // case variants, or query strings.
  if (redirectUri !== allowedRedirectUri) {
    return { valid: false, reason: "redirect_uri_not_allowed" };
  }

  return { valid: true };
}

// RFC 7636 §4.1: code_verifier = 43-128 characters from the unreserved
// character set [A-Za-z0-9-._~]. Enforcing this keeps the entropy
// guarantee PKCE relies on and rejects degenerate verifiers before they
// are ever hashed or compared.
const PKCE_VERIFIER_PATTERN = /^[A-Za-z0-9\-._~]{43,128}$/;

/**
 * Validates that a code_verifier conforms to RFC 7636 §4.1 (type, length,
 * character set) without performing any hashing or comparison.
 *
 * @param {*} codeVerifier
 * @returns {boolean}
 */
function isValidPkceVerifierFormat(codeVerifier) {
  return typeof codeVerifier === "string" && PKCE_VERIFIER_PATTERN.test(codeVerifier);
}

/**
 * Derives the S256 PKCE code_challenge from a code_verifier.
 *
 * code_challenge = BASE64URL(SHA256(code_verifier))
 *
 * Safe to call with untrusted/absent input: returns null instead of
 * throwing when codeVerifier is not a well-formed RFC 7636 verifier
 * (undefined, null, array, object, wrong length, invalid characters).
 *
 * @param {*} codeVerifier
 * @returns {string|null} base64url-encoded SHA-256 digest, or null if codeVerifier is not RFC 7636-compliant
 */
function deriveCodeChallengeS256(codeVerifier) {
  if (!isValidPkceVerifierFormat(codeVerifier)) {
    return null;
  }

  return crypto.createHash("sha256").update(codeVerifier, "utf8").digest("base64url");
}

/**
 * Validates a PKCE `code_verifier` against the `code_challenge` sent at
 * the start of the authorization request, using the S256 method.
 *
 * Security purpose: PKCE prevents authorization-code interception attacks
 * (e.g. on public/native/SPA clients) by requiring possession of the
 * original `code_verifier` — known only to the party that started the
 * flow — to redeem the authorization code for tokens.
 *
 * @param {string} codeVerifier - PKCE code_verifier presented at token exchange
 * @param {string} expectedCodeChallenge - PKCE code_challenge captured at authorization start
 * @returns {{ valid: boolean, reason?: string }}
 */
function validatePkce(codeVerifier, expectedCodeChallenge) {
  if (!codeVerifier || !expectedCodeChallenge) {
    return { valid: false, reason: "missing_pkce_verifier" };
  }

  // Reject malformed verifiers (wrong type, wrong length, invalid
  // characters) per RFC 7636 §4.1 before ever hashing them — a verifier
  // that doesn't meet the spec's entropy requirements must never be
  // treated as valid, even if it happens to hash-match a challenge.
  if (!isValidPkceVerifierFormat(codeVerifier)) {
    return { valid: false, reason: "invalid_pkce_verifier_format" };
  }

  const derivedChallenge = deriveCodeChallengeS256(codeVerifier);

  if (!timingSafeStringEqual(derivedChallenge, expectedCodeChallenge)) {
    return { valid: false, reason: "pkce_verification_failed" };
  }

  return { valid: true };
}

module.exports = {
  timingSafeStringEqual,
  validateState,
  validateNonce,
  validateRedirectUri,
  isValidPkceVerifierFormat,
  deriveCodeChallengeS256,
  validatePkce,
};
