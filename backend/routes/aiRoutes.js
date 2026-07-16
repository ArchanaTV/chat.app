import express from "express";
import { protect } from "../middleware/auth.js";
import { askGemini } from "../utils/gemini.js";
import Message, { buildConversationId } from "../models/Message.js";

const router = express.Router();

const WRITING_MODES = {
  improve: "Improve the writing quality of this message while keeping the same meaning and roughly the same length.",
  grammar: "Fix any spelling and grammar mistakes in this message. Keep the tone and meaning exactly the same.",
  rewrite: "Rewrite this message in a different way, keeping the same meaning.",
  professional: "Rewrite this message in a professional, polished tone.",
  friendly: "Rewrite this message in a warm, friendly, casual tone.",
  shorten: "Make this message shorter and more concise, keeping the key meaning.",
  expand: "Expand this message with a bit more detail, keeping the same tone.",
  emojis: "Rewrite this message adding a few tasteful, relevant emojis. Don't overdo it.",
};

// POST /api/ai/writing-assist - improve/fix/rewrite a draft message before sending
router.post("/writing-assist", protect, async (req, res) => {
  try {
    const { text, mode } = req.body;
    if (!text || !text.trim()) return res.status(400).json({ message: "No text provided" });
    const instruction = WRITING_MODES[mode] || WRITING_MODES.improve;

    const prompt = `${instruction}\n\nMessage: """${text}"""\n\nRespond with ONLY the rewritten message text, no explanation, no quotes around it.`;
    const result = await askGemini(prompt);
    res.json({ result: result.trim() });
  } catch (err) {
    res.status(500).json({ message: "AI request failed", error: err.message });
  }
});

// POST /api/ai/smart-replies - suggest a few short contextual replies
router.post("/smart-replies", protect, async (req, res) => {
  try {
    const { friendId } = req.body;
    if (!friendId) return res.status(400).json({ message: "friendId is required" });

    const conversationId = buildConversationId(req.userId, friendId);
    const recent = await Message.find({ conversationId, type: { $in: ["text", "emoji"] } })
      .sort({ createdAt: -1 })
      .limit(8)
      .lean();

    if (recent.length === 0) return res.json({ replies: [] });

    const transcript = recent
      .reverse()
      .map((m) => `${m.sender.toString() === req.userId ? "Me" : "Them"}: ${m.text}`)
      .join("\n");

    const prompt = `Here is a recent chat conversation:\n\n${transcript}\n\nSuggest 3 short, natural reply options I (the "Me" speaker) could send next, replying to the last message. Keep each under 12 words. Return ONLY valid JSON in this exact shape, no other text: {"replies": ["...", "...", "..."]}`;

    const result = await askGemini(prompt, { json: true });
    const parsed = JSON.parse(result);
    res.json({ replies: Array.isArray(parsed.replies) ? parsed.replies.slice(0, 3) : [] });
  } catch (err) {
    res.status(500).json({ message: "AI request failed", error: err.message });
  }
});

export default router;
