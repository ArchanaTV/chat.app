import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import Logo from "../components/Logo.jsx";
import AuthOceanScene from "../components/AuthOceanScene.jsx";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
      <AuthOceanScene />
      <form
        onSubmit={handleSubmit}
        className="relative z-10 w-full max-w-sm animate-fade-in rounded-2xl bg-white p-8 shadow-xl dark:bg-gray-900"
      >
        <Link to="/login" className="mb-3 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-brand-600 dark:text-gray-400">
          ← Back
        </Link>
        <Logo size={36} showText={false} className="mb-1" />
        <h1 className="mb-1 text-2xl font-bold text-brand-600">ChatWave</h1>
        <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">Create an account to start chatting.</p>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">
            {error}
          </div>
        )}

        <label className="mb-1 block text-sm font-medium">Username</label>
        <input
          className="mb-4 w-full rounded-lg border border-gray-300 bg-transparent px-3 py-2 outline-none focus:border-brand-500 dark:border-gray-700"
          value={form.username}
          onChange={update("username")}
          minLength={3}
          required
        />

        <label className="mb-1 block text-sm font-medium">Email</label>
        <input
          type="email"
          className="mb-4 w-full rounded-lg border border-gray-300 bg-transparent px-3 py-2 outline-none focus:border-brand-500 dark:border-gray-700"
          value={form.email}
          onChange={update("email")}
          required
        />

        <label className="mb-1 block text-sm font-medium">Password</label>
        <input
          type="password"
          className="mb-6 w-full rounded-lg border border-gray-300 bg-transparent px-3 py-2 outline-none focus:border-brand-500 dark:border-gray-700"
          value={form.password}
          onChange={update("password")}
          minLength={6}
          required
        />

        <button
          disabled={loading}
          className="w-full rounded-lg bg-brand-600 py-2 font-medium text-white transition hover:bg-brand-700 disabled:opacity-60"
        >
          {loading ? "Creating account..." : "Sign Up"}
        </button>

        <p className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-brand-600 hover:underline">
            Log in
          </Link>
        </p>
      </form>
    </div>
  );
}
