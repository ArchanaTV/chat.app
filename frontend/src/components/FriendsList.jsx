import { formatDistanceToNow } from "date-fns";
import Avatar from "./Avatar.jsx";
import { MoodBadge } from "./MoodBubble.jsx";

export default function FriendsList({ friends, activeFriend, onSelect, unreadCounts, presence, moods }) {
  if (friends.length === 0) {
    return <p className="p-3 text-sm text-gray-400">No friends yet. Search above to add some!</p>;
  }

  return (
    <div className="space-y-1 p-2">
      {friends.map((friend) => {
        const live = presence[friend._id] || {};
        const isOnline = live.isOnline ?? friend.isOnline;
        const lastSeen = live.lastSeen ?? friend.lastSeen;
        const unread = unreadCounts[friend._id] || 0;
        const mood = moods?.[friend._id] ?? friend.mood;

        return (
          <button
            key={friend._id}
            onClick={() => onSelect(friend)}
            className={`flex w-full items-center gap-3 rounded-xl p-2 text-left transition ${
              activeFriend?._id === friend._id
                ? "bg-brand-100 dark:bg-brand-700/30"
                : "hover:bg-gray-100 dark:hover:bg-gray-800"
            }`}
          >
            <Avatar user={{ ...friend, isOnline }} size={44} showStatus />
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">
                {friend.username}
                <MoodBadge mood={mood} />
              </p>
              <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                {isOnline ? "Online" : lastSeen ? `Last seen ${formatDistanceToNow(new Date(lastSeen), { addSuffix: true })}` : "Offline"}
              </p>
            </div>
            {unread > 0 && (
              <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-brand-600 px-1 text-xs font-medium text-white">
                {unread}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
