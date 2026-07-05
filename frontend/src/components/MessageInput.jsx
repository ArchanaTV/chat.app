import { useRef, useState } from "react";
import EmojiPicker from "emoji-picker-react";
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
    <div className="relative border-t border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
      {replyTo && (
        <div className="mb-2 flex items-center justify-between rounded-lg bg-gray-100 px-3 py-1.5 text-xs dark:bg-gray-800">
          <span className="truncate">
            Replying to: <span className="font-medium">{replyTo.text || `[${replyTo.type}]`}</span>
          </span>
          <button onClick={onCancelReply} className="ml-2 text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>
      )}

      {scheduleOpen && (
        <div className="mb-2 flex flex-wrap items-center gap-2 rounded-lg bg-brand-50 px-3 py-2 text-xs dark:bg-brand-700/20">
          <span className="font-medium">Schedule this message for:</span>
          <input
            type="datetime-local"
            min={minDateTime}
            value={scheduleTime}
            onChange={(e) => setScheduleTime(e.target.value)}
            className="rounded border border-gray-300 bg-white px-2 py-1 text-xs dark:border-gray-700 dark:bg-gray-800"
          />
          <button
            onClick={submitSchedule}
            disabled={!text.trim() || !scheduleTime}
            className="rounded-full bg-brand-600 px-3 py-1 font-medium text-white disabled:opacity-40"
          >
            Schedule
          </button>
          <button onClick={() => setScheduleOpen(false)} className="text-gray-400 hover:text-gray-600">
            Cancel
          </button>
        </div>
      )}

      {showEmoji && (
        <div className="absolute bottom-16 left-2 z-10">
          <EmojiPicker onEmojiClick={onEmojiClick} theme={theme} />
        </div>
      )}

      <div className="flex items-center gap-2">
        <button onClick={() => setShowEmoji((s) => !s)} title="Emoji" className="text-xl">
          😊
        </button>

        <button onClick={() => fileInputRef.current.click()} title="Attach file" className="text-xl" disabled={uploading}>
          📎
        </button>
        <input ref={fileInputRef} type="file" className="hidden" onChange={handleFilePick} />

        <button
          onClick={() => setScheduleOpen((s) => !s)}
          title="Schedule message"
          className={`text-xl ${scheduleOpen ? "text-brand-600" : ""}`}
        >
          🕐
        </button>

        <input
          value={text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={uploading ? "Uploading..." : "Type a message..."}
          disabled={uploading}
          className="flex-1 rounded-full border border-gray-300 bg-transparent px-4 py-2 text-sm outline-none focus:border-brand-500 dark:border-gray-700"
        />

        <VoiceRecorder onRecorded={(blob) => uploadAndSend(blob, "voice")} onCancel={() => {}} />

        <button
          onClick={submitText}
          disabled={!text.trim()}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 text-white transition hover:bg-brand-700 disabled:opacity-40"
        >
          ➤
        </button>
      </div>
    </div>
  );
}
