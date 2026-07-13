import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Check } from "lucide-react";
import api from "../api/axios.js";
import Avatar from "./Avatar.jsx";

export default function SearchUsers() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [sentTo, setSentTo] = useState(new Set());
  const [loading, setLoading] = useState(false);

  const search = async (value) => {
    setQ(value);
    if (!value.trim()) return setResults([]);
    setLoading(true);
    try {
      const { data } = await api.get(`/users/search?q=${encodeURIComponent(value)}`);
      setResults(data.users);
    } finally {
      setLoading(false);
    }
  };

  const sendRequest = async (userId) => {
    try {
      await api.post(`/friends/request/${userId}`);
      setSentTo((s) => new Set(s).add(userId));
    } catch (err) {
      alert(err.response?.data?.message || "Failed to send request");
    }
  };

  return (
    <div className="p-3">
      <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 transition focus-within:border-indigo-400/50">
        <Search size={16} className="text-white/40" />
        <input
          value={q}
          onChange={(e) => search(e.target.value)}
          placeholder="Search users by username..."
          className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/30"
        />
        {loading && (
          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/20 border-t-indigo-300" />
        )}
      </div>

      <AnimatePresence>
        {results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-2 max-h-64 space-y-1 overflow-y-auto"
          >
            {results.map((u, i) => (
              <motion.div
                key={u._id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="flex items-center justify-between rounded-xl p-2 transition hover:bg-white/5"
              >
                <div className="flex items-center gap-2">
                  <Avatar user={u} size={32} />
                  <span className="text-sm font-medium text-white">{u.username}</span>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => sendRequest(u._id)}
                  disabled={sentTo.has(u._id)}
                  className="flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium text-white shadow-md transition disabled:opacity-60"
                  style={{
                    background: sentTo.has(u._id)
                      ? "rgba(255,255,255,0.1)"
                      : "linear-gradient(135deg, var(--accent-from), var(--accent-to))",
                  }}
                >
                  {sentTo.has(u._id) ? (
                    <>
                      <Check size={12} /> Sent
                    </>
                  ) : (
                    "Add"
                  )}
                </motion.button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
