import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    // conversationId is a deterministic pairing of the two user ids, sorted, joined by "_"
    conversationId: { type: String, required: true, index: true },
    type: {
      type: String,
      enum: ["text", "image", "video", "audio", "voice", "document", "emoji"],
      default: "text",
    },
    text: { type: String, default: "" },
    fileUrl: { type: String, default: "" },
    fileName: { type: String, default: "" },
    fileSize: { type: Number, default: 0 },
    replyTo: { type: mongoose.Schema.Types.ObjectId, ref: "Message", default: null },
    seen: { type: Boolean, default: false },
    seenAt: { type: Date, default: null },
    deletedForEveryone: { type: Boolean, default: false },
    deletedFor: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    // Scheduled messages: created immediately but hidden (delivered=false) until
    // a background job flips delivered to true at scheduledFor time.
    scheduledFor: { type: Date, default: null },
    delivered: { type: Boolean, default: true },
    reactions: [
      {
        emoji: { type: String, required: true },
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
      },
    ],
  },
  { timestamps: true }
);

messageSchema.index({ conversationId: 1, createdAt: 1 });

export const buildConversationId = (idA, idB) =>
  [idA.toString(), idB.toString()].sort().join("_");

export default mongoose.model("Message", messageSchema);
