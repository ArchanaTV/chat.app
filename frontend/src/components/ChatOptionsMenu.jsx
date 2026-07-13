import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MoreVertical, Trash2, UserX, Ban } from "lucide-react";
import api from "../api/axios.js";

export default function ChatOptionsMenu({ friend, onChatCleared, onRelationshipChanged }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null); // "clear" | "unfriend" | "block"
  const [working, setWorking] = useState(false);

  const runAction = async () => {
    setWorking(true);
    try {
      if (confirmAction === "clear") {
        await api.delete(`/messages/${friend._id}/clear`);
        onChatCleared?.();
      } else if (confirmAction === "unfriend") {
        await api.delete(`/friends/${friend._id}`);
        onRelationshipChanged?.();
      } else if (confirmAction === "block") {
        await api.post(`/friends/block/${friend._id}`);
        onRelationshipChanged?.();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Something went wrong");
    } finally {
      setWorking(false);
      setConfirmAction(null);
    }
  };

  const CONFIRM_COPY = {
    clear: {
      title: "Clear this chat?",
      body: `This deletes all messages with ${friend.username} for you only. You'll stay friends.`,
      confirmLabel: "Clear Chat",
    },
    unfriend: {
      title: "Remove this friend?",
      body: `You and ${friend.username} won't be able to message or call each other until you send a new friend request.`,
      confirmLabel: "Unfriend",
    },
    block: {
      title: "Block this person?",
      body: `${friend.username} won't be able to message or call you anymore, and you'll be unfriended. You can unblock them later from settings.`,
      confirmLabel: "Block",
    },
  };

  return (
    <div className="relative">
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setMenuOpen((s) => !s)}
        title="More options"
        className="flex h-9 w-9 items-center justify-center rounded-full text-white/50 transition hover:bg-white/10 hover:text-white"
      >
        <MoreVertical size={17} />
      </motion.button>

      <AnimatePresence>
        {menuOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 8 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-11 z-50 w-52 overflow-hidden rounded-2xl border border-white/10 bg-gray-900/95 py-1 shadow-2xl backdrop-blur-xl"
            >
              <MenuRow
                icon={<Trash2 size={15} />}
                label="Clear chat"
                onClick={() => {
                  setMenuOpen(false);
                  setConfirmAction("clear");
                }}
              />
              <MenuRow
                icon={<Ban size={15} />}
                label="Block"
                danger
                onClick={() => {
                  setMenuOpen(false);
                  setConfirmAction("block");
                }}
              />
              <MenuRow
                icon={<UserX size={15} />}
                label="Unfriend"
                danger
                onClick={() => {
                  setMenuOpen(false);
                  setConfirmAction("unfriend");
                }}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {confirmAction && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !working && setConfirmAction(null)}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-xs rounded-2xl border border-white/10 bg-gray-900/95 p-5 shadow-2xl backdrop-blur-xl"
            >
              <p className="mb-1 font-medium text-white">{CONFIRM_COPY[confirmAction].title}</p>
              <p className="mb-4 text-sm text-white/50">{CONFIRM_COPY[confirmAction].body}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmAction(null)}
                  disabled={working}
                  className="flex-1 rounded-xl border border-white/10 py-2 text-sm text-white/70 hover:bg-white/5 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={runAction}
                  disabled={working}
                  className="flex-1 rounded-xl bg-red-500 py-2 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-50"
                >
                  {working ? "..." : CONFIRM_COPY[confirmAction].confirmLabel}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MenuRow({ icon, label, onClick, danger }) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm transition hover:bg-white/10 ${
        danger ? "text-red-400" : "text-white/85"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
