import { useState } from "react";
import api from "../api/axios.js";
import Avatar from "./Avatar.jsx";

export default function SearchUsers() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [sentTo, setSentTo] = useState(new Set());

  const search = async (value) => {
    setQ(value);
    if (!value.trim()) return setResults([]);
    const { data } = await api.get(`/users/search?q=${encodeURIComponent(value)}`);
    setResults(data.users);
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
      <input
        value={q}
        onChange={(e) => search(e.target.value)}
        placeholder="Search users by username..."
        className="w-full rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-brand-500 dark:border-gray-700"
      />
      {results.length > 0 && (
        <div className="mt-2 max-h-64 space-y-1 overflow-y-auto">
          {results.map((u) => (
            <div key={u._id} className="flex items-center justify-between rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-800">
              <div className="flex items-center gap-2">
                <Avatar user={u} size={32} />
                <span className="text-sm font-medium">{u.username}</span>
              </div>
              <button
                onClick={() => sendRequest(u._id)}
                disabled={sentTo.has(u._id)}
                className="rounded-full bg-brand-600 px-3 py-1 text-xs font-medium text-white hover:bg-brand-700 disabled:bg-gray-300 disabled:dark:bg-gray-700"
              >
                {sentTo.has(u._id) ? "Sent" : "Add"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
