import express from "express";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import { signToken, protect } from "../middleware/auth.js";

const router = express.Router();

// POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const existing = await User.findOne({ $or: [{ email }, { username }] });
    if (existing) {
      return res.status(409).json({ message: "Username or email already in use" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);

    const user = await User.create({ username, email, password: hashed });
    const token = signToken(user._id);

    res.status(201).json({ token, user });
  } catch (err) {
    res.status(500).json({ message: "Registration failed", error: err.message });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { emailOrUsername, password } = req.body;
    const user = await User.findOne({
      $or: [{ email: emailOrUsername }, { username: emailOrUsername }],
    }).select("+password");

    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: "Invalid credentials" });

    user.isOnline = true;
    await user.save();

    const token = signToken(user._id);
    res.json({ token, user });
  } catch (err) {
    res.status(500).json({ message: "Login failed", error: err.message });
  }
});

// POST /api/auth/logout
router.post("/logout", protect, async (req, res) => {
  await User.findByIdAndUpdate(req.userId, { isOnline: false, lastSeen: new Date() });
  res.json({ message: "Logged out" });
});

// GET /api/auth/me
router.get("/me", protect, async (req, res) => {
  const user = await User.findById(req.userId);
  res.json({ user });
});

export default router;
