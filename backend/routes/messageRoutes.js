import express from "express";
import mongoose from "mongoose";
import Message, { buildConversationId } from "../models/Message.js";
import { protect } from "../middleware/auth.js";
import { uploadMedia } from "../utils/upload.js";

const router = express.Router();

// GET /api/messages/:friendId - conversation history
// Loads the full conversation by default (up to a generous cap) so no messages
// disappear as a conversation grows. `before`/`limit` are still supported for
// older-message pagination if a conversation gets very long.
router.get("/:friendId", protect, async (req, res) => {
  const conversationId = buildConversationId(req.userId, req.params.friendId);
  const { before, limit = 40 } = req.query;

  const query = {
    conversationId,
    deletedFor: { $ne: req.userId },
    delivered: true, // hide not-yet-due scheduled messages
  };
  if (before) query.createdAt = { $lt: new Date(before) };

  const messages = await Message.find(query)
    .sort({ createdAt: -1 })
    .limit(Number(limit))
    .populate("replyTo");

  res.json({ messages: messages.reverse() });
});

// POST /api/messages/schedule - schedule a message for future delivery
router.post("/schedule", protect, async (req, res) => {
  try {
    const { receiverId, type = "text", text = "", fileUrl = "", fileName = "", fileSize = 0, scheduledFor } = req.body;
    if (!scheduledFor) return res.status(400).json({ message: "scheduledFor is required" });

    const when = new Date(scheduledFor);
    if (Number.isNaN(when.getTime()) || when <= new Date()) {
      return res.status(400).json({ message: "scheduledFor must be a valid future date/time" });
    }

    const conversationId = buildConversationId(req.userId, receiverId);
    const message = await Message.create({
      sender: req.userId,
      receiver: receiverId,
      conversationId,
      type,
      text,
      fileUrl,
      fileName,
      fileSize,
      delivered: false,
      scheduledFor: when,
    });

    res.status(201).json({ message });
  } catch (err) {
    res.status(500).json({ message: "Failed to schedule message", error: err.message });
  }
});

// GET /api/messages/scheduled/:friendId - list my pending scheduled messages to a friend
router.get("/scheduled/:friendId", protect, async (req, res) => {
  const conversationId = buildConversationId(req.userId, req.params.friendId);
  const scheduled = await Message.find({
    conversationId,
    sender: req.userId,
    delivered: false,
    scheduledFor: { $ne: null },
  }).sort({ scheduledFor: 1 });
  res.json({ scheduled });
});

// DELETE /api/messages/scheduled/:id - cancel a pending scheduled message
router.delete("/scheduled/:id", protect, async (req, res) => {
  const message = await Message.findById(req.params.id);
  if (!message || message.sender.toString() !== req.userId) {
    return res.status(404).json({ message: "Scheduled message not found" });
  }
  if (message.delivered) return res.status(409).json({ message: "Already delivered" });
  await message.deleteOne();
  res.json({ message: "Cancelled" });
});

// PATCH /api/messages/:id/react - toggle an emoji reaction on a message
router.patch("/:id/react", protect, async (req, res) => {
  const { emoji } = req.body;
  if (!emoji) return res.status(400).json({ message: "emoji is required" });

  const message = await Message.findById(req.params.id);
  if (!message) return res.status(404).json({ message: "Message not found" });

  const existingIndex = message.reactions.findIndex(
    (r) => r.user.toString() === req.userId && r.emoji === emoji
  );
  if (existingIndex >= 0) {
    message.reactions.splice(existingIndex, 1); // toggle off
  } else {
    message.reactions.push({ emoji, user: req.userId });
  }
  await message.save();
  res.json({ message });
});
router.get("/:friendId/search", protect, async (req, res) => {
  const { q } = req.query;
  const conversationId = buildConversationId(req.userId, req.params.friendId);
  const messages = await Message.find({
    conversationId,
    text: { $regex: q, $options: "i" },
    deletedFor: { $ne: req.userId },
  }).sort({ createdAt: -1 });
  res.json({ messages });
});

// POST /api/messages/upload - upload media/file, returns URL to attach to a socket message
router.post("/upload", protect, uploadMedia.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "No file uploaded" });
  res.json({
    fileUrl: `/uploads/media/${req.file.filename}`,
    fileName: req.file.originalname,
    fileSize: req.file.size,
    mimeType: req.file.mimetype,
  });
});

// PATCH /api/messages/:id/delete - delete for me / everyone
router.patch("/:id/delete", protect, async (req, res) => {
  const { forEveryone } = req.body;
  const message = await Message.findById(req.params.id);
  if (!message) return res.status(404).json({ message: "Message not found" });

  if (forEveryone) {
    if (message.sender.toString() !== req.userId) {
      return res.status(403).json({ message: "Only the sender can delete for everyone" });
    }
    message.deletedForEveryone = true;
    message.text = "";
    message.fileUrl = "";
  } else {
    message.deletedFor.addToSet(req.userId);
  }
  await message.save();
  res.json({ message });
});

// GET /api/messages/unread/count - total unread count grouped by friend
router.get("/unread/count", protect, async (req, res) => {
  const unread = await Message.aggregate([
    { $match: { receiver: new mongoose.Types.ObjectId(req.userId), seen: false } },
    { $group: { _id: "$sender", count: { $sum: 1 } } },
  ]);
  res.json({ unread });
});

// DELETE /api/messages/:friendId/clear - clear the whole conversation, for
// me only. The other person keeps their own copy of the history, and we
// stay friends - this only hides messages from my own view.
router.delete("/:friendId/clear", protect, async (req, res) => {
  const conversationId = buildConversationId(req.userId, req.params.friendId);
  await Message.updateMany(
    { conversationId },
    { $addToSet: { deletedFor: req.userId } }
  );
  res.json({ message: "Chat cleared" });
});

export default router;
