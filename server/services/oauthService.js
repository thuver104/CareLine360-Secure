const User = require("../models/User");
const Patient = require("../models/Patient");
const { getNextPatientId } = require("./authService");

// Same roles that may self-register (see registerUser). Admin and responder
// accounts are created by an admin and must keep using password login.
const GOOGLE_ALLOWED_ROLES = ["patient", "doctor"];

const fail = (status, code, message) => ({ status, data: { code, message } });

/**
 * Map an already-verified Google identity to a CareLine360 user.
 *
 * The caller (Google ID token verification) must pass the verified token
 * payload only — never fields taken from the request body. Any extra fields
 * such as `role` are ignored: the role is always decided here.
 *
 * @param {object} googleProfile - verified Google ID token payload
 * @param {string} googleProfile.sub - Google's stable account id
 * @param {string} googleProfile.email
 * @param {boolean} googleProfile.email_verified
 * @param {string} [googleProfile.name]
 *
 * @returns On success: { status: 200|201, user, created, linked }
 *          On failure: { status: 4xx, data: { code, message } }
 *          `user` is the Mongoose document; issuing tokens is the caller's job.
 */
const resolveOrCreateOAuthUser = async (googleProfile) => {
  const { sub, email, email_verified: emailVerified, name } = googleProfile || {};

  // 1) Only trust a complete, verified identity
  if (typeof sub !== "string" || !sub || typeof email !== "string" || !email.includes("@")) {
    return fail(400, "OAUTH_INVALID_PROFILE", "Google sign-in failed. Please try again.");
  }
  // Google sends email_verified as a boolean; some libraries give the string "true"
  if (emailVerified !== true && emailVerified !== "true") {
    return fail(403, "OAUTH_EMAIL_NOT_VERIFIED", "Your Google email address is not verified.");
  }

  const normalizedEmail = email.trim().toLowerCase();

  // 2) Look up by Google id and by email, both from the verified token
  const [byGoogleId, byEmail] = await Promise.all([
    User.findOne({ googleId: sub }),
    User.findOne({ email: normalizedEmail }),
  ]);

  // The Google account is already linked to one user, but the email belongs to another
  if (byGoogleId && byEmail && !byGoogleId._id.equals(byEmail._id)) {
    return fail(409, "OAUTH_ACCOUNT_CONFLICT", "This Google account cannot be used to sign in. Please contact support.");
  }

  // `sub` is stable even if the user changes their Google email, so it wins
  const user = byGoogleId || byEmail;

  if (user) return resolveExistingUser(user, sub);
  return createGoogleUser({ sub, email: normalizedEmail, name });
};

const resolveExistingUser = async (user, sub) => {
  // 3) Staff accounts (admin/responder) may not use Google sign-in
  if (!GOOGLE_ALLOWED_ROLES.includes(user.role)) {
    return fail(403, "OAUTH_ROLE_NOT_ALLOWED", "Please sign in with your email and password.");
  }

  // 4) The email already has a different Google account linked to it
  if (user.googleId && user.googleId !== sub) {
    return fail(409, "OAUTH_ACCOUNT_CONFLICT", "This Google account cannot be used to sign in. Please contact support.");
  }

  // 5) Same status rules as loginUser — Google sign-in must not bypass them
  if (!user.isActive) {
    return fail(403, "ACCOUNT_DEACTIVATED", "Account is deactivated");
  }
  if (user.status !== "ACTIVE") {
    const message =
      user.role === "doctor" ? "Doctor account not approved yet" : "Account is not active. Please contact admin.";
    return fail(403, "ACCOUNT_NOT_ACTIVE", message);
  }

  if (user.googleId === sub) {
    return { status: 200, user, created: false, linked: false };
  }

  // 6) Link Google to an existing password account. Only do this when the local
  // email was already verified — otherwise someone could pre-register the
  // victim's email with a password they know and keep access after linking.
  // The owner can prove the email via forgot-password (OTP) and then link.
  if (!user.isVerified) {
    return fail(
      409,
      "OAUTH_LINK_REQUIRES_VERIFICATION",
      "An account with this email already exists. Sign in with your password and verify your email, or reset your password, before using Google sign-in."
    );
  }

  user.googleId = sub;
  await user.save();
  return { status: 200, user, created: false, linked: true };
};

// 7) First Google sign-in: always a patient, mirroring patient self-registration.
// Doctors need admin approval, so they register through the normal doctor signup.
const createGoogleUser = async ({ sub, email, name }) => {
  const fullName = (typeof name === "string" && name.trim()) || email.split("@")[0];

  let user;
  try {
    user = await User.create({
      role: "patient",
      status: "ACTIVE",
      authProvider: "google",
      googleId: sub,
      email,
      fullName,
      isVerified: true, // Google verified the email
    });
  } catch (e) {
    // Duplicate email/googleId: a concurrent sign-in created the user first
    if (e.code === 11000) {
      return fail(409, "OAUTH_ACCOUNT_CONFLICT", "Google sign-in failed. Please try again.");
    }
    throw e;
  }

  try {
    const patientId = await getNextPatientId();
    await Patient.create({ userId: user._id, patientId, fullName });
  } catch (e) {
    // Don't leave a user without a patient profile behind
    await User.deleteOne({ _id: user._id });
    throw e;
  }

  return { status: 201, user, created: true, linked: false };
};

module.exports = { resolveOrCreateOAuthUser };
