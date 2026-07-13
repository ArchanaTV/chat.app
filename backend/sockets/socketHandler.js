import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Message, { buildConversationId } from "../models/Message.js";

// Two people can only message or call each other if they're friends AND
// neither has blocked the other. This is the real enforcement point -
// unfriending or blocking someone actually cuts off messaging/calling,
// not just hides the button in the UI.
async function canInteract(userAId, userBId) {
  const [userA, userB] = await Promise.all([User.findById(userAId), User.findById(userBId)]);
  if (!userA || !userB) return false;
  const areFriends = userA.friends.some((f) => f.toString() === userBId);
  const blocked =
    userA.blockedUsers.some((b) => b.toString() === userBId) ||
    userB.blockedUsers.some((b) => b.toString() === userAId);
  return areFriends && !blocked;
}

// Maps a userId -> Set of socket ids (a user can have multiple tabs/devices open)
const onlineUsers = new Map();

const addSocket = (userId, socketId) => {
  if (!onlineUsers.has(userId)) onlineUsers.set(userId, new Set());
  onlineUsers.get(userId).add(socketId);
};

const removeSocket = (userId, socketId) => {
  const set = onlineUsers.get(userId);
  if (!set) return false;
  set.delete(socketId);
  if (set.size === 0) {
    onlineUsers.delete(userId);
    return true; // fully offline now
  }
  return false;
};

