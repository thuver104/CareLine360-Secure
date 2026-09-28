import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";

export default function OAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();

  const [error, setError] = useState("");

  useEffect(() => {
    const handleGoogleCallback = async () => {
      try {
        const code = searchParams.get("code");
        const googleError = searchParams.get("error");

        // Google returned an error
        if (googleError) {
          throw new Error("Google sign-in was cancelled or failed.");
        }

        // Authorization code missing
        if (!code) {
          throw new Error("Google authorization code is missing.");
        }

        // Get PKCE verifier created before redirecting to Google
        const codeVerifier = sessionStorage.getItem(
          "google_code_verifier"
        );

        if (!codeVerifier) {
          throw new Error(
            "Google sign-in session expired. Please try again."
          );
        }

        // Exchange Google authorization code for application tokens
        const res = await api.post("/auth/google", {
          code,
          code_verifier: codeVerifier,
        });

        // Remove verifier after successful exchange
        sessionStorage.removeItem("google_code_verifier");

        // Store authentication information
        login(res.data);

        // Redirect based on user role
        const role = res.data?.user?.role;

        if (role === "patient") {
          navigate("/patient/dashboard", { replace: true });
        } else if (role === "doctor") {
          navigate("/doctor/dashboard", { replace: true });
        } else if (role === "admin") {
          navigate("/admin/dashboard", { replace: true });
        } else if (role === "responder") {
          navigate("/admin/dashboard/emergencies", { replace: true });
        } else {
          navigate("/", { replace: true });
        }
      } catch (err) {
        console.error("Google OAuth callback error:", err);

        sessionStorage.removeItem("google_code_verifier");

        setError(
          err.response?.data?.message ||
            err.message ||
            "Google sign-in failed."
        );
      }
    };

    handleGoogleCallback();
  }, [searchParams, navigate, login]);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        padding: "2rem",
        textAlign: "center",
      }}
    >
      {error ? (
        <>
          <h2>Google Sign-In Failed</h2>

          <p>{error}</p>

          <button
            type="button"
            onClick={() => navigate("/login", { replace: true })}
            style={{
              marginTop: "1rem",
              padding: "0.75rem 1.5rem",
              cursor: "pointer",
            }}
          >
            Back to Login
          </button>
        </>
      ) : (
        <>
          <div className="auth-spinner" />

          <h2 style={{ marginTop: "1rem" }}>
            Completing Google Sign-In...
          </h2>

          <p>Please wait.</p>
        </>
      )}
    </div>
  );
}