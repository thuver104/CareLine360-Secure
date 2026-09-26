# OAuth Security Controls

## 1. OAuth Provider Configuration

- Google OAuth 2.0 / OpenID Connect is configured as the external identity provider.
- Application type: Web application.
- OAuth audience: External.
- Google OAuth client credentials are stored in server-side environment variables.
- Client secrets are not stored in source code or committed to Git.

## 2. Redirect URI Protection

The application uses an explicitly registered redirect URI:

`http://localhost:5173/auth/google/callback`

Only the registered redirect URI should be used during the OAuth authorization flow.

Unregistered or modified redirect URIs must not be accepted.

## 3. OAuth Secret Management

The following values are maintained through environment variables:

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URI`

The `.env` file is excluded from Git using `.gitignore`.

## 4. OAuth Request Security

The OAuth implementation must use:

- `state` validation to protect against CSRF attacks.
- PKCE for authorization-code flow.
- `nonce` validation when processing OpenID Connect ID tokens.
- Strict redirect URI validation.
- Secure handling of authorization codes.
- No exposure of client secrets to the frontend.

## 5. Security Testing Requirements

The OAuth implementation should be tested against:

- Invalid authorization code.
- Reused authorization code.
- Invalid or missing `state`.
- Invalid or missing `nonce` where applicable.
- Unauthorized redirect URI.
- Missing or invalid PKCE verification.
- Invalid Google ID token.
- Expired or invalid authentication data.

## 6. Evidence Status

Provider configuration and environment-based secret management have been completed.

End-to-end OAuth security testing will be performed after the complete OAuth authorization-code flow is integrated into the application.