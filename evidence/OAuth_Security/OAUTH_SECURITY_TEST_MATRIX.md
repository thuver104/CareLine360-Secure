# OAuth Security Test Matrix

Scope: Google OAuth 2.0 / OpenID Connect security controls for CareLine360.
Owner: OAuth Security (provider configuration, security controls, security testing).

This matrix defines the security tests to be executed against the OAuth authorization-code flow once it is implemented by the responsible team members (backend token exchange/ID-token verification/session issuance, account mapping, and frontend Google Sign-In/PKCE/callback). No test in this document has been executed yet.

---

## TEST-01: Missing `state`

- **Security control**: CSRF protection via `state` parameter
- **Test objective**: Verify the callback endpoint rejects a request that omits the `state` parameter
- **Input/manipulation**: Send the OAuth callback request with the `state` parameter removed entirely
- **Expected secure behavior**: Request is rejected; authorization code is not exchanged; no session/JWT is issued
- **Expected HTTP status/error**: 400 Bad Request (invalid_request / missing state)
- **Testing tool**: Postman
- **Evidence to capture**: Request (with `state` omitted), response status + body, screenshot
- **Actual result**: Not Tested Yet

## TEST-02: Invalid `state`

- **Security control**: CSRF protection via `state` parameter
- **Test objective**: Verify the callback endpoint rejects a `state` value that does not match the one issued at authorization start
- **Input/manipulation**: Send the OAuth callback request with a `state` value that differs from the originally issued value (e.g. tampered or random string)
- **Expected secure behavior**: Request is rejected; authorization code is not exchanged; no session/JWT is issued
- **Expected HTTP status/error**: 400 Bad Request (invalid_state) or 401 Unauthorized
- **Testing tool**: Postman
- **Evidence to capture**: Original issued `state` vs. submitted `state`, response status + body, screenshot
- **Actual result**: Not Tested Yet

## TEST-03: Reused `state`

- **Security control**: CSRF/replay protection via one-time `state` parameter
- **Test objective**: Verify a previously consumed `state` value cannot be replayed for a second callback request
- **Input/manipulation**: Complete one valid OAuth flow, then resend the callback request reusing the same (already-consumed) `state` value
- **Expected secure behavior**: Second request is rejected; `state` is single-use; no duplicate session/JWT is issued
- **Expected HTTP status/error**: 400 Bad Request or 401 Unauthorized (invalid_state / state already used)
- **Testing tool**: Postman
- **Evidence to capture**: First (successful) request/response, replayed request/response, screenshot
- **Actual result**: Not Tested Yet

## TEST-04: Missing `nonce`

- **Security control**: OIDC replay protection via `nonce` claim binding
- **Test objective**: Verify the flow rejects processing when the `nonce` parameter is absent from the authorization request or ID token
- **Input/manipulation**: Initiate/complete the flow with the `nonce` parameter omitted from the authorization request
- **Expected secure behavior**: Request is rejected, or ID token is treated as invalid due to missing `nonce` claim; no session/JWT is issued
- **Expected HTTP status/error**: 400 Bad Request (invalid_request / missing nonce)
- **Testing tool**: Postman
- **Evidence to capture**: Authorization request without `nonce`, resulting response status + body, screenshot
- **Actual result**: Not Tested Yet

## TEST-05: Invalid `nonce`

- **Security control**: OIDC replay protection via `nonce` claim binding
- **Test objective**: Verify the ID token's `nonce` claim is validated against the value issued at authorization start
- **Input/manipulation**: Present an ID token whose embedded `nonce` claim does not match the `nonce` originally generated for the session
- **Expected secure behavior**: ID token is rejected as invalid; no session/JWT is issued
- **Expected HTTP status/error**: 401 Unauthorized (invalid_token / nonce mismatch)
- **Testing tool**: Postman (with a crafted/mismatched token, if feasible) or manual token inspection
- **Evidence to capture**: Issued `nonce` vs. token `nonce` claim, response status + body, screenshot
- **Actual result**: Not Tested Yet

## TEST-06: Missing PKCE `code_verifier`

- **Security control**: PKCE (Proof Key for Code Exchange) for authorization-code flow
- **Test objective**: Verify the token exchange step rejects a request that omits `code_verifier`
- **Input/manipulation**: Submit the authorization code for exchange without including `code_verifier`
- **Expected secure behavior**: Token exchange fails; no tokens are issued; no session/JWT is issued
- **Expected HTTP status/error**: 400 Bad Request (invalid_request / missing code_verifier)
- **Testing tool**: Postman
- **Evidence to capture**: Exchange request without `code_verifier`, response status + body, screenshot
- **Actual result**: Not Tested Yet

## TEST-07: Invalid PKCE `code_verifier`

