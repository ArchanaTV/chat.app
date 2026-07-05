import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import Logo from "../components/Logo.jsx";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-50 to-white px-4 dark:from-gray-950 dark:to-gray-900">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm animate-fade-in rounded-2xl bg-white p-8 shadow-xl dark:bg-gray-900"
      >
        <Logo size={36} showText={false} className="mb-1" />
        <h1 className="mb-1 text-2xl font-bold text-brand-600">ChatWave</h1>
        <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">Welcome back! Log in to keep chatting.</p>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">
            {error}
          </div>
        )}

        <label className="mb-1 block text-sm font-medium">Email or Username</label>
        <input
          className="mb-4 w-full rounded-lg border border-gray-300 bg-transparent px-3 py-2 outline-none focus:border-brand-500 dark:border-gray-700"
          value={emailOrUsername}
          onChange={(e) => setEmailOrUsername(e.target.value)}
          required
        />

        <label className="mb-1 block text-sm font-medium">Password</label>
        <input
          type="password"
          className="mb-6 w-full rounded-lg border border-gray-300 bg-transparent px-3 py-2 outline-none focus:border-brand-500 dark:border-gray-700"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button
          disabled={loading}
          className="w-full rounded-lg bg-brand-600 py-2 font-medium text-white transition hover:bg-brand-700 disabled:opacity-60"
        >
          {loading ? "Logging in..." : "Log In"}
        </button>

        <p className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
          Don't have an account?{" "}
          <Link to="/register" className="font-medium text-brand-600 hover:underline">
            Sign up
          </Link>
        </p>
      </form>
    </div>
  );
}
