import { useState, useEffect } from "react";
import { api } from "../api/axios";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { motion } from "motion/react";
import {
  ArrowLeft,
  Mail,
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
} from "lucide-react";

import logo from "../assets/logo.png";
import forgotImg from "../assets/images/forgotten_password_image.png";

import "./Auth.css";

export default function ResetPassword() {
  const nav = useNavigate();
  const location = useLocation();

  const [identifier, setIdentifier] = useState(
    location.state?.identifier || localStorage.getItem("resetIdentifier") || ""
  );

  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (identifier) {
      localStorage.setItem("resetIdentifier", identifier);
    }
  }, [identifier]);

  const reset = async () => {
    setMsg("");

    if (!otp || otp.length !== 6) {
      setMsg("OTP must be 6 digits");
      return;
    }

    if (!newPassword) {
      setMsg("New password is required");
      return;
    }

    if (newPassword !== confirmPassword) {
      setMsg("Passwords do not match");
      return;
    }

    try {
      setLoading(true);

      const res = await api.post("/auth/password/reset", {
        identifier,
        otp,
        newPassword,
      });

      setMsg(res.data?.message || "Password reset successful");

      localStorage.removeItem("resetIdentifier");

      setTimeout(() => nav("/login"), 800);
    } catch (e) {
      setMsg(e.response?.data?.message || "Reset failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page auth-page--reversed">
      <div className="auth-noise" />

      {/* ═══════ FORM PANEL (Right side due to reversed) ═══════ */}
      <div className="auth-form-panel">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <Link to="/" className="auth-home-btn">
            <ArrowLeft size={14} strokeWidth={1.5} />
            Home
          </Link>
        </motion.div>

        <motion.div
          className="auth-form-container"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          {/* Logo */}
          <div className="auth-logo-wrapper">
            <div className="auth-logo-ring">
              <img src={logo} alt="CareLine 360" className="auth-logo" />
            </div>
          </div>

          {/* Brand */}
          <div className="auth-brand">
            <span className="auth-brand-name">
              CareLine <span className="auth-brand-accent">360</span>
            </span>
          </div>

          {/* Header */}
          <span className="auth-overline">Secure Reset</span>
          <h1 className="auth-title">
            Reset <span className="auth-title-accent">Password</span>
          </h1>
          <p className="auth-subtitle">
            Enter the OTP sent to your email and set a new password
          </p>

          {/* Error */}
          {msg && (
            <motion.div
              className="auth-msg auth-msg--error"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {msg}
            </motion.div>
          )}

          {/* Form */}
          <div>
            {/* Identifier */}
            <div className="auth-form-group">
              <label className="auth-label" htmlFor="fp-identifier">
                Email or Phone
              </label>
              <div className="auth-input-wrapper">
                <input
                  id="fp-identifier"
                  className="auth-input"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                />
                <Mail size={15} strokeWidth={1.5} className="auth-input-icon" />
              </div>
            </div>

            {/* OTP */}
            <div className="auth-form-group">
              <label className="auth-label" htmlFor="fp-otp">
                OTP Code
              </label>
              <div className="auth-input-wrapper">
                <input
                  id="fp-otp"
                  className="auth-input"
                  placeholder="6-digit code"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  maxLength={6}
                />
                <KeyRound size={15} strokeWidth={1.5} className="auth-input-icon" />
              </div>
            </div>

            {/* New Password */}
            <div className="auth-form-group">
              <label className="auth-label" htmlFor="fp-newpw">
                New Password
              </label>
              <div className="auth-input-wrapper">
                <input
                  id="fp-newpw"
                  className="auth-input"
                  placeholder="e.g., NewPass@1234"
                  type={showNew ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  style={{ paddingRight: "3rem" }}
                />
                <Lock size={15} strokeWidth={1.5} className="auth-input-icon" />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="auth-pw-toggle"
                  aria-label={showNew ? "Hide password" : "Show password"}
                >
                  {showNew ? (
                    <EyeOff size={15} strokeWidth={1.5} />
                  ) : (
                    <Eye size={15} strokeWidth={1.5} />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="auth-form-group">
              <label className="auth-label" htmlFor="fp-confirm">
                Confirm Password
              </label>
              <div className="auth-input-wrapper">
                <input
                  id="fp-confirm"
                  className="auth-input"
                  placeholder="Re-enter new password"
                  type={showConfirm ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={{ paddingRight: "3rem" }}
                />
                <Lock size={15} strokeWidth={1.5} className="auth-input-icon" />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="auth-pw-toggle"
                  aria-label={showConfirm ? "Hide password" : "Show password"}
                >
                  {showConfirm ? (
                    <EyeOff size={15} strokeWidth={1.5} />
                  ) : (
                    <Eye size={15} strokeWidth={1.5} />
                  )}
                </button>
              </div>
            </div>

            <button
              type="button"
              disabled={loading}
              onClick={reset}
              className="auth-submit-btn"
            >
              <span className="btn-slide-bg" />
              <span className="btn-text">
                {loading ? (
                  <>
                    <span className="auth-spinner" /> Resetting…
                  </>
                ) : (
                  <>
                    Reset Password <ArrowRight size={14} />
                  </>
                )}
              </span>
            </button>
          </div>

          {/* Divider */}
          <div className="auth-divider">
            <span className="auth-divider-line" />
            <span className="auth-divider-text">or</span>
            <span className="auth-divider-line" />
          </div>

          {/* Footer */}
          <div className="auth-footer-links auth-footer-links--center">
            <span className="auth-footer-text">Remember your password?</span>
            <Link to="/login" className="auth-link auth-link--accent">
              Sign In
            </Link>
          </div>
        </motion.div>
      </div>

      {/* ═══════ IMAGE PANEL (Left side due to reversed) ═══════ */}
      <div className="auth-image-panel auth-image-panel--centered">
        <div className="auth-float-circle auth-float-circle--1" />
        <div className="auth-float-circle auth-float-circle--2" />
        <div className="auth-float-circle auth-float-circle--3" />
        <div className="auth-img-glow auth-img-glow--center" />

        <motion.div
          className="auth-panel-overlay auth-panel-overlay--left"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          <p className="auth-panel-overline">Account Recovery</p>
          <h2 className="auth-panel-title">
            Secure Your
            <br />
            <em>Account</em>
          </h2>
        </motion.div>

        <motion.img
          src={forgotImg}
          alt="Secure lock"
          className="auth-hero-img auth-hero-img--centered"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            duration: 1.2,
            delay: 0.4,
            ease: [0.25, 0.46, 0.45, 0.94],
          }}
        />
      </div>
    </div>
  );
}