const { OAuth2Client } = require("google-auth-library");
const { resolveOrCreateOAuthUser } = require("../services/oauthService");
const { signAccessToken, signRefreshToken } = require("../utils/tokens");
const User = require("../models/User");
const bcrypt = require("bcryptjs");

/*
 * OAuth backend: authorization-code exchange + Google ID-token
 * verification + CareLine360 session issuance.
 *
 * Flow:
 *   1. Receive { code, code_verifier } from the frontend (Member 4, PKCE S256).
 *   2. Exchange the code with Google using the configured OAuth client.
 *   3. Verify the returned Google ID token (iss, aud, exp) and read claims.
 *   4. Hand the VERIFIED payload to Member 3's mapping (never body fields).
 *   5. Issue CareLine360 access/refresh JWTs exactly like password login.
 *   6. Return only safe user/session data; leak nothing on error.
 */

const client = new OAuth2Client({
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  redirectUri: process.env.GOOGLE_REDIRECT_URI,
});

const googleLogin = async (req, res) => {
  try {
    const { code, code_verifier: codeVerifier } = req.body || {};

    // Basic input validation before any network call
    if (typeof code !== "string" || !code.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Missing authorization code" });
    }
    if (typeof codeVerifier !== "string" || !codeVerifier.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Missing PKCE code verifier" });
    }

    // 1) + 2) Exchange the authorization code with Google (PKCE verifier included).
    let tokens;
    try {
      const response = await client.getToken({
        code,
        codeVerifier,
        redirect_uri: process.env.GOOGLE_REDIRECT_URI,
      });
      tokens = response.tokens;
    } catch (exchangeErr) {
      console.error("Google OAuth token exchange failed:", exchangeErr.message);
      return res
        .status(401)
        .json({ success: false, message: "Google sign-in failed" });
    }

    if (!tokens?.id_token) {
      console.error("Google OAuth: no id_token returned");
      return res
        .status(401)
        .json({ success: false, message: "Google sign-in failed" });
    }

    // 3) Verify the ID token: signature, issuer, audience and expiry.
    let payload;
    try {
      const ticket = await client.verifyIdToken({
        idToken: tokens.id_token,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
    } catch (verifyErr) {
      console.error("Google ID token verification failed:", verifyErr.message);
      return res
        .status(401)
        .json({ success: false, message: "Google sign-in failed" });
    }

    // 4) Map the VERIFIED identity to a CareLine360 user (Member 3).
    //    Only verified token claims are passed - never request-body fields.
    const result = await resolveOrCreateOAuthUser({
      sub: payload.sub,
      email: payload.email,
      email_verified: payload.email_verified,
      name: payload.name,
    });

    if (result.status >= 400) {
      // Member 3's messages are already safe and generic.
      return res.status(result.status).json({ success: false, ...result.data });
    }

    // 5) Issue CareLine360 JWTs exactly like loginUser does.
    const { user } = result;
    user.lastLoginAt = new Date();

    const accessToken = signAccessToken({
      userId: user._id.toString(),
      role: user.role,
    });
    const refreshToken = signRefreshToken({
      userId: user._id.toString(),
      role: user.role,
    });
    user.refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    await user.save();

    // 6) Return the same shape as password login, plus created/linked flags.
    return res.status(result.status).json({
      message: "Login success",
      user: {
        id: user._id,
        role: user.role,
        email: user.email,
        phone: user.phone,
        fullName: user.fullName,
        isVerified: user.isVerified,
      },
      accessToken,
      refreshToken,
      created: result.created,
      linked: result.linked,
    });
  } catch (err) {
    console.error("Google OAuth error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Google sign-in failed" });
  }
};

module.exports = { googleLogin };
