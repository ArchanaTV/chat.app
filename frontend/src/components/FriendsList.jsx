import { formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";
import { Users } from "lucide-react";
import Avatar from "./Avatar.jsx";
import { MoodBadge } from "./MoodBubble.jsx";

export default function FriendsList({ friends, activeFriend, onSelect, unreadCounts, presence, moods }) {
  if (friends.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="m-3 flex flex-col items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400/20 to-sky-400/20">
          <Users size={22} className="text-indigo-300" />
        </div>
        <p className="text-sm font-medium text-white/80">No friends yet</p>
        <p className="text-xs text-white/40">Search above to find people and start chatting</p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-1 p-2">
      {friends.map((friend, i) => {
        const live = presence[friend._id] || {};
        const isOnline = live.isOnline ?? friend.isOnline;
        const lastSeen = live.lastSeen ?? friend.lastSeen;
        const unread = unreadCounts[friend._id] || 0;
        const mood = moods?.[friend._id] ?? friend.mood;
        const isActive = activeFriend?._id === friend._id;

        return (
          <motion.button
            key={friend._id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: Math.min(i * 0.03, 0.3), duration: 0.2 }}
            whileHover={{ scale: 1.015 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect(friend)}
            className={`relative flex w-full items-center gap-3 rounded-xl p-2 text-left transition ${
              isActive ? "bg-white/10" : "hover:bg-white/5"
            }`}
          >
            {isActive && (
              <motion.span
                layoutId="friend-active-glow"
                className="absolute inset-0 rounded-xl border border-indigo-400/30"
                transition={{ type: "spring", stiffness: 400, damping: 32 }}
              />
            )}
            <Avatar user={{ ...friend, isOnline }} size={44} showStatus />
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-white">
                {friend.username}
                <MoodBadge mood={mood} />
              </p>
              <p className="truncate text-xs text-white/40">
                {isOnline ? "Online" : lastSeen ? `Last seen ${formatDistanceToNow(new Date(lastSeen), { addSuffix: true })}` : "Offline"}
              </p>
            </div>
            {unread > 0 && (
              <motion.span
                key={unread}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 to-sky-400 px-1 text-xs font-medium text-white shadow-lg shadow-indigo-500/30"
              >
                {unread}
              </motion.span>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
