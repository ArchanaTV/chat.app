import { useState } from "react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, Reply, Smile, FileText, Check, CheckCheck } from "lucide-react";
import { resolveMediaUrl } from "../utils/media.js";

const REACTION_CHOICES = ["👍", "❤️", "😂", "😮", "😢", "🎉"];

function formatBytes(bytes) {
  if (!bytes) return "";
  const units = ["B", "KB", "MB", "GB"];
  let i = 0;
  let n = bytes;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i++;
  }
  return `${n.toFixed(1)} ${units[i]}`;
}

// Groups raw reaction docs [{emoji, user}] into [{emoji, count, mine}]
function groupReactions(reactions, currentUserId) {
  if (!reactions?.length) return [];
  const map = new Map();
  for (const r of reactions) {
    const key = r.emoji;
    const userId = r.user?._id || r.user;
    if (!map.has(key)) map.set(key, { emoji: key, count: 0, mine: false });
    const entry = map.get(key);
    entry.count += 1;
    if (userId === currentUserId) entry.mine = true;
  }
  return Array.from(map.values());
}

export default function MessageBubble({ message, isOwn, onReply, onDelete, onReact, currentUserId }) {
  const [pickerOpen, setPickerOpen] = useState(false);

  if (message.deletedForEveryone) {
    return (
      <div className={`flex ${isOwn ? "justify-end" : "justify-start"} px-3`}>
        <div className="my-1 max-w-[70%] rounded-2xl border border-white/5 bg-white/[0.03] px-4 py-2 text-sm italic text-white/30">
          This message was deleted
        </div>
      </div>
    );
  }

  const bubbleClasses = isOwn
    ? "text-white rounded-br-md"
    : "text-white/90 rounded-bl-md border border-white/10 bg-white/[0.06]";

  const groupedReactions = groupReactions(message.reactions, currentUserId);

  return (
    <div className={`group flex min-w-0 ${isOwn ? "justify-end" : "justify-start"} px-3`}>
      <div className="my-1 flex min-w-0 max-w-[70%] flex-col items-end gap-0.5">
        <div className="flex items-end gap-1">
          {isOwn && (
            <div className="mb-1 hidden gap-1 group-hover:flex">
              <motion.button
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => onDelete(message)}
                title="Delete"
                className="text-white/30 hover:text-red-400"
              >
                <Trash2 size={13} />
              </motion.button>
            </div>
          )}

          <div className="relative">
            <AnimatePresence>
              {pickerOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.85, y: 6 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.85, y: 6 }}
                  transition={{ duration: 0.15 }}
                  className={`absolute z-30 flex gap-1 rounded-full border border-white/10 bg-gray-900/95 p-1 shadow-xl backdrop-blur-xl ${
                    isOwn ? "-top-10 right-0" : "-top-10 left-0"
                  }`}
                >
                  {REACTION_CHOICES.map((emoji) => (
                    <motion.button
                      key={emoji}
                      whileHover={{ scale: 1.3, y: -2 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => {
                        onReact(message, emoji);
                        setPickerOpen(false);
                      }}
                      className="rounded-full p-1 text-base"
                    >
                      {emoji}
                    </motion.button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            <div
              className={`rounded-2xl px-4 py-2 shadow-md ${bubbleClasses}`}
              style={isOwn ? { background: "linear-gradient(135deg, #6366f1, #38bdf8)" } : undefined}
            >
              {message.replyTo && (
                <div className={`mb-1 rounded-lg border-l-2 px-2 py-1 text-xs opacity-80 ${isOwn ? "border-white/60" : "border-indigo-400"}`}>
                  {message.replyTo.text || `[${message.replyTo.type}]`}
                </div>
              )}

              {message.type === "text" || message.type === "emoji" ? (
                <p className="whitespace-pre-wrap break-words text-sm">{message.text}</p>
              ) : message.type === "image" ? (
                <img src={resolveMediaUrl(message.fileUrl)} alt="shared" className="max-h-64 rounded-lg object-cover" />
              ) : message.type === "video" ? (
                <video src={resolveMediaUrl(message.fileUrl)} controls className="max-h-64 rounded-lg" />
              ) : message.type === "audio" || message.type === "voice" ? (
                <audio src={resolveMediaUrl(message.fileUrl)} controls className="w-56" />
              ) : (
                <a
                  href={resolveMediaUrl(message.fileUrl)}
                  download={message.fileName}
                  className={`flex items-center gap-2 rounded-lg p-2 ${isOwn ? "bg-white/10" : "bg-white/5"}`}
                >
                  <FileText size={24} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{message.fileName}</p>
                    <p className="text-xs opacity-70">{formatBytes(message.fileSize)}</p>
                  </div>
                </a>
              )}

              <div className={`mt-1 flex items-center gap-1 text-[10px] ${isOwn ? "text-white/70" : "text-white/35"}`}>
                <span>{format(new Date(message.createdAt), "h:mm a")}</span>
                {isOwn && (message.seen ? <CheckCheck size={12} /> : <Check size={12} />)}
              </div>
            </div>
          </div>

          <div className="mb-1 hidden flex-col gap-1 group-hover:flex">
            <motion.button
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => onReply(message)}
              title="Reply"
              className="text-white/30 hover:text-indigo-300"
            >
              <Reply size={13} />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setPickerOpen((p) => !p)}
              title="React"
              className="text-white/30 hover:text-indigo-300"
            >
              <Smile size={13} />
            </motion.button>
          </div>
        </div>

        {groupedReactions.length > 0 && (
          <div className={`flex gap-1 ${isOwn ? "justify-end" : "justify-start"}`}>
            {groupedReactions.map((r) => (
              <motion.button
                key={r.emoji}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                whileHover={{ scale: 1.1 }}
                onClick={() => onReact(message, r.emoji)}
                className={`flex items-center gap-0.5 rounded-full border px-1.5 py-0.5 text-xs ${
                  r.mine ? "border-indigo-400/50 bg-indigo-400/10" : "border-white/10 bg-white/[0.04]"
                }`}
              >
                <span>{r.emoji}</span>
                {r.count > 1 && <span className="text-white/40">{r.count}</span>}
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
