import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { api } from "../api/axios";

export default function ResetPassword() {
  const nav = useNavigate();
  const loc = useLocation();
  const [identifier, setIdentifier] = useState(loc.state?.identifier || "");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [msg, setMsg] = useState("");

  const reset = async () => {
    setMsg("");
    try {
      const res = await api.post("/auth/password/reset", {
        identifier,
        otp,
        newPassword,
      });
      setMsg(res.data.message);
      nav("/login");
    } catch (e) {
      setMsg(e.response?.data?.message || "Reset failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-white px-4">
      <div className="absolute top-0 left-0 w-full h-[350px] bg-gradient-to-r from-[#dff6f6] via-[#eff8f8] to-[#d9f1f2] blur-3xl opacity-70 -z-10" />

      <div className="w-full max-w-md">
        <div className="bg-white/90 backdrop-blur-xl border border-white/60 shadow-xl rounded-[28px] p-8">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-semibold text-[#0f172a]">
              Reset Password
            </h1>
            <p className="text-sm text-[#6b7280] mt-1">
              Enter your email, OTP, and new password
            </p>
          </div>

          {msg && (
            <div className="mb-4 text-sm text-[#178d95] text-center">{msg}</div>
          )}

          <div className="space-y-4">
            <input
              className="w-full px-4 py-3 rounded-xl border border-[#e5e7eb] focus:border-[#178d95] focus:ring-2 focus:ring-[#178d95]/20 outline-none transition text-sm"
              placeholder="Email"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
            />

            <input
              className="w-full px-4 py-3 rounded-xl border border-[#e5e7eb] focus:border-[#178d95] focus:ring-2 focus:ring-[#178d95]/20 outline-none transition text-sm"
              placeholder="OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
            />

            <div className="relative">
              <input
                className="w-full px-4 py-3 rounded-xl border border-[#e5e7eb] focus:border-[#178d95] focus:ring-2 focus:ring-[#178d95]/20 outline-none transition text-sm pr-16"
                placeholder="New Password (e.g., NewPass@1234)"
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-[#6b7280] hover:text-[#178d95] transition"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>

            <button
              className="w-full py-3 rounded-full bg-[#178d95] text-white text-sm font-medium hover:bg-[#126f76] transition"
              onClick={reset}
            >
              Reset Password
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}