export const initSocket = (io) => {
  // Authenticate every socket connection using the JWT sent in the handshake
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("No token provided"));
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      next();
    } catch (err) {
      next(new Error("Authentication failed"));
    }
  });

  io.on("connection", async (socket) => {
    const { userId } = socket;
    addSocket(userId, socket.id);
    socket.join(userId); // personal room, used to push events to this user across devices

    await User.findByIdAndUpdate(userId, { isOnline: true });
    io.emit("presence:update", { userId, isOnline: true });

    // ---- Send message ----
    socket.on("message:send", async (payload, ack) => {
      try {
        const { receiverId, type = "text", text = "", fileUrl = "", fileName = "", fileSize = 0, replyTo = null } = payload;

        if (!(await canInteract(userId, receiverId))) {
          ack?.({ status: "error", error: "You can no longer message this person" });
          return;
        }

        const conversationId = buildConversationId(userId, receiverId);

        const message = await Message.create({
          sender: userId,
          receiver: receiverId,
          conversationId,
          type,
          text,
          fileUrl,
          fileName,
          fileSize,
          replyTo,
        });
        const populated = await message.populate([
          { path: "replyTo" },
          { path: "sender", select: "username avatarUrl" },
        ]);

        io.to(receiverId).emit("message:new", populated);
        io.to(userId).emit("message:new", populated); // echo back to sender's other devices
        ack?.({ status: "ok", message: populated });
      } catch (err) {
        ack?.({ status: "error", error: err.message });
      }
    });

    // ---- Typing indicator ----
    socket.on("typing:start", async ({ receiverId }) => {
      const me = await User.findById(userId).select("privacy").lean();
      if (me?.privacy?.showTypingIndicator === false) return;
      io.to(receiverId).emit("typing:update", { userId, isTyping: true });
    });
    socket.on("typing:stop", async ({ receiverId }) => {
      const me = await User.findById(userId).select("privacy").lean();
      if (me?.privacy?.showTypingIndicator === false) return;
      io.to(receiverId).emit("typing:update", { userId, isTyping: false });
    });

    // ---- Read receipts ----
    socket.on("message:seen", async ({ friendId }) => {
      const conversationId = buildConversationId(userId, friendId);
      await Message.updateMany(
        { conversationId, receiver: userId, seen: false },
        { seen: true, seenAt: new Date() }
      );
      // Only tell the sender their message was seen if I have read
      // receipts turned on - the message is still marked seen internally
      // either way (for my own unread counts), just not broadcast to them.
      const me = await User.findById(userId).select("privacy").lean();
      if (me?.privacy?.showReadReceipts === false) return;
      io.to(friendId).emit("message:seenUpdate", { by: userId, conversationId });
    });

    // ---- Reactions ----
    socket.on("message:react", async ({ messageId, receiverId, emoji }) => {
      try {
        const message = await Message.findById(messageId);
        if (!message) return;
        const existingIndex = message.reactions.findIndex(
          (r) => r.user.toString() === userId && r.emoji === emoji
        );
        if (existingIndex >= 0) message.reactions.splice(existingIndex, 1);
        else message.reactions.push({ emoji, user: userId });
        await message.save();

        io.to(receiverId).emit("message:reactionUpdate", { messageId, reactions: message.reactions });
        io.to(userId).emit("message:reactionUpdate", { messageId, reactions: message.reactions });
      } catch (err) {
        // silently ignore malformed reaction events
      }
    });

    // ---- Mood updates (broadcast to everyone; frontend only displays for friends) ----
    socket.on("mood:update", ({ mood }) => {
      io.emit("mood:update", { userId, mood });
    });

    // ---- Voice/video call signaling ----
    // These events just relay WebRTC connection info between the two people
    // on a call; the actual audio/video travels directly between their
    // browsers (peer-to-peer) once the connection is established - the
    // server never sees or touches the media itself.
    socket.on("call:invite", async ({ to, callType, offer }) => {
      if (!(await canInteract(userId, to))) {
        socket.emit("call:rejected", { from: to, reason: "not-allowed" });
        return;
      }
      io.to(to).emit("call:incoming", { from: userId, callType, offer });
    });

    socket.on("call:answer", ({ to, answer }) => {
      io.to(to).emit("call:answered", { from: userId, answer });
    });

    socket.on("call:ice-candidate", ({ to, candidate }) => {
      io.to(to).emit("call:ice-candidate", { from: userId, candidate });
    });

    socket.on("call:reject", ({ to }) => {
      io.to(to).emit("call:rejected", { from: userId });
    });

    socket.on("call:end", ({ to }) => {
      io.to(to).emit("call:ended", { from: userId });
    });

    socket.on("call:cancel", ({ to }) => {
      io.to(to).emit("call:cancelled", { from: userId });
    });

    // ---- Call log ----
    // Whoever ends/declines a call (the one taking the explicit action) is
    // responsible for logging it - the passive side just reacts to the
    // signaling event and doesn't log its own copy, so each call produces
    // exactly one entry, visible to both people, appearing like a normal
    // chat message in the conversation.
    socket.on("call:log", async ({ to, callType, duration, outcome }) => {
      try {
        const conversationId = buildConversationId(userId, to);
        const message = await Message.create({
          sender: userId,
          receiver: to,
          conversationId,
          type: "call",
          callType,
          callDuration: duration,
          callOutcome: outcome,
        });
        const populated = await message.populate("sender", "username avatarUrl");
        io.to(to).emit("message:new", populated);
        io.to(userId).emit("message:new", populated);
      } catch (err) {
        // Non-critical - a failed log shouldn't crash the call flow
      }
    });

    // ---- Delete message (real-time notify) ----
    socket.on("message:delete", ({ messageId, receiverId, forEveryone }) => {
      io.to(receiverId).emit("message:deleted", { messageId, forEveryone });
      io.to(userId).emit("message:deleted", { messageId, forEveryone });
    });

    // ---- Disconnect ----
    socket.on("disconnect", async () => {
      const fullyOffline = removeSocket(userId, socket.id);
      if (fullyOffline) {
        const lastSeen = new Date();
        await User.findByIdAndUpdate(userId, { isOnline: false, lastSeen });
        io.emit("presence:update", { userId, isOnline: false, lastSeen });
      }
    });
  });
};

// Polls for scheduled messages whose delivery time has arrived and pushes them
// out over sockets, exactly like a normal real-time message. Call this once at
// server startup with the same `io` instance used above.
export const startScheduledMessageWorker = (io, intervalMs = 15000) => {
  setInterval(async () => {
    try {
      const due = await Message.find({ delivered: false, scheduledFor: { $lte: new Date() } });
      for (const message of due) {
        message.delivered = true;
        await message.save();
        const populated = await message.populate([
          { path: "replyTo" },
          { path: "sender", select: "username avatarUrl" },
        ]);
        io.to(message.receiver.toString()).emit("message:new", populated);
        io.to(message.sender.toString()).emit("message:new", populated);
      }
    } catch (err) {
      console.error("Scheduled message worker error:", err.message);
    }
  }, intervalMs);
};
