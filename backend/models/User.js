import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true, minlength: 3, maxlength: 20 },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    password: { type: String, required: true, select: false }, // hashed with bcrypt, never returned by default
    bio: { type: String, default: "", maxlength: 160 },
    avatarUrl: { type: String, default: "" },
    mood: { type: String, enum: ["happy", "sleepy", "chill", null], default: null },
    friends: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    // Users this person has blocked - blocking prevents messaging and
    // calling in both directions, checked whichever way the relationship runs.
    blockedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    isOnline: { type: Boolean, default: false },
    lastSeen: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

userSchema.set("toJSON", {
  transform: (_doc, ret) => {
    delete ret.password;
    return ret;
  },
});

export default mongoose.model("User", userSchema);
