import { useEffect, useRef, useState } from "react";
import api from "../api/axios.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useSocket } from "../context/SocketContext.jsx";
import Avatar from "./Avatar.jsx";
import MessageBubble from "./MessageBubble.jsx";
import MessageInput from "./MessageInput.jsx";
import TypingIndicator from "./TypingIndicator.jsx";
import HeartBurst, { isHeartOnlyMessage } from "./HeartBurst.jsx";
import { MoodBadge } from "./MoodBubble.jsx";

export default function ChatWindow({ friend, presence, mood }) {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [messages, setMessages] = useState([]);
  const [replyTo, setReplyTo] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [heartBurstKey, setHeartBurstKey] = useState(0);
  const bottomRef = useRef(null);

  // Load conversation history whenever the active friend changes.
  // This always fetches from the database, so the full history (up to the
  // backend's generous cap) is there on every open/reopen/refresh.
  useEffect(() => {
    let cancelled = false;
    setMessages([]);
    setSearchOpen(false);
    setSearchResults(null);
    api.get(`/messages/${friend._id}`).then(({ data }) => {
      if (!cancelled) setMessages(data.messages);
    });
    return () => {
      cancelled = true;
    };
  }, [friend._id]);

  // Mark as seen when opening / receiving new messages while window is active
  useEffect(() => {
    socket?.emit("message:seen", { friendId: friend._id });
  }, [friend._id, messages.length, socket]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!socket) return;

    const handleNew = (message) => {
      const involvesThisConvo =
        (message.sender._id === friend._id || message.sender === friend._id) ||
        message.receiver === friend._id;
      if (!involvesThisConvo) return;

      // New messages are appended, never replacing existing history.
      setMessages((prev) => [...prev, message]);

      if (message.type === "text" && isHeartOnlyMessage(message.text)) {
        setHeartBurstKey((k) => k + 1);
      }
    };

    const handleTyping = ({ userId, isTyping: typing }) => {
      if (userId === friend._id) setIsTyping(typing);
    };

    const handleSeenUpdate = ({ by }) => {
      if (by === friend._id) {
        setMessages((prev) => prev.map((m) => (m.sender === user._id || m.sender?._id === user._id ? { ...m, seen: true } : m)));
      }
    };

    const handleDeleted = ({ messageId, forEveryone }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m._id === messageId
            ? forEveryone
              ? { ...m, deletedForEveryone: true, text: "", fileUrl: "" }
              : null
            : m
        ).filter(Boolean)
      );
    };

    const handleReactionUpdate = ({ messageId, reactions }) => {
      setMessages((prev) => prev.map((m) => (m._id === messageId ? { ...m, reactions } : m)));
    };

    socket.on("message:new", handleNew);
    socket.on("typing:update", handleTyping);
    socket.on("message:seenUpdate", handleSeenUpdate);
    socket.on("message:deleted", handleDeleted);
    socket.on("message:reactionUpdate", handleReactionUpdate);

    return () => {
      socket.off("message:new", handleNew);
      socket.off("typing:update", handleTyping);
      socket.off("message:seenUpdate", handleSeenUpdate);
      socket.off("message:deleted", handleDeleted);
      socket.off("message:reactionUpdate", handleReactionUpdate);
    };
  }, [socket, friend._id, user._id]);

  const send = (payload) => {
    socket?.emit(
      "message:send",
      { ...payload, receiverId: friend._id, replyTo: replyTo?._id || null },
      (res) => {
        if (res?.status === "error") alert("Failed to send message");
      }
    );
    setReplyTo(null);
  };

  const scheduleSend = async (payload, scheduledFor) => {
    try {
      await api.post("/messages/schedule", { ...payload, receiverId: friend._id, scheduledFor });
      alert(`Message scheduled for ${new Date(scheduledFor).toLocaleString()}`);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to schedule message");
    }
  };

  const handleTypingChange = (typing) => {
    socket?.emit(typing ? "typing:start" : "typing:stop", { receiverId: friend._id });
  };

  const handleDelete = async (message) => {
    const forEveryone = confirm("Delete for everyone? (Cancel = delete just for you)");
    await api.patch(`/messages/${message._id}/delete`, { forEveryone });
    socket?.emit("message:delete", { messageId: message._id, receiverId: friend._id, forEveryone });
    setMessages((prev) =>
      prev
        .map((m) => (m._id === message._id ? (forEveryone ? { ...m, deletedForEveryone: true } : null) : m))
        .filter(Boolean)
    );
  };

  const handleReact = (message, emoji) => {
    socket?.emit("message:react", { messageId: message._id, receiverId: friend._id, emoji });
  };

  const runSearch = async () => {
    if (!searchQuery.trim()) return setSearchResults(null);
    const { data } = await api.get(`/messages/${friend._id}/search?q=${encodeURIComponent(searchQuery)}`);
    setSearchResults(data.messages);
  };

  const live = presence[friend._id] || {};
  const isOnline = live.isOnline ?? friend.isOnline;

  const displayList = searchResults ?? messages;

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-center gap-3">
          <Avatar user={{ ...friend, isOnline }} size={40} showStatus />
          <div>
            <p className="font-medium">
              {friend.username}
              <MoodBadge mood={mood} />
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{isOnline ? "Online" : "Offline"}</p>
          </div>
        </div>
        <button onClick={() => setSearchOpen((s) => !s)} title="Search messages" className="text-lg">
          🔍
        </button>
      </div>

      {searchOpen && (
        <div className="flex items-center gap-2 border-b border-gray-200 bg-white px-4 py-2 dark:border-gray-800 dark:bg-gray-900">
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && runSearch()}
            placeholder="Search in conversation..."
            className="flex-1 rounded-full border border-gray-300 bg-transparent px-3 py-1 text-sm outline-none focus:border-brand-500 dark:border-gray-700"
          />
          <button onClick={runSearch} className="text-sm font-medium text-brand-600">
            Search
          </button>
          {searchResults && (
            <button
              onClick={() => {
                setSearchResults(null);
                setSearchQuery("");
              }}
              className="text-sm text-gray-400"
            >
              Clear
            </button>
          )}
        </div>
      )}

      {/* Messages */}
      <div className="relative flex-1 overflow-y-auto bg-gray-50 py-2 dark:bg-gray-950">
        <HeartBurst burstKey={heartBurstKey} />
        {displayList.map((m) => (
          <MessageBubble
            key={m._id}
            message={m}
            isOwn={(m.sender?._id || m.sender) === user._id}
            onReply={setReplyTo}
            onDelete={handleDelete}
            onReact={handleReact}
            currentUserId={user._id}
          />
        ))}
        <div ref={bottomRef} />
      </div>

      {isTyping && <TypingIndicator username={friend.username} />}

      <MessageInput
        onSend={send}
        onSchedule={scheduleSend}
        onTyping={handleTypingChange}
        replyTo={replyTo}
        onCancelReply={() => setReplyTo(null)}
      />
    </div>
  );
}
