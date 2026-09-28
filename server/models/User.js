const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ["patient", "doctor", "responder", "admin"], required: true },
    fullName: { type: String, trim: true },

    email: { type: String, lowercase: true, trim: true, unique: true, sparse: true },
    phone: { type: String, trim: true, unique: true, sparse: true },

    // How the account was originally created. Google-created accounts have no password.
    authProvider: { type: String, enum: ["local", "google"], default: "local" },
    // Google's stable account id ("sub" claim), set when a Google identity is linked
    googleId: { type: String, unique: true, sparse: true },

    passwordHash: {
      type: String,
      required: function () {
        return this.authProvider !== "google";
      },
    },

    isVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },

    refreshTokenHash: { type: String },
    lastLoginAt: { type: Date },

    status: {
      type: String,
      enum: ["ACTIVE", "PENDING", "REJECTED", "SUSPENDED"],
      default: "ACTIVE"
    },

  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
