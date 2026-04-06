import { useState } from "react";
import { api } from "../api/axios";
import { useNavigate, Link } from "react-router-dom";
import { setAuth } from "../auth/authStorage";

export default function Login() {
  const nav = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const [canReactivate, setCanReactivate] = useState(false);
  const [reactivating, setReactivating] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setMsg("");
    setCanReactivate(false);

    try {
      setLoading(true);

      const res = await api.post("/auth/login", {
        identifier: identifier.trim(),
        password,
      });

      setAuth(res.data);

      const role = res.data.user.role;
      if (role === "patient") nav("/patient/dashboard");
      else if (role === "doctor") nav("/doctor/dashboard");
      else if (role === "admin") nav("/admin/dashboard");
      else if (role === "responder") nav("/admin/dashboard/emergencies");
      else nav("/");
    } catch (err) {
      const apiMsg = err.response?.data?.message || "Login failed";
      setMsg(apiMsg);

      // show reactivate button when backend says account inactive
      const m = apiMsg.toLowerCase();
      if (
        m.includes("deactiv") ||
        m.includes("inactive") ||
        m.includes("suspend") ||
        m.includes("disabled")
      ) {
        setCanReactivate(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReactivate = async () => {
    setMsg("");

    if (!identifier.trim() || !password) {
      setMsg("Enter email/phone and password to reactivate.");
      return;
    }

    try {
      setReactivating(true);

      const res = await api.post("/auth/reactivate", {
        identifier: identifier.trim(),
        password,
      });

      setMsg(res.data?.message || "Account reactivated. Now login again.");
      setCanReactivate(false);
    } catch (err) {
      setMsg(err.response?.data?.message || "Reactivate failed");
    } finally {
      setReactivating(false);
    }
  };

  return (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-white px-4">

    {/* Background glow */}
    <div className="absolute top-0 left-0 w-full h-[350px] bg-gradient-to-r from-[#dff6f6] via-[#eff8f8] to-[#d9f1f2] blur-3xl opacity-70 -z-10" />

    <div className="w-full max-w-md">

      {/* Card */}
      <div className="bg-white/90 backdrop-blur-xl border border-white/60 shadow-xl rounded-[28px] p-8">

        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-semibold text-[#0f172a]">
            Welcome Back
          </h1>
          <p className="text-sm text-[#6b7280] mt-1">
            Login to continue your healthcare journey
          </p>
        </div>

        {/* Error */}
        {msg && (
          <div className="mb-4 text-sm text-red-500 text-center">
            {msg}
          </div>
        )}

        {/* Form */}
        <form onSubmit={submit} className="space-y-4">

          {/* Identifier */}
          <input
            className="w-full px-4 py-3 rounded-xl border border-[#e5e7eb] focus:border-[#178d95] focus:ring-2 focus:ring-[#178d95]/20 outline-none transition text-sm"
            placeholder="Email or Phone"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
          />

          {/* Password */}
          <div className="relative">
            <input
              className="w-full px-4 py-3 rounded-xl border border-[#e5e7eb] focus:border-[#178d95] focus:ring-2 focus:ring-[#178d95]/20 outline-none transition text-sm pr-16"
              placeholder="Password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-[#6b7280] hover:text-[#178d95] transition"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>

          {/* Login Button */}
          <button
            disabled={loading}
            className="w-full py-3 rounded-full bg-[#178d95] text-white text-sm font-medium hover:bg-[#126f76] transition disabled:opacity-60 hover:-translate-y-1 transition duration-300"
          >
            {loading ? "Logging in..." : "Login"}
          </button>

          {/* Reactivate */}
          {canReactivate && (
            <button
              type="button"
              onClick={handleReactivate}
              disabled={reactivating}
              className="w-full py-3 rounded-full border border-[#178d95] text-[#178d95] text-sm font-medium hover:bg-[#178d95]/5 transition disabled:opacity-60"
            >
              {reactivating ? "Reactivating..." : "Reactivate Account"}
            </button>
          )}
        </form>

        {/* Links */}
        <div className="mt-6 flex justify-between text-sm text-[#6b7280]">
          <Link to="/register" className="hover:text-[#178d95] hover:underline transition">
            Create account
          </Link>

          <Link to="/forgot-password" className="hover:text-[#178d95] hover:underline transition">
            Forgot password?
          </Link>
        </div>
      </div>
    </div>
  </div>
);
}