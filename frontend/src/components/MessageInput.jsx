import { useRef, useState } from "react";
import EmojiPicker from "emoji-picker-react";
import { motion, AnimatePresence } from "framer-motion";
import { Smile, Paperclip, Clock, Send, X } from "lucide-react";
import api from "../api/axios.js";
import { useTheme } from "../context/ThemeContext.jsx";
import VoiceRecorder from "./VoiceRecorder.jsx";

const MEDIA_TYPE_BY_MIME = (mime) => {
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("audio/")) return "audio";
  return "document";
};

export default function MessageInput({ onSend, onSchedule, onTyping, replyTo, onCancelReply }) {
  const { theme } = useTheme();
  const [text, setText] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduleTime, setScheduleTime] = useState("");
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const handleChange = (e) => {
    setText(e.target.value);
    onTyping?.(true);
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => onTyping?.(false), 1500);
  };

  const submitText = () => {
    if (!text.trim()) return;
    onSend({ type: "text", text: text.trim() });
    setText("");
    onTyping?.(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submitText();
    }
  };

  const handleFilePick = async (e) => {
    const file = e.target.files[0];
    e.target.value = "";
    if (!file) return;
    await uploadAndSend(file);
  };

  const uploadAndSend = async (fileOrBlob, forcedType) => {
    setUploading(true);
    try {
      const formData = new FormData();
      const filename = fileOrBlob.name || `voice-${Date.now()}.webm`;
      formData.append("file", fileOrBlob, filename);
      const { data } = await api.post("/messages/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const type = forcedType || MEDIA_TYPE_BY_MIME(data.mimeType);
      onSend({ type, fileUrl: data.fileUrl, fileName: data.fileName, fileSize: data.fileSize });
    } catch (err) {
      alert("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const onEmojiClick = (emojiData) => {
    setText((t) => t + emojiData.emoji);
  };

  const submitSchedule = () => {
    if (!text.trim() || !scheduleTime) return;
    const when = new Date(scheduleTime);
    if (when <= new Date()) {
      alert("Please pick a time in the future.");
      return;
    }
    onSchedule?.({ type: "text", text: text.trim() }, when.toISOString());
    setText("");
    setScheduleOpen(false);
    setScheduleTime("");
  };

  // Minimum value for the datetime picker: right now, formatted for datetime-local input
  const minDateTime = new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);

  return (
    <div className="relative border-t border-white/10 bg-white/[0.03] p-3 backdrop-blur-xl">
      <AnimatePresence>
        {replyTo && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mb-2 overflow-hidden"
          >
            <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/70">
              <span className="truncate">
                Replying to: <span className="font-medium text-white">{replyTo.text || `[${replyTo.type}]`}</span>
              </span>
              <button onClick={onCancelReply} className="ml-2 text-white/40 hover:text-white/80">
                <X size={14} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {scheduleOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mb-2 overflow-hidden"
          >
            <div className="flex flex-wrap items-center gap-2 rounded-lg border border-indigo-400/20 bg-indigo-400/10 px-3 py-2 text-xs text-white/80">
              <span className="font-medium">Schedule this message for:</span>
              <input
                type="datetime-local"
                min={minDateTime}
                value={scheduleTime}
                onChange={(e) => setScheduleTime(e.target.value)}
                className="rounded border border-white/10 bg-white/10 px-2 py-1 text-xs text-white"
              />
              <button
                onClick={submitSchedule}
                disabled={!text.trim() || !scheduleTime}
                className="rounded-full px-3 py-1 font-medium text-white disabled:opacity-40"
                style={{ background: "linear-gradient(135deg, #6366f1, #38bdf8)" }}
              >
                Schedule
              </button>
              <button onClick={() => setScheduleOpen(false)} className="text-white/40 hover:text-white/80">
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showEmoji && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-16 left-2 z-10"
          >
            <EmojiPicker onEmojiClick={onEmojiClick} theme={theme} />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center gap-1.5">
        <motion.button
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowEmoji((s) => !s)}
          title="Emoji"
          className="flex h-9 w-9 items-center justify-center rounded-full text-white/50 transition hover:bg-white/10 hover:text-white"
        >
          <Smile size={18} />
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => fileInputRef.current.click()}
          title="Attach file"
          disabled={uploading}
          className="flex h-9 w-9 items-center justify-center rounded-full text-white/50 transition hover:bg-white/10 hover:text-white disabled:opacity-40"
        >
          <Paperclip size={18} />
        </motion.button>
        <input ref={fileInputRef} type="file" className="hidden" onChange={handleFilePick} />

        <motion.button
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setScheduleOpen((s) => !s)}
          title="Schedule message"
          className={`flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-white/10 ${
            scheduleOpen ? "text-indigo-300" : "text-white/50 hover:text-white"
          }`}
        >
          <Clock size={18} />
        </motion.button>

        <input
          value={text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={uploading ? "Uploading..." : "Type a message..."}
          disabled={uploading}
          className="flex-1 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white outline-none placeholder:text-white/30 focus:border-indigo-400/50"
        />

        <VoiceRecorder onRecorded={(blob) => uploadAndSend(blob, "voice")} onCancel={() => {}} />

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={submitText}
          disabled={!text.trim()}
          className="flex h-9 w-9 items-center justify-center rounded-full text-white shadow-lg transition disabled:opacity-30"
          style={{ background: "linear-gradient(135deg, #6366f1, #38bdf8)" }}
        >
          <Send size={15} />
        </motion.button>
      </div>
    </div>
  );
}
