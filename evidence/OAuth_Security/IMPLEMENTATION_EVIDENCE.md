# OAuth Security Implementation Evidence

## Before Implementation

- No OAuth security validation module existed on my branch.
- No state validation module existed.
- No nonce validation module existed.
- No PKCE S256 validation module existed.
- No redirect URI validation module existed.

## Implementation

File:
`server/middleware/oauthSecurity.js`

Implemented controls:

- **State validation** (`validateState`) — validates the OAuth `state` parameter returned on the callback against the value originally issued at authorization start. Rejects non-string input (`invalid_state_format`), missing/empty values (`missing_state`), and mismatched values (`state_mismatch`). This is the CSRF defense for the authorization-code flow.

- **Nonce validation** (`validateNonce`) — validates the OIDC `nonce` claim from an ID token against the value originally issued at authorization start. Rejects non-string input (`invalid_nonce_format`), missing/empty values (`missing_nonce`), and mismatched values (`nonce_mismatch`). This is the OIDC ID-token replay defense.

- **Exact redirect URI validation** (`validateRedirectUri`) — validates a redirect URI against the single allowed URI configured via `GOOGLE_REDIRECT_URI`. Uses exact string matching only (no prefix/substring/normalization matching). Rejects non-string input (`invalid_redirect_uri_format`), missing values (`missing_redirect_uri`), and any non-exact-match value (`redirect_uri_not_allowed`).

- **PKCE S256 validation** (`validatePkce`, `deriveCodeChallengeS256`) — derives `code_challenge = BASE64URL(SHA256(code_verifier))` and compares it to the expected `code_challenge` using a timing-safe comparison. Rejects missing values (`missing_pkce_verifier`), RFC-noncompliant verifiers (`invalid_pkce_verifier_format`), and non-matching verifiers (`pkce_verification_failed`). `deriveCodeChallengeS256` returns `null` rather than throwing for non-compliant input.

- **RFC 7636 `code_verifier` format validation** (`isValidPkceVerifierFormat`) — enforces that `code_verifier` is a string, 43–128 characters in length, and composed only of the RFC 7636 §4.1 unreserved character set (`A-Z`, `a-z`, `0-9`, `-`, `.`, `_`, `~`). This check runs before any hashing or comparison is performed.

- **Timing-safe comparisons** (`timingSafeStringEqual`) — wraps `crypto.timingSafeEqual`, used internally by `validateState`, `validateNonce`, and `validatePkce` to compare secret-bearing values without leaking timing information. Guards against type mismatches and unequal-length inputs before invoking `crypto.timingSafeEqual`.

- **Sensitive-value logging prevention** — the module contains no `console.log`/`console.error`/logging calls. All validation functions return structured `{ valid, reason }` objects using fixed, non-sensitive reason codes (e.g. `state_mismatch`, `pkce_verification_failed`); the actual `state`, `nonce`, `code_verifier`, `code_challenge`, or redirect URI values are never written to logs by this module.

## Automated Verification

Test file:
`server/tests/unit/oauthSecurity/oauthSecurity.test.js`

Verified result:

```
Test Suites: 1 passed, 1 total
Tests:       45 passed, 45 total
```

Command used: `npx jest tests/unit/oauthSecurity --detectOpenHandles --forceExit` (run from `server/`).

## Manual / HTTP Security Testing

Status: **Not tested yet.**

Live HTTP/OAuth security testing (per `evidence/OAuth_Security/OAUTH_SECURITY_TEST_MATRIX.md`) requires the complete OAuth authorization-code flow — backend authorization-code exchange, Google ID-token verification, CareLine360 JWT/session issuance, local user/account mapping, and the frontend Google Sign-In/PKCE/callback flow — to be integrated by the responsible team members first. This security-control module (`oauthSecurity.js`) is a standalone, reusable validation layer intended to be called from that flow once it exists; it does not itself expose any HTTP endpoint that can currently be exercised with Postman or a browser.

## Evidence Limitations

- No Postman test execution against a live OAuth endpoint has been performed.
- No browser-based OAuth attack simulation has been performed.
- No HTTP request/response evidence, screenshots, or captured network traffic are included in this document.
- No claim is made regarding the security of the end-to-end OAuth flow, since that flow does not yet exist in the application.
- All results stated above are limited to unit-level verification of the validation functions in `server/middleware/oauthSecurity.js`, executed via Jest as shown above.
