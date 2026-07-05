import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, Lock, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import AuthCard from "../components/AuthCard.jsx";
import useComingSoonToast from "../hooks/useComingSoonToast.jsx";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast, show } = useComingSoonToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(emailOrUsername, password);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard title="Welcome Back!" subtitle="Login to continue">
      {toast}
      <form onSubmit={handleSubmit}>
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>
        )}

        <div className="mb-3 flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-4 py-3">
          <User size={18} className="text-gray-400" />
          <input
            className="w-full bg-transparent text-sm outline-none"
            placeholder="Username / Email"
            value={emailOrUsername}
            onChange={(e) => setEmailOrUsername(e.target.value)}
            required
          />
        </div>

        <div className="mb-2 flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-4 py-3">
          <Lock size={18} className="text-gray-400" />
          <input
            type={showPassword ? "text" : "password"}
            className="w-full bg-transparent text-sm outline-none"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="button" onClick={() => setShowPassword((s) => !s)} className="text-gray-400">
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        <div className="mb-5 text-right">
          <button
            type="button"
            onClick={() => show("Forgot password isn't set up yet — coming soon!")}
            className="text-xs font-medium text-purple-500 hover:underline"
          >
            Forgot Password?
          </button>
        </div>

        <button
          disabled={loading}
          className="w-full rounded-full py-3 font-medium text-white shadow-md transition hover:opacity-90 disabled:opacity-60"
          style={{ background: "linear-gradient(135deg, #9b7ee8, #7f6ae0)" }}
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-gray-200" />
          <span className="text-xs text-gray-400">or continue with</span>
          <div className="h-px flex-1 bg-gray-200" />
        </div>

        <div className="flex justify-center gap-3">
          {["Google", "Apple", "Facebook"].map((provider) => (
            <button
              key={provider}
              type="button"
              onClick={() => show(`Sign in with ${provider} is coming soon!`)}
              title={provider}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 text-sm font-semibold text-gray-500 shadow-sm transition hover:bg-gray-50"
            >
              {provider[0]}
            </button>
          ))}
        </div>

        <p className="mt-5 text-center text-sm text-gray-500">
          Don't have an account?{" "}
          <Link to="/register" className="font-medium text-purple-600 hover:underline">
            Sign Up
          </Link>
        </p>
      </form>
    </AuthCard>
  );
}
