import { motion } from "framer-motion";
import { X, Send } from "lucide-react";
import Avatar from "./Avatar.jsx";

export default function ForwardModal({ message, friends, onSend, onClose }) {
  if (!message) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 12 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-3xl border border-white/10 bg-gray-900/95 p-5 shadow-2xl backdrop-blur-xl"
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Forward message</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white/80">
            <X size={18} />
          </button>
        </div>

        <div className="mb-4 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/60">
          {message.text || `[${message.type}]`}
        </div>

        {friends.length === 0 ? (
          <p className="py-4 text-center text-sm text-white/40">No friends to forward to yet.</p>
        ) : (
          <div className="max-h-72 space-y-1 overflow-y-auto">
            {friends.map((f) => (
              <button
                key={f._id}
                onClick={() => onSend(f._id)}
                className="flex w-full items-center justify-between rounded-xl px-2 py-2 text-left transition hover:bg-white/5"
              >
                <div className="flex items-center gap-3">
                  <Avatar user={f} size={36} />
                  <span className="text-sm font-medium text-white">{f.username}</span>
                </div>
                <Send size={15} className="text-indigo-300" />
              </button>
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
