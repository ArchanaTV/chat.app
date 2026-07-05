import { resolveMediaUrl } from "../utils/media.js";

export default function Avatar({ user, size = 40, showStatus = false }) {
  const initials = user?.username?.slice(0, 2).toUpperCase() || "?";
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      {user?.avatarUrl ? (
        <img
          src={resolveMediaUrl(user.avatarUrl)}
          alt={user.username}
          className="h-full w-full rounded-full object-cover"
        />
      ) : (
        <div
          className="flex h-full w-full items-center justify-center rounded-full bg-brand-500 font-semibold text-white"
          style={{ fontSize: size * 0.35 }}
        >
          {initials}
        </div>
      )}
      {showStatus && (
        <span
          className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white dark:border-gray-900 ${
            user?.isOnline ? "bg-green-500" : "bg-gray-400"
          }`}
        />
      )}
    </div>
  );
}
