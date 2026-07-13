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
          className="flex h-full w-full items-center justify-center rounded-full font-semibold text-white"
          style={{ fontSize: size * 0.35, background: "linear-gradient(135deg, var(--accent-from), var(--accent-to))" }}
        >
          {initials}
        </div>
      )}
      {showStatus && (
        <span
          className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-[#0a0e1f] ${
            user?.isOnline ? "bg-green-500" : "bg-gray-500"
          }`}
        />
      )}
    </div>
  );
}
