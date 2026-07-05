import { useState } from "react";
import { format } from "date-fns";
import { resolveMediaUrl } from "../utils/media.js";

const REACTION_CHOICES = ["👍", "❤️", "😂", "😮", "😢", "🎉"];

const FileIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <path d="M14 2v6h6" />
  </svg>
);

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
      <div className={`flex ${isOwn ? "justify-end" : "justify-start"} px-2`}>
        <div className="my-1 max-w-[70%] rounded-2xl bg-gray-100 px-4 py-2 text-sm italic text-gray-400 dark:bg-gray-800">
          This message was deleted
        </div>
      </div>
    );
  }

  const bubbleClasses = isOwn
    ? "bg-brand-600 text-white rounded-br-sm"
    : "bg-white dark:bg-gray-800 rounded-bl-sm";

  const groupedReactions = groupReactions(message.reactions, currentUserId);

  return (
    <div className={`group flex ${isOwn ? "justify-end" : "justify-start"} px-2`}>
      <div className="my-1 flex max-w-[70%] flex-col items-end gap-0.5">
        <div className="flex items-end gap-1">
          {isOwn && (
            <div className="mb-1 hidden gap-1 group-hover:flex">
              <button onClick={() => onDelete(message)} title="Delete" className="text-xs text-gray-400 hover:text-red-500">
                🗑️
              </button>
            </div>
          )}

          <div className="relative">
            {pickerOpen && (
              <div
                className={`absolute z-30 flex gap-1 rounded-full bg-white p-1 shadow-lg dark:bg-gray-700 ${
                  isOwn ? "-top-9 right-0" : "-top-9 left-0"
                }`}
              >
                {REACTION_CHOICES.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => {
                      onReact(message, emoji);
                      setPickerOpen(false);
                    }}
                    className="rounded-full p-1 text-base transition hover:scale-125"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}

            <div className={`animate-fade-in rounded-2xl px-4 py-2 shadow-sm ${bubbleClasses}`}>
              {message.replyTo && (
                <div className={`mb-1 rounded-lg border-l-2 px-2 py-1 text-xs opacity-80 ${isOwn ? "border-white/60" : "border-brand-500"}`}>
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
                  className={`flex items-center gap-2 rounded-lg p-2 ${isOwn ? "bg-white/10" : "bg-gray-100 dark:bg-gray-700"}`}
                >
                  <FileIcon />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{message.fileName}</p>
                    <p className="text-xs opacity-70">{formatBytes(message.fileSize)}</p>
                  </div>
                </a>
              )}

              <div className={`mt-1 flex items-center gap-1 text-[10px] ${isOwn ? "text-white/70" : "text-gray-400"}`}>
                <span>{format(new Date(message.createdAt), "h:mm a")}</span>
                {isOwn && <span>{message.seen ? "✓✓ Seen" : "✓ Sent"}</span>}
              </div>
            </div>
          </div>

          <div className="mb-1 hidden flex-col gap-1 group-hover:flex">
            <button onClick={() => onReply(message)} title="Reply" className="text-xs text-gray-400 hover:text-brand-500">
              ↩️
            </button>
            <button onClick={() => setPickerOpen((p) => !p)} title="React" className="text-xs text-gray-400 hover:text-brand-500">
              😊
            </button>
          </div>
        </div>

        {groupedReactions.length > 0 && (
          <div className={`flex gap-1 ${isOwn ? "justify-end" : "justify-start"}`}>
            {groupedReactions.map((r) => (
              <button
                key={r.emoji}
                onClick={() => onReact(message, r.emoji)}
                className={`flex animate-pop-in items-center gap-0.5 rounded-full border px-1.5 py-0.5 text-xs ${
                  r.mine
                    ? "border-brand-500 bg-brand-50 dark:bg-brand-700/30"
                    : "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"
                }`}
              >
                <span>{r.emoji}</span>
                {r.count > 1 && <span className="text-gray-500 dark:text-gray-400">{r.count}</span>}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
