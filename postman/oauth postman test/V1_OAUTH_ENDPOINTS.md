# OAuth Security Control Test Endpoints

Postman collection: `OAuth-Security-Tests.postman_collection.json`
Environment: `OAuth-Security-Tests.postman_environment.json`

Import both into Postman and select the environment. All requests hit a single **TEMPORARY** testing endpoint (`server/controllers/oauthSecurityTestController.js`, `server/routes/oauthSecurityTestRoutes.js`) that exercises the standalone validators in `server/middleware/oauthSecurity.js`. This does **not** implement or test the real Google OAuth authorization-code flow, ID-token verification, or session/JWT issuance — those are out of scope here and owned by other team members. This route must be removed before production deployment.

## 1. State (CSRF) Validation

| # | Method | Endpoint | Scenario | Expected |
|---|--------|----------|----------|----------|
| 1 | POST | `http://localhost:1111/api/auth/oauth/security-test` | Matching state | `valid: true` |
| 2 | POST | `http://localhost:1111/api/auth/oauth/security-test` | Mismatched state (CSRF attack) | `valid: false` |
| 3 | POST | `http://localhost:1111/api/auth/oauth/security-test` | Missing `receivedState` | `valid: false` |

## 2. Nonce (OIDC Replay) Validation

| # | Method | Endpoint | Scenario | Expected |
|---|--------|----------|----------|----------|
| 1 | POST | `http://localhost:1111/api/auth/oauth/security-test` | Matching nonce | `valid: true` |
| 2 | POST | `http://localhost:1111/api/auth/oauth/security-test` | Mismatched nonce (replay attack) | `valid: false` |
| 3 | POST | `http://localhost:1111/api/auth/oauth/security-test` | Missing `receivedNonce` | `valid: false` |

## 3. Redirect URI Allowlist Validation

| # | Method | Endpoint | Scenario | Expected |
|---|--------|----------|----------|----------|
| 1 | POST | `http://localhost:1111/api/auth/oauth/security-test` | Exact match | `valid: true` |
| 2 | POST | `http://localhost:1111/api/auth/oauth/security-test` | Unauthorized host (open-redirect attack) | `valid: false` |
| 3 | POST | `http://localhost:1111/api/auth/oauth/security-test` | Subpath variant (not exact match) | `valid: false` |
| 4 | POST | `http://localhost:1111/api/auth/oauth/security-test` | Missing `redirectUri` | `valid: false` |

## 4. PKCE (S256) Validation

| # | Method | Endpoint | Scenario | Expected |
|---|--------|----------|----------|----------|
| 1 | POST | `http://localhost:1111/api/auth/oauth/security-test` | Valid verifier/challenge pair | `valid: true` |
| 2 | POST | `http://localhost:1111/api/auth/oauth/security-test` | Wrong verifier (well-formed but doesn't match) | `valid: false` |
| 3 | POST | `http://localhost:1111/api/auth/oauth/security-test` | Invalid format — too short (<43 chars) | `valid: false` |
| 4 | POST | `http://localhost:1111/api/auth/oauth/security-test` | Invalid format — disallowed characters (`+`, `/`) | `valid: false` |
| 5 | POST | `http://localhost:1111/api/auth/oauth/security-test` | Missing `codeVerifier` | `valid: false` |

The environment ships a ready-made valid pair:
- `validCodeVerifier` = `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa` (43 chars, RFC 7636 charset)
- `validCodeChallenge` = `ZtNPunH49FD35FWYhT5Tv8I7vRKQJ8uxMaL0_9eHjNA` (base64url SHA-256 of the verifier above)
- `wrongCodeVerifier` = `bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb` (well-formed, does not hash to `validCodeChallenge`)

## 5. Malformed Request Handling

| # | Method | Endpoint | Scenario | Expected |
|---|--------|----------|----------|----------|
| 1 | POST | `http://localhost:1111/api/auth/oauth/security-test` | Missing `test` field | **400** |
| 2 | POST | `http://localhost:1111/api/auth/oauth/security-test` | Unsupported `test` value | **400** |

## Notes

- HTTP **200** is returned for every request above except the two malformed-request cases, which return **400**. `valid: true`/`valid: false` in the JSON body is what represents the actual security outcome — this is a testing endpoint, not the real OAuth flow, so a rejected attack still comes back as HTTP 200 with `valid: false`.
- The response never echoes back `receivedState`, `expectedState`, `receivedNonce`, `expectedNonce`, `redirectUri`, `codeVerifier`, `expectedCodeChallenge`, or the internal `reason` code — only `{ success, test, valid, message }`.
- Nothing here logs or exposes sensitive values, matching the same non-exposure rule used throughout `oauthSecurity.js`.