- **Security control**: PKCE (Proof Key for Code Exchange) for authorization-code flow
- **Test objective**: Verify the token exchange step rejects a `code_verifier` that does not match the `code_challenge` sent at authorization start
- **Input/manipulation**: Submit the authorization code for exchange with a `code_verifier` that does not correspond to the original `code_challenge`
- **Expected secure behavior**: Token exchange fails (PKCE verification failure); no tokens are issued; no session/JWT is issued
- **Expected HTTP status/error**: 400 Bad Request (invalid_grant / PKCE verification failed)
- **Testing tool**: Postman
- **Evidence to capture**: `code_challenge` used at authorization vs. mismatched `code_verifier` submitted, response status + body, screenshot
- **Actual result**: Not Tested Yet

## TEST-08: Invalid authorization code

- **Security control**: Authorization-code validation at token exchange
- **Test objective**: Verify the token exchange step rejects an authorization code that was never issued by Google (malformed/fabricated)
- **Input/manipulation**: Submit a fabricated or malformed value in place of a valid authorization code
- **Expected secure behavior**: Token exchange fails at Google/backend; no tokens are issued; no session/JWT is issued
- **Expected HTTP status/error**: 400 Bad Request (invalid_grant)
- **Testing tool**: Postman
- **Evidence to capture**: Exchange request with fabricated code, response status + body, screenshot
- **Actual result**: Not Tested Yet

## TEST-09: Reused authorization code

- **Security control**: Single-use enforcement of authorization code
- **Test objective**: Verify an authorization code cannot be exchanged for tokens more than once
- **Input/manipulation**: Complete one valid token exchange using a given authorization code, then resend the same code in a second exchange request
- **Expected secure behavior**: Second exchange attempt fails; no additional tokens/session are issued; ideally the associated session/tokens from the first exchange are treated as compromised per Google's replay handling
- **Expected HTTP status/error**: 400 Bad Request (invalid_grant / code already used)
- **Testing tool**: Postman
- **Evidence to capture**: First (successful) exchange request/response, replayed exchange request/response, screenshot
- **Actual result**: Not Tested Yet

## TEST-10: Unauthorized redirect URI

- **Security control**: Redirect URI allowlist validation
- **Test objective**: Verify the flow rejects or is not exploitable via a redirect URI that does not match the registered `GOOGLE_REDIRECT_URI`
- **Input/manipulation**: Attempt the authorization/callback flow with a `redirect_uri` value different from the registered one (e.g. an attacker-controlled domain)
- **Expected secure behavior**: Google rejects the authorization request, and/or the backend independently validates and rejects any callback/exchange not matching the registered redirect URI
- **Expected HTTP status/error**: 400 Bad Request (redirect_uri_mismatch) at Google, and/or 400/403 at backend if independently validated
- **Testing tool**: Browser (manual URL manipulation) + Postman
- **Evidence to capture**: Manipulated authorization URL, resulting error page/response, screenshot
- **Actual result**: Not Tested Yet

## TEST-11: Invalid/expired Google ID token

- **Security control**: Server-side ID token verification (signature, issuer, audience, expiry)
- **Test objective**: Verify the backend rejects an ID token that is expired, has an invalid signature, or has an incorrect issuer/audience
- **Input/manipulation**: Present an expired ID token, and separately a token with a tampered signature or incorrect `aud`/`iss` claim
- **Expected secure behavior**: Token is rejected in all cases; no session/JWT is issued
- **Expected HTTP status/error**: 401 Unauthorized (invalid_token / token expired / signature invalid)
- **Testing tool**: Postman (with a crafted/expired token) or manual token inspection via jwt.io (decoding only, not submitted to production Google services)
- **Evidence to capture**: Token claims used (expiry/issuer/audience), response status + body, screenshot
- **Actual result**: Not Tested Yet

## TEST-12: Client secret exposure check

- **Security control**: Confidentiality of `GOOGLE_CLIENT_SECRET`
- **Test objective**: Verify the Google OAuth client secret is never present in any frontend-delivered artifact
- **Input/manipulation**: Inspect built/served frontend JavaScript bundles, network requests/responses visible to the browser, and frontend source/config files for any occurrence of the client secret value or variable
- **Expected secure behavior**: Client secret does not appear anywhere in frontend bundles, browser network traffic, or client-side environment variables; it exists only in backend environment configuration
- **Expected HTTP status/error**: N/A (static/traffic inspection, not an endpoint test)
- **Testing tool**: Browser DevTools (Network + Sources tabs), manual grep of built frontend assets
- **Evidence to capture**: Search results across frontend bundle/source and captured network traffic showing absence of the secret, screenshot
- **Actual result**: Not Tested Yet

---

## Execution Status

All tests listed in this matrix are currently **Not Tested Yet**.

These tests will be executed once the complete OAuth authorization-code flow has been integrated into the application, specifically after:

- Backend authorization-code exchange, Google ID-token verification, and CareLine360 JWT/session issuance are implemented.
- Local user/account mapping and account creation/linking logic are implemented.
- Frontend Google Sign-In, PKCE generation, callback handling, and success/error flow are implemented.

No test results, pass/fail outcomes, or evidence have been recorded at this stage. This document defines the test plan only. Results will be filled in and evidence attached under `evidence/OAuth_Security/` as each test is executed against the integrated flow.
