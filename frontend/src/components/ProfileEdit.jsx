import { useState } from "react";
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm animate-pop-in rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-900"
      >
        <h2 className="mb-4 text-lg font-semibold">Edit Profile</h2>

        <div className="mb-4 flex flex-col items-center gap-2">
          <Avatar user={user} size={80} />
          <label className="cursor-pointer text-sm font-medium text-brand-600 hover:underline">
            Change photo
            <input type="file" accept="image/*" className="hidden" onChange={uploadAvatar} />
          </label>
        </div>

        {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

        <label className="mb-1 block text-sm font-medium">Username</label>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="mb-4 w-full rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-brand-500 dark:border-gray-700"
        />

        <label className="mb-1 block text-sm font-medium">Bio</label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          maxLength={160}
          rows={3}
          className="mb-4 w-full rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-brand-500 dark:border-gray-700"
        />

        <label className="mb-1 block text-sm font-medium">Mood</label>
        <div className="mb-4 flex gap-2">
          {MOODS.map((m) => (
            <button
              key={m.key}
              type="button"
              onClick={() => setMood(mood === m.key ? null : m.key)}
              title={m.label}
              className={`flex h-10 w-10 items-center justify-center rounded-full text-lg transition ${
                mood === m.key
                  ? "bg-brand-500 ring-2 ring-brand-600"
                  : "bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700"
              }`}
            >
              {m.emoji}
            </button>
          ))}
        </div>

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800">
            Cancel
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
