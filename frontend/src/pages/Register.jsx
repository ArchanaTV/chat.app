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
    <AuthCard title="Create Account" subtitle="Join ChatWave and start chatting">
      {toast}
      <form onSubmit={handleSubmit}>
        {error && (
          <div className="mb-4 rounded-lg border border-red-400/30 bg-red-400/10 px-3 py-2 text-sm text-red-300">
            {error}
          </div>
        )}

        <div className="mb-3 flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 focus-within:border-indigo-400/50">
          <User size={18} className="text-white/40" />
          <input
            className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/30"
            placeholder="Username"
            value={form.username}
            onChange={update("username")}
            minLength={3}
            required
          />
        </div>

        <div className="mb-3 flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 focus-within:border-indigo-400/50">
          <Mail size={18} className="text-white/40" />
          <input
            type="email"
            className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/30"
            placeholder="Email"
            value={form.email}
            onChange={update("email")}
            required
          />
        </div>

        <div className="mb-5 flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 focus-within:border-indigo-400/50">
          <Lock size={18} className="text-white/40" />
          <input
            type={showPassword ? "text" : "password"}
            className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/30"
            placeholder="Password"
            value={form.password}
            onChange={update("password")}
            minLength={6}
            required
          />
          <button type="button" onClick={() => setShowPassword((s) => !s)} className="text-white/40">
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        <button
          disabled={loading}
          className="w-full rounded-xl py-3 font-medium text-white shadow-lg transition hover:brightness-110 disabled:opacity-60"
          style={{ background: "linear-gradient(135deg, var(--accent-from), var(--accent-to))" }}
        >
          {loading ? "Creating account..." : "Sign Up"}
        </button>

        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-white/10" />
          <span className="text-xs text-white/30">or continue with</span>
          <div className="h-px flex-1 bg-white/10" />
        </div>

        <div className="flex justify-center gap-3">
          {["Google", "Apple", "Facebook"].map((provider) => (
            <button
              key={provider}
              type="button"
              onClick={() => show(`Sign up with ${provider} is coming soon!`)}
              title={provider}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-sm font-semibold text-white/60 transition hover:bg-white/10"
            >
              {provider[0]}
            </button>
          ))}
        </div>

        <p className="mt-5 text-center text-sm text-white/50">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-indigo-300 hover:underline">
            Log in
          </Link>
        </p>
      </form>
    </AuthCard>
  );
}
