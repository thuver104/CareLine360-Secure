import { useState } from "react";
import { api } from "../api/axios";
import { useNavigate } from "react-router-dom";

export default function ForgotPassword() {
  const nav = useNavigate();

  const [identifier, setIdentifier] = useState("");
  const [msg, setMsg] = useState("");
  const [msgType, setMsgType] = useState("");
  const [loading, setLoading] = useState(false);

  const sendOtp = async (e) => {
    e.preventDefault();
    setMsg("");
    setMsgType("");

    const cleanIdentifier = identifier.trim();

    if (!cleanIdentifier) {
      setMsg("Email is required");
      setMsgType("error");
      return;
    }

    try {
      setLoading(true);

      const res = await api.post("/auth/password/forgot", {
        identifier: cleanIdentifier,
      });

      localStorage.setItem("resetIdentifier", cleanIdentifier);

      setMsg(res.data?.message || "OTP sent to your email");
      setMsgType("success");

      setTimeout(() => {
        nav("/reset-password", {
          state: { identifier: cleanIdentifier },
        });
      }, 700);
    } catch (err) {
      setMsg(
        err.response?.data?.message ||
          err.response?.data?.errors?.[0]?.msg ||
          "Failed to send OTP"
      );
      setMsgType("error");
    } finally {
      setLoading(false);
    }
  };

  const msgClass =
    msgType === "success"
      ? "mb-4 text-sm text-green-700 text-center"
      : msgType === "error"
      ? "mb-4 text-sm text-red-600 text-center"
      : "mb-4 text-sm text-blue-700 text-center";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-white px-4">
      <div className="absolute top-0 left-0 w-full h-[350px] bg-gradient-to-r from-[#dff6f6] via-[#eff8f8] to-[#d9f1f2] blur-3xl opacity-70 -z-10" />

      <div className="w-full max-w-md">
        <div className="bg-white/90 backdrop-blur-xl border border-white/60 shadow-xl rounded-[28px] p-8">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-semibold text-[#0f172a]">
              Forgot Password
            </h1>
            <p className="text-sm text-[#6b7280] mt-1">
              Enter your email to receive an OTP for password reset
            </p>
          </div>

          {msg && <div className={msgClass}>{msg}</div>}

          <form onSubmit={sendOtp} className="space-y-4">
            <input
              className="w-full px-4 py-3 rounded-xl border border-[#e5e7eb] focus:border-[#178d95] focus:ring-2 focus:ring-[#178d95]/20 outline-none transition text-sm"
              placeholder="Email"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
            />

            <button
              disabled={loading}
              className="w-full py-3 rounded-full bg-[#178d95] text-white text-sm font-medium hover:bg-[#126f76] transition disabled:opacity-60"
            >
              {loading ? "Sending..." : "Send OTP"}
            </button>

            <div className="text-sm text-[#6b7280] text-center">
              Remember your password?{" "}
              <button
                type="button"
                onClick={() => nav("/login")}
                className="text-[#178d95] font-medium hover:underline"
              >
                Login
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}