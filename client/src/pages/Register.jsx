import { useState } from "react";
import { api } from "../api/axios";
import { useNavigate } from "react-router-dom";

export default function Register() {
  const nav = useNavigate();
  const [role, setRole] = useState("patient");
  const [fullName, setFullName] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [msg, setMsg] = useState("");
  const [msgType, setMsgType] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setMsg("");
    setMsgType("");

    const cleanId = identifier.trim();

    if (!fullName.trim()) {
      setMsgType("error");
      setMsg("Full name is required");
      return;
    }
    if (!cleanId) {
      setMsgType("error");
      setMsg("Email or phone is required");
      return;
    }
    if (!password) {
      setMsgType("error");
      setMsg("Password is required");
      return;
    }

    try {
      setLoading(true);

      const res = await api.post("/auth/register", {
        role,
        fullName: fullName.trim(),
        identifier: cleanId,
        password,
      });

      if (role === "doctor") {
        setMsgType("success");
        setMsg(res.data?.message || "Doctor registered. Awaiting approval.");
        setTimeout(() => nav("/login"), 700);
        return;
      }

      localStorage.setItem("verifyIdentifier", cleanId);

      setMsgType("success");
      setMsg(res.data?.message || "OTP sent to your email. Please verify.");

      nav("/verify-email", { state: { identifier: cleanId } });
    } catch (err) {
      setMsgType("error");
      setMsg(
        err.response?.data?.message ||
          err.response?.data?.errors?.[0]?.msg ||
          "Register failed"
      );
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
              Create Account
            </h1>
            <p className="text-sm text-[#6b7280] mt-1">
              Join Care Line 360 and access digital healthcare easily
            </p>
          </div>

          {msg && <div className={msgClass}>{msg}</div>}

          <form onSubmit={submit} className="space-y-4">
            <select
              className="w-full px-4 py-3 rounded-xl border border-[#e5e7eb] bg-white focus:border-[#178d95] focus:ring-2 focus:ring-[#178d95]/20 outline-none transition text-sm"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="patient">Patient</option>
              <option value="doctor">Doctor</option>
            </select>

            <input
              className="w-full px-4 py-3 rounded-xl border border-[#e5e7eb] focus:border-[#178d95] focus:ring-2 focus:ring-[#178d95]/20 outline-none transition text-sm"
              placeholder="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />

            <input
              className="w-full px-4 py-3 rounded-xl border border-[#e5e7eb] focus:border-[#178d95] focus:ring-2 focus:ring-[#178d95]/20 outline-none transition text-sm"
              placeholder="Email or Phone"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
            />

            <div className="relative">
              <input
                className="w-full px-4 py-3 rounded-xl border border-[#e5e7eb] focus:border-[#178d95] focus:ring-2 focus:ring-[#178d95]/20 outline-none transition text-sm pr-16"
                placeholder="Password (e.g., Test@1234)"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-[#6b7280] hover:text-[#178d95] transition"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>

            <button
              disabled={loading}
              className="w-full py-3 rounded-full bg-[#178d95] text-white text-sm font-medium hover:bg-[#126f76] transition disabled:opacity-60 hover:-translate-y-1 transition duration-300"
            >
              {loading ? "Creating..." : "Create Account"}
            </button>

            <div className="text-sm text-[#6b7280] text-center">
              Already have an account?{" "}
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