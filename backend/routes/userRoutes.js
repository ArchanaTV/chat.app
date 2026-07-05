import express from "express";
import User from "../models/User.js";
import { protect } from "../middleware/auth.js";
import { uploadAvatar } from "../utils/upload.js";

const router = express.Router();

// PUT /api/users/me - edit profile (username, bio)
router.put("/me", protect, async (req, res) => {
  try {
    const { username, bio, mood } = req.body;
    const update = {};
    if (username) update.username = username;
    if (bio !== undefined) update.bio = bio;
    if (mood !== undefined) update.mood = mood;

    if (username) {
      const taken = await User.findOne({ username, _id: { $ne: req.userId } });
      if (taken) return res.status(409).json({ message: "Username already taken" });
    }

    const user = await User.findByIdAndUpdate(req.userId, update, { new: true });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: "Failed to update profile", error: err.message });
  }
});

// POST /api/users/me/avatar - upload profile picture
router.post("/me/avatar", protect, uploadAvatar.single("avatar"), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "No file uploaded" });
  const avatarUrl = `/uploads/avatars/${req.file.filename}`;
  const user = await User.findByIdAndUpdate(req.userId, { avatarUrl }, { new: true });
  res.json({ user });
});

// GET /api/users/search?q=term
router.get("/search", protect, async (req, res) => {
  const { q } = req.query;
  if (!q || q.trim().length === 0) return res.json({ users: [] });
  const users = await User.find({
    username: { $regex: q, $options: "i" },
    _id: { $ne: req.userId },
  }).limit(20);
  res.json({ users });
});

// GET /api/users/:id - public profile
router.get("/:id", protect, async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json({ user });
});

export default router;
