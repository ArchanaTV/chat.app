import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UserPlus, Check, X } from "lucide-react";
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
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="m-3 flex flex-col items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400/20 to-sky-400/20">
          <UserPlus size={22} className="text-indigo-300" />
        </div>
        <p className="text-sm font-medium text-white/80">No pending requests</p>
        <p className="text-xs text-white/40">New friend requests will show up here</p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-1 p-3">
      <AnimatePresence>
        {requests.map((req) => (
          <motion.div
            key={req._id}
            layout
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex items-center justify-between rounded-xl p-2 transition hover:bg-white/5"
          >
            <div className="flex items-center gap-2">
              <Avatar user={req.from} size={32} />
              <span className="text-sm font-medium text-white">{req.from.username}</span>
            </div>
            <div className="flex gap-1.5">
              <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                onClick={() => respond(req._id, "accept")}
                className="flex h-8 w-8 items-center justify-center rounded-full text-white shadow-md"
                style={{ background: "linear-gradient(135deg, #34d399, #10b981)" }}
                title="Accept"
              >
                <Check size={14} />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                onClick={() => respond(req._id, "reject")}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/60 transition hover:text-white"
                title="Reject"
              >
                <X size={14} />
              </motion.button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
