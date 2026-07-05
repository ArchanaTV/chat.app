import { useEffect, useState } from "react";
import api from "../api/axios.js";
import Avatar from "./Avatar.jsx";

export default function FriendRequests({ onAccepted }) {
  const [requests, setRequests] = useState([]);

  const load = async () => {
    const { data } = await api.get("/friends/requests");
    setRequests(data.requests);
  };

  useEffect(() => {
    load();
  }, []);

  const respond = async (id, action) => {
    await api.post(`/friends/${action}/${id}`);
    setRequests((r) => r.filter((req) => req._id !== id));
    if (action === "accept") onAccepted?.();
  };

  if (requests.length === 0) {
    return <p className="p-3 text-sm text-gray-400">No pending friend requests.</p>;
  }

  return (
    <div className="space-y-1 p-3">
      {requests.map((req) => (
        <div key={req._id} className="flex animate-fade-in items-center justify-between rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-800">
          <div className="flex items-center gap-2">
            <Avatar user={req.from} size={32} />
            <span className="text-sm font-medium">{req.from.username}</span>
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => respond(req._id, "accept")}
              className="rounded-full bg-green-600 px-3 py-1 text-xs font-medium text-white hover:bg-green-700"
            >
              Accept
            </button>
            <button
              onClick={() => respond(req._id, "reject")}
              className="rounded-full bg-gray-200 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200"
            >
              Reject
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
