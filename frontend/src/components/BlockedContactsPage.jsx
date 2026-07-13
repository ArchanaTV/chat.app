import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Search, ShieldOff, Check } from "lucide-react";
import { format } from "date-fns";
import api from "../api/axios.js";
import Avatar from "./Avatar.jsx";

export default function BlockedContactsPage({ onBack }) {
  const [blocked, setBlocked] = useState(null); // null = loading
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState("recent"); // "recent" | "name"
  const [confirming, setConfirming] = useState(null);
  const [justUnblocked, setJustUnblocked] = useState(null);

  const load = () => {
    api.get("/friends/blocked").then(({ data }) => setBlocked(data.blocked));
  };

  useEffect(() => {
    load();
  }, []);

  const unblock = async (user) => {
    await api.post(`/friends/unblock/${user._id}`);
    setConfirming(null);
    setJustUnblocked(user._id);
    setTimeout(() => {
      setBlocked((prev) => prev.filter((u) => u._id !== user._id));
      setJustUnblocked(null);
    }, 900);
  };

  const filtered = (blocked || [])
    .filter((u) => u.username.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => (sortBy === "name" ? a.username.localeCompare(b.username) : new Date(b.updatedAt) - new Date(a.updatedAt)));

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
        <button onClick={onBack} className="flex h-9 w-9 items-center justify-center rounded-full text-white/60 hover:bg-white/10 hover:text-white">
          <ArrowLeft size={18} />
        </button>
        <h2 className="text-lg font-semibold text-white">Blocked Contacts</h2>
      </div>

      <div className="border-b border-white/10 p-4">
        <div className="mb-3 flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
          <Search size={16} className="text-white/40" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search blocked contacts..."
            className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/30"
          />
        </div>
        <div className="flex gap-2 text-xs">
          <SortChip active={sortBy === "recent"} onClick={() => setSortBy("recent")} label="Recently blocked" />
          <SortChip active={sortBy === "name"} onClick={() => setSortBy("name")} label="Name" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {blocked === null ? (
          <div className="flex justify-center py-8">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-400/30 border-t-indigo-400" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="py-8 text-center text-sm text-white/30">
            {blocked.length === 0 ? "You haven't blocked anyone." : "No matches found."}
          </p>
        ) : (
          <AnimatePresence>
            {filtered.map((user) => (
              <motion.div
                key={user._id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="mb-1 flex items-center justify-between gap-3 rounded-xl p-2 hover:bg-white/5"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar user={user} size={42} />
                  <div className="min-w-0">
                    <p className="truncate font-medium text-white">{user.username}</p>
                    <p className="text-xs text-white/35">
                      Blocked {user.updatedAt ? format(new Date(user.updatedAt), "MMM d, yyyy") : ""}
                    </p>
                  </div>
                </div>

                {justUnblocked === user._id ? (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="flex items-center gap-1 text-sm text-emerald-400"
                  >
                    <Check size={16} /> Unblocked
                  </motion.span>
                ) : (
                  <button
                    onClick={() => setConfirming(user)}
                    className="flex items-center gap-1 rounded-full border border-white/10 px-3 py-1.5 text-xs font-medium text-white/70 hover:bg-white/10"
                  >
                    <ShieldOff size={13} /> Unblock
                  </button>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      <AnimatePresence>
        {confirming && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setConfirming(null)}
            className="fixed inset-0 z-[220] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-xs rounded-2xl border border-white/10 bg-gray-900/95 p-5 text-center shadow-2xl backdrop-blur-xl"
            >
              <p className="mb-1 font-medium text-white">Are you sure you want to unblock this contact?</p>
              <p className="mb-4 text-sm text-white/50">{confirming.username} will be able to message and call you again.</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirming(null)}
                  className="flex-1 rounded-xl border border-white/10 py-2 text-sm text-white/70 hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  onClick={() => unblock(confirming)}
                  className="flex-1 rounded-xl bg-emerald-500 py-2 text-sm font-medium text-white hover:bg-emerald-600"
                >
                  Unblock
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SortChip({ active, onClick, label }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-3 py-1 transition ${
        active ? "border-indigo-400/50 bg-indigo-400/10 text-indigo-300" : "border-white/10 text-white/40 hover:bg-white/5"
      }`}
    >
      {label}
    </button>
  );
}
