import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, Phone, Video, ArrowLeft } from "lucide-react";
import api from "../api/axios.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useSocket } from "../context/SocketContext.jsx";
import { useCall } from "../context/CallContext.jsx";
import Avatar from "./Avatar.jsx";
import MessageBubble from "./MessageBubble.jsx";
import MessageInput from "./MessageInput.jsx";
import TypingIndicator from "./TypingIndicator.jsx";
import HeartBurst, { isHeartOnlyMessage } from "./HeartBurst.jsx";
import { MoodBadge } from "./MoodBubble.jsx";
import ForwardModal from "./ForwardModal.jsx";
import ChatOptionsMenu from "./ChatOptionsMenu.jsx";
import SmartReplies from "./SmartReplies.jsx";

export default function ChatWindow({ friend, friends, presence, mood, onBack, onRelationshipChanged }) {
  const { user } = useAuth();
  const { socket } = useSocket();
  const { startCall, callStatus } = useCall();
  const [messages, setMessages] = useState([]);
  const [replyTo, setReplyTo] = useState(null);
  const [forwardingMessage, setForwardingMessage] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [heartBurstKey, setHeartBurstKey] = useState(0);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const bottomRef = useRef(null);
  const messageInputRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const shouldAutoScrollRef = useRef(true);

  // Load conversation history whenever the active friend changes. Only the
  // most recent page loads at first for a fast open; older messages load
  // in as the person scrolls up (see loadOlderMessages below), so even a
  // conversation with thousands of messages stays snappy to open.
  useEffect(() => {
    let cancelled = false;
    setMessages([]);
    setSearchOpen(false);
    setSearchResults(null);
    setLoadingHistory(true);
    setHasMore(true);
    shouldAutoScrollRef.current = true;
    api.get(`/messages/${friend._id}`).then(({ data }) => {
      if (!cancelled) {
        setMessages(data.messages);
        setHasMore(data.messages.length >= 40);
        setLoadingHistory(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [friend._id]);

  const loadOlderMessages = async () => {
    if (loadingOlder || !hasMore || messages.length === 0) return;
    setLoadingOlder(true);
    const container = scrollContainerRef.current;
    const prevScrollHeight = container?.scrollHeight || 0;

    const oldest = messages[0];
    const { data } = await api.get(`/messages/${friend._id}`, {
      params: { before: oldest.createdAt, limit: 40 },
    });

    if (data.messages.length === 0) {
      setHasMore(false);
    } else {
      shouldAutoScrollRef.current = false;
      setMessages((prev) => [...data.messages, ...prev]);
      setHasMore(data.messages.length >= 40);
      // Keep the scroll position steady (don't let loading older messages
      // yank the view) by restoring the same distance from the bottom.
      requestAnimationFrame(() => {
        if (container) {
          container.scrollTop = container.scrollHeight - prevScrollHeight;
        }
      });
    }
    setLoadingOlder(false);
  };

  const handleScroll = () => {
    const container = scrollContainerRef.current;
    if (container && container.scrollTop < 80) {
      loadOlderMessages();
    }
  };

  // Mark as seen when opening / receiving new messages while window is active
  useEffect(() => {
    socket?.emit("message:seen", { friendId: friend._id });
  }, [friend._id, messages.length, socket]);

  useEffect(() => {
    if (shouldAutoScrollRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    shouldAutoScrollRef.current = true;
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
    // The confirmation itself now happens in MessageBubble's own dialog,
    // so by the time this runs the user has already confirmed. Since only
    // the sender can trigger this (gated in MessageBubble), it always
    // deletes for everyone - matching the simple, familiar delete flow.
    await api.patch(`/messages/${message._id}/delete`, { forEveryone: true });
    socket?.emit("message:delete", { messageId: message._id, receiverId: friend._id, forEveryone: true });
    setMessages((prev) =>
      prev.map((m) => (m._id === message._id ? { ...m, deletedForEveryone: true } : m))
    );
  };

  const handleReact = (message, emoji) => {
    socket?.emit("message:react", { messageId: message._id, receiverId: friend._id, emoji });
  };

  const handleForward = (message) => {
    setForwardingMessage(message);
  };

  const sendForward = (targetFriendId) => {
    if (!forwardingMessage) return;
    socket?.emit("message:send", {
      receiverId: targetFriendId,
      type: forwardingMessage.type,
      text: forwardingMessage.text,
      fileUrl: forwardingMessage.fileUrl,
      fileName: forwardingMessage.fileName,
      fileSize: forwardingMessage.fileSize,
    });
    setForwardingMessage(null);
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
    <div className="flex h-full min-w-0 flex-col">
      {/* Header */}
      <div className="relative z-20 flex items-center justify-between border-b border-white/10 bg-white/[0.03] px-3 py-3 backdrop-blur-xl">
        <div className="flex min-w-0 items-center gap-2">
          {onBack && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onBack}
              title="Back"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white/60 transition hover:bg-white/10 hover:text-white md:hidden"
            >
              <ArrowLeft size={19} />
            </motion.button>
          )}
          <Avatar user={{ ...friend, isOnline }} size={40} showStatus />
          <div className="min-w-0">
            <p className="truncate font-medium text-white">
              {friend.username}
              <MoodBadge mood={mood} />
            </p>
            <p className="text-xs text-white/40">
              <AnimatePresence mode="wait">
                <motion.span
                  key={isOnline ? "online" : "offline"}
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  transition={{ duration: 0.15 }}
                >
                  {isOnline ? "Online" : "Offline"}
                </motion.span>
              </AnimatePresence>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => startCall(friend, "audio")}
            disabled={callStatus !== "idle"}
            title="Voice call"
            className="flex h-9 w-9 items-center justify-center rounded-full text-white/50 transition hover:bg-white/10 hover:text-white disabled:opacity-30"
          >
            <Phone size={16} />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => startCall(friend, "video")}
            disabled={callStatus !== "idle"}
            title="Video call"
            className="flex h-9 w-9 items-center justify-center rounded-full text-white/50 transition hover:bg-white/10 hover:text-white disabled:opacity-30"
          >
            <Video size={17} />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setSearchOpen((s) => !s)}
            title="Search messages"
            className="flex h-9 w-9 items-center justify-center rounded-full text-white/50 transition hover:bg-white/10 hover:text-white"
          >
            <Search size={17} />
          </motion.button>
          <ChatOptionsMenu
            friend={friend}
            onChatCleared={() => setMessages([])}
            onRelationshipChanged={onRelationshipChanged}
          />
        </div>
      </div>

      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-b border-white/10 bg-white/[0.03] backdrop-blur-xl"
          >
            <div className="flex items-center gap-2 px-4 py-2">
              <input
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && runSearch()}
                placeholder="Search in conversation..."
                className="flex-1 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white outline-none placeholder:text-white/30 focus:border-indigo-400/50"
              />
              <button onClick={runSearch} className="text-sm font-medium text-indigo-300">
                Search
              </button>
              {searchResults && (
                <button
                  onClick={() => {
                    setSearchResults(null);
                    setSearchQuery("");
                  }}
                  className="text-white/40 hover:text-white/70"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="relative min-w-0 flex-1 overflow-y-auto py-3"
      >
        <HeartBurst burstKey={heartBurstKey} />

        {loadingOlder && (
          <div className="flex justify-center py-2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-400/30 border-t-indigo-400" />
          </div>
        )}

        {loadingHistory ? (
          <MessagesSkeleton />
        ) : displayList.length === 0 ? (
          <EmptyConversation name={friend.username} />
        ) : (
          <AnimatePresence initial={false}>
            {displayList.map((m) => (
              <motion.div
                key={m._id}
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
              >
                <MessageBubble
                  message={m}
                  isOwn={(m.sender?._id || m.sender) === user._id}
                  onReply={setReplyTo}
                  onDelete={handleDelete}
                  onReact={handleReact}
                  onForward={handleForward}
                  currentUserId={user._id}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        )}
        <div ref={bottomRef} />
      </div>

      <AnimatePresence>{isTyping && <TypingIndicator username={friend.username} />}</AnimatePresence>

      <SmartReplies
        friendId={friend._id}
        lastMessage={messages[messages.length - 1]}
        currentUserId={user._id}
        onSelect={(text) => messageInputRef.current?.insertText(text)}
      />

      <MessageInput
        ref={messageInputRef}
        onSend={send}
        onSchedule={scheduleSend}
        onTyping={handleTypingChange}
        replyTo={replyTo}
        onCancelReply={() => setReplyTo(null)}
      />

      <AnimatePresence>
        {forwardingMessage && (
          <ForwardModal
            message={forwardingMessage}
            friends={(friends || []).filter((f) => f._id !== friend._id)}
            onSend={sendForward}
            onClose={() => setForwardingMessage(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function EmptyConversation({ name }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center"
    >
      <div className="mb-2 flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-white/5 text-2xl">
        👋
      </div>
      <p className="font-medium text-white/70">Say hello to {name}!</p>
      <p className="max-w-xs text-sm text-white/35">No messages yet — send the first one to start the conversation.</p>
    </motion.div>
  );
}

function MessagesSkeleton() {
  const widths = ["40%", "55%", "30%", "60%"];
  return (
    <div className="flex flex-col gap-3 px-4 py-2">
      {widths.map((w, i) => (
        <div key={i} className={`flex ${i % 2 === 0 ? "justify-start" : "justify-end"}`}>
          <div
            className="h-9 animate-pulse rounded-2xl bg-white/[0.06]"
            style={{ width: w }}
          />
        </div>
      ))}
    </div>
  );
}
