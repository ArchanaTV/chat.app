import express from "express";
import FriendRequest from "../models/FriendRequest.js";
import User from "../models/User.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// POST /api/friends/request/:userId - send a friend request
router.post("/request/:userId", protect, async (req, res) => {
  try {
    const to = req.params.userId;
    if (to === req.userId) return res.status(400).json({ message: "Cannot friend yourself" });

    const targetUser = await User.findById(req.userId);
    if (targetUser.friends.includes(to)) {
      return res.status(409).json({ message: "Already friends" });
    }

    const existing = await FriendRequest.findOne({
      $or: [
        { from: req.userId, to },
        { from: to, to: req.userId },
      ],
      status: "pending",
    });
    if (existing) return res.status(409).json({ message: "Friend request already pending" });

    const request = await FriendRequest.create({ from: req.userId, to });
    const populated = await request.populate("from to", "username avatarUrl");
    res.status(201).json({ request: populated });
  } catch (err) {
    res.status(500).json({ message: "Failed to send request", error: err.message });
  }
});

// POST /api/friends/accept/:requestId
router.post("/accept/:requestId", protect, async (req, res) => {
  try {
    const request = await FriendRequest.findById(req.params.requestId);
    if (!request || request.to.toString() !== req.userId) {
      return res.status(404).json({ message: "Request not found" });
    }
    request.status = "accepted";
    await request.save();

    await User.findByIdAndUpdate(request.from, { $addToSet: { friends: request.to } });
    await User.findByIdAndUpdate(request.to, { $addToSet: { friends: request.from } });

    res.json({ request });
  } catch (err) {
    res.status(500).json({ message: "Failed to accept request", error: err.message });
  }
});

// POST /api/friends/reject/:requestId
router.post("/reject/:requestId", protect, async (req, res) => {
  try {
    const request = await FriendRequest.findById(req.params.requestId);
    if (!request || request.to.toString() !== req.userId) {
      return res.status(404).json({ message: "Request not found" });
    }
    request.status = "rejected";
    await request.save();
    res.json({ request });
  } catch (err) {
    res.status(500).json({ message: "Failed to reject request", error: err.message });
  }
});

// GET /api/friends/requests - incoming pending requests
router.get("/requests", protect, async (req, res) => {
  const requests = await FriendRequest.find({ to: req.userId, status: "pending" }).populate(
    "from",
    "username avatarUrl isOnline lastSeen mood"
  );
  res.json({ requests });
});

// GET /api/friends - friends list
router.get("/", protect, async (req, res) => {
  const user = await User.findById(req.userId).populate(
    "friends",
    "username avatarUrl isOnline lastSeen mood privacy"
  );
  // Respect each friend's own "show last seen" preference - if they've
  // turned it off, we simply don't send that field to anyone.
  const friends = user.friends.map((f) => {
    const obj = f.toObject();
    if (obj.privacy?.showLastSeen === false) obj.lastSeen = null;
    delete obj.privacy;
    return obj;
  });
  res.json({ friends });
});

// DELETE /api/friends/:userId - unfriend
router.delete("/:userId", protect, async (req, res) => {
  await User.findByIdAndUpdate(req.userId, { $pull: { friends: req.params.userId } });
  await User.findByIdAndUpdate(req.params.userId, { $pull: { friends: req.userId } });
  res.json({ message: "Unfriended" });
});

// POST /api/friends/block/:userId - block a user (also unfriends both ways)
router.post("/block/:userId", protect, async (req, res) => {
  const targetId = req.params.userId;
  await User.findByIdAndUpdate(req.userId, {
    $addToSet: { blockedUsers: targetId },
    $pull: { friends: targetId },
  });
  await User.findByIdAndUpdate(targetId, { $pull: { friends: req.userId } });
  res.json({ message: "Blocked" });
});

// POST /api/friends/unblock/:userId
router.post("/unblock/:userId", protect, async (req, res) => {
  await User.findByIdAndUpdate(req.userId, { $pull: { blockedUsers: req.params.userId } });
  res.json({ message: "Unblocked" });
});

// GET /api/friends/blocked - list of users I've blocked
router.get("/blocked", protect, async (req, res) => {
  const user = await User.findById(req.userId).populate("blockedUsers", "username avatarUrl");
  res.json({ blocked: user.blockedUsers });
});

export default router;
