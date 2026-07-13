import { useState } from "react";
import { motion } from "framer-motion";
import { Camera } from "lucide-react";
import api from "../api/axios.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useSocket } from "../context/SocketContext.jsx";
import Avatar from "./Avatar.jsx";
import { MOODS } from "./MoodBubble.jsx";

export default function ProfileEdit({ onClose }) {
  const { user, setUser } = useAuth();
  const { socket } = useSocket();
  const [username, setUsername] = useState(user.username);
  const [bio, setBio] = useState(user.bio || "");
  const [mood, setMood] = useState(user.mood || null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const uploadAvatar = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("avatar", file);
    const { data } = await api.post("/users/me/avatar", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    setUser(data.user);
  };

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      const { data } = await api.put("/users/me", { username, bio, mood });
      setUser(data.user);
      socket?.emit("mood:update", { mood });
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 12 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-3xl border border-white/10 bg-white/[0.06] p-6 shadow-2xl backdrop-blur-xl"
      >
        <h2 className="mb-4 text-lg font-semibold text-white">Edit Profile</h2>

        <div className="mb-4 flex flex-col items-center gap-2">
          <div className="relative">
            <Avatar user={user} size={80} />
            <label className="absolute -bottom-1 -right-1 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border border-white/10 bg-white/10 text-white/70 backdrop-blur transition hover:bg-white/20 hover:text-white">
              <Camera size={13} />
              <input type="file" accept="image/*" className="hidden" onChange={uploadAvatar} />
            </label>
          </div>
        </div>

        {error && (
          <p className="mb-3 rounded-lg border border-red-400/30 bg-red-400/10 px-3 py-2 text-sm text-red-300">
            {error}
          </p>
        )}

        <label className="mb-1 block text-sm font-medium text-white/70">Username</label>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="mb-4 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-indigo-400/50"
        />

        <label className="mb-1 block text-sm font-medium text-white/70">Bio</label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          maxLength={160}
          rows={3}
          className="mb-4 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-indigo-400/50"
        />

        <label className="mb-1 block text-sm font-medium text-white/70">Mood</label>
        <div className="mb-5 flex gap-2">
          {MOODS.map((m) => (
            <motion.button
              key={m.key}
              type="button"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.92 }}
              onClick={() => setMood(mood === m.key ? null : m.key)}
              title={m.label}
              className={`flex h-10 w-10 items-center justify-center rounded-full text-lg transition ${
                mood === m.key
                  ? "ring-2 ring-indigo-400"
                  : "border border-white/10 bg-white/5 hover:bg-white/10"
              }`}
              style={mood === m.key ? { background: "linear-gradient(135deg, var(--accent-from), var(--accent-to))" } : undefined}
            >
              {m.emoji}
            </motion.button>
          ))}
        </div>

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="rounded-xl px-4 py-2 text-sm text-white/60 transition hover:bg-white/5 hover:text-white">
            Cancel
          </button>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={save}
            disabled={saving}
            className="rounded-xl px-4 py-2 text-sm font-medium text-white shadow-lg disabled:opacity-60"
            style={{ background: "linear-gradient(135deg, var(--accent-from), var(--accent-to))" }}
          >
            {saving ? "Saving..." : "Save"}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}
