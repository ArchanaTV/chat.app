import { useRef, useState } from "react";
import { format } from "date-fns";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import { Reply, FileText, Check, CheckCheck, Copy, Forward, Trash2, X, Phone, Video } from "lucide-react";
import { resolveMediaUrl } from "../utils/media.js";

const REACTION_CHOICES = ["👍", "❤️", "😂", "😮", "😢", "🎉"];
const LONG_PRESS_MS = 480;
const SWIPE_REPLY_THRESHOLD = 62;

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

export default function MessageBubble({ message, isOwn, onReply, onDelete, onReact, onForward, currentUserId }) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [copied, setCopied] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const x = useMotionValue(0);
  const replyIconOpacity = useTransform(x, [0, SWIPE_REPLY_THRESHOLD], [0, 1]);
  const replyIconScale = useTransform(x, [0, SWIPE_REPLY_THRESHOLD], [0.5, 1]);
  const longPressTimer = useRef(null);
  const vibratedRef = useRef(false);

  const startLongPress = () => {
    clearTimeout(longPressTimer.current);
    longPressTimer.current = setTimeout(() => {
      setMenuOpen(true);
      if (navigator.vibrate) navigator.vibrate(20);
    }, LONG_PRESS_MS);
  };
  const cancelLongPress = () => clearTimeout(longPressTimer.current);

  const handleDrag = (_e, info) => {
    if (!vibratedRef.current && info.offset.x > SWIPE_REPLY_THRESHOLD) {
      vibratedRef.current = true;
      if (navigator.vibrate) navigator.vibrate(15);
    } else if (info.offset.x <= SWIPE_REPLY_THRESHOLD) {
      vibratedRef.current = false;
    }
  };

  const handleDragEnd = (_e, info) => {
    vibratedRef.current = false;
    if (info.offset.x > SWIPE_REPLY_THRESHOLD) {
      onReply(message);
    }
  };

  const copyText = async () => {
    if (message.text) {
      await navigator.clipboard.writeText(message.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    }
    setMenuOpen(false);
  };

  if (message.deletedForEveryone) {
    return (
      <div className={`flex ${isOwn ? "justify-end" : "justify-start"} px-3`}>
        <div className="my-1 max-w-[70%] rounded-2xl border border-white/5 bg-white/[0.03] px-4 py-2 text-sm italic text-white/30">
          This message was deleted
        </div>
      </div>
    );
  }

  if (message.type === "call") {
    return <CallLogRow message={message} isOwn={isOwn} />;
  }

  const bubbleClasses = isOwn
    ? "text-white rounded-br-md"
    : "text-white/90 rounded-bl-md border border-white/10 bg-white/[0.06]";

  const groupedReactions = groupReactions(message.reactions, currentUserId);

  return (
    <div className={`group relative flex min-w-0 ${isOwn ? "justify-end" : "justify-start"} px-3`}>
      {/* reply icon revealed as the bubble is swiped right */}
      <motion.div
        style={{ opacity: replyIconOpacity, scale: replyIconScale }}
        className="pointer-events-none absolute left-6 top-1/2 -translate-y-1/2 text-indigo-300"
      >
        <Reply size={20} />
      </motion.div>

      <div className="my-1 flex min-w-0 max-w-[70%] flex-col items-end gap-0.5">
        <div className="flex items-end gap-1">
          <div className="relative">
            {/* quick emoji reaction popover (desktop hover / tap the smiley) */}
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

            {/* modern long-press context menu: Reply / Copy / Forward / Delete */}
            <AnimatePresence>
              {menuOpen && (
                <>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-40"
                    onClick={() => setMenuOpen(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 8 }}
                    transition={{ duration: 0.15 }}
                    className={`absolute z-50 w-40 overflow-hidden rounded-2xl border border-white/10 bg-gray-900/95 py-1 shadow-2xl backdrop-blur-xl ${
                      isOwn ? "-top-2 right-0" : "-top-2 left-0"
                    }`}
                  >
                    <MenuItem icon={<Reply size={15} />} label="Reply" onClick={() => { onReply(message); setMenuOpen(false); }} />
                    {message.text && <MenuItem icon={<Copy size={15} />} label={copied ? "Copied!" : "Copy"} onClick={copyText} />}
                    <MenuItem icon={<Forward size={15} />} label="Forward" onClick={() => { onForward(message); setMenuOpen(false); }} />
                    {isOwn && (
                      <MenuItem
                        icon={<Trash2 size={15} />}
                        label="Delete"
                        danger
                        onClick={() => { setMenuOpen(false); setConfirmDelete(true); }}
                      />
                    )}
                  </motion.div>
                </>
              )}
            </AnimatePresence>

            <motion.div
              drag="x"
              dragDirectionLock
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={{ left: 0, right: 0.5 }}
              onDrag={handleDrag}
              onDragEnd={handleDragEnd}
              onPointerDown={startLongPress}
              onPointerUp={cancelLongPress}
              onPointerLeave={cancelLongPress}
              onContextMenu={(e) => {
                e.preventDefault();
                setMenuOpen(true);
              }}
              style={{ x, background: isOwn ? "linear-gradient(135deg, var(--accent-from), var(--accent-to))" : undefined }}
              className={`cursor-grab rounded-2xl px-4 py-2 shadow-md active:cursor-grabbing ${bubbleClasses}`}
            >
              {message.replyTo && (
                <div className={`mb-1 rounded-lg border-l-2 px-2 py-1 text-xs opacity-80 ${isOwn ? "border-white/60" : "border-indigo-400"}`}>
                  {message.replyTo.text || `[${message.replyTo.type}]`}
                </div>
              )}

              {message.type === "text" || message.type === "emoji" ? (
                <p className="whitespace-pre-wrap break-words text-sm">{message.text}</p>
              ) : message.type === "image" ? (
                <img
                  src={resolveMediaUrl(message.fileUrl)}
                  alt="shared"
                  onClick={() => setLightboxOpen(true)}
                  className="max-h-64 cursor-pointer rounded-lg object-cover transition hover:brightness-90"
                  draggable={false}
                />
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
            </motion.div>
          </div>

          <motion.button
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setPickerOpen((p) => !p)}
            title="React"
            className="mb-1 hidden text-white/30 hover:text-indigo-300 group-hover:block"
          >
            <span className="text-sm">🙂</span>
          </motion.button>
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

      {/* WhatsApp-style delete confirmation */}
      <AnimatePresence>
        {confirmDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
            onClick={() => setConfirmDelete(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-xs rounded-2xl border border-white/10 bg-gray-900/95 p-5 text-center shadow-2xl backdrop-blur-xl"
            >
              <p className="mb-4 font-medium text-white">Delete this message?</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="flex-1 rounded-xl border border-white/10 py-2 text-sm text-white/70 hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setConfirmDelete(false);
                    onDelete(message);
                  }}
                  className="flex-1 rounded-xl bg-red-500 py-2 text-sm font-medium text-white hover:bg-red-600"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Full-screen image lightbox */}
      <AnimatePresence>
        {lightboxOpen && message.type === "image" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightboxOpen(false)}
            className="fixed inset-0 z-[150] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
          >
            <button
              onClick={() => setLightboxOpen(false)}
              className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
            >
              <X size={20} />
            </button>
            <motion.img
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              onClick={(e) => e.stopPropagation()}
              src={resolveMediaUrl(message.fileUrl)}
              alt="shared"
              className="max-h-[90vh] max-w-full rounded-lg object-contain"
            />
            <a
              href={resolveMediaUrl(message.fileUrl)}
              download
              onClick={(e) => e.stopPropagation()}
              className="absolute bottom-6 rounded-full bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/20"
            >
              Download
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CallLogRow({ message, isOwn }) {
  const isVideo = message.callType === "video";
  const Icon = isVideo ? Video : Phone;

  const label = {
    completed: `${isVideo ? "Video" : "Voice"} call · ${formatDuration(message.callDuration)}`,
    missed: `Missed ${isVideo ? "video" : "voice"} call`,
    declined: `${isOwn ? "Call declined" : "You declined"}`,
    cancelled: isOwn ? "You cancelled the call" : "Missed call",
  }[message.callOutcome] || "Call";

  const isMissedStyle = message.callOutcome === "missed" || (message.callOutcome === "cancelled" && !isOwn);

  return (
    <div className="flex justify-center px-3 py-1.5">
      <div
        className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs ${
          isMissedStyle
            ? "border-red-400/20 bg-red-400/5 text-red-300/80"
            : "border-white/10 bg-white/[0.04] text-white/50"
        }`}
      >
        <Icon size={13} />
        <span>{label}</span>
        <span className="text-white/25">· {format(new Date(message.createdAt), "h:mm a")}</span>
      </div>
    </div>
  );
}

function formatDuration(seconds) {
  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

function MenuItem({ icon, label, onClick, danger }) {
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
