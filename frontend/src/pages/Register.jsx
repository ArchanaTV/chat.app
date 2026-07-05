import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import AuthCard from "../components/AuthCard.jsx";
import useComingSoonToast from "../hooks/useComingSoonToast.jsx";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast, show } = useComingSoonToast();

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(form.username, form.email, form.password);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard title="Join ChatWave!" subtitle="Create an account to start chatting">
      {toast}
      <form onSubmit={handleSubmit}>
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>
        )}

        <div className="mb-3 flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-4 py-3">
          <User size={18} className="text-gray-400" />
          <input
            className="w-full bg-transparent text-sm outline-none"
            placeholder="Username"
            value={form.username}
            onChange={update("username")}
            minLength={3}
            required
          />
        </div>

        <div className="mb-3 flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-4 py-3">
          <Mail size={18} className="text-gray-400" />
          <input
            type="email"
            className="w-full bg-transparent text-sm outline-none"
            placeholder="Email"
            value={form.email}
            onChange={update("email")}
            required
          />
        </div>

        <div className="mb-5 flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-4 py-3">
          <Lock size={18} className="text-gray-400" />
          <input
            type={showPassword ? "text" : "password"}
            className="w-full bg-transparent text-sm outline-none"
            placeholder="Password"
            value={form.password}
            onChange={update("password")}
            minLength={6}
            required
          />
          <button type="button" onClick={() => setShowPassword((s) => !s)} className="text-gray-400">
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        <button
          disabled={loading}
          className="w-full rounded-full py-3 font-medium text-white shadow-md transition hover:opacity-90 disabled:opacity-60"
          style={{ background: "linear-gradient(135deg, #9b7ee8, #7f6ae0)" }}
        >
          {loading ? "Creating account..." : "Sign Up"}
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
              onClick={() => show(`Sign up with ${provider} is coming soon!`)}
              title={provider}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 text-sm font-semibold text-gray-500 shadow-sm transition hover:bg-gray-50"
            >
              {provider[0]}
            </button>
          ))}
        </div>

        <p className="mt-5 text-center text-sm text-gray-500">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-purple-600 hover:underline">
            Log in
          </Link>
        </p>
      </form>
    </AuthCard>
  );
}
