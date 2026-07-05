import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import Avatar from "./Avatar.jsx";
import ThemeToggle from "./ThemeToggle.jsx";
import SearchUsers from "./SearchUsers.jsx";
import FriendRequests from "./FriendRequests.jsx";
import FriendsList from "./FriendsList.jsx";
import ProfileEdit from "./ProfileEdit.jsx";
import Logo from "./Logo.jsx";

const TABS = [
  { id: "friends", label: "Friends" },
  { id: "search", label: "Find" },
  { id: "requests", label: "Requests" },
];

export default function Sidebar({ friends, activeFriend, onSelect, unreadCounts, presence, moods, requestCount, onFriendAdded }) {
  const { user, logout } = useAuth();
  const [tab, setTab] = useState("friends");
  const [editOpen, setEditOpen] = useState(false);

  return (
    <div className="flex h-full w-full flex-col border-r border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 md:w-80">
      <div className="flex items-center justify-center border-b border-gray-200 py-2 dark:border-gray-800">
        <Logo size={28} />
      </div>

      {/* Profile header */}
      <div className="flex items-center justify-between border-b border-gray-200 p-3 dark:border-gray-800">
        <button onClick={() => setEditOpen(true)} className="flex items-center gap-2">
          <Avatar user={user} size={38} />
          <span className="font-medium">{user.username}</span>
        </button>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button onClick={logout} title="Logout" className="text-lg">
            🚪
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-800">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`relative flex-1 py-2 text-sm font-medium transition ${
              tab === t.id ? "text-brand-600" : "text-gray-400 hover:text-gray-600"
            }`}
          >
            {t.label}
            {t.id === "requests" && requestCount > 0 && (
              <span className="ml-1 rounded-full bg-brand-600 px-1.5 py-0.5 text-[10px] text-white">{requestCount}</span>
            )}
            {tab === t.id && <span className="absolute bottom-0 left-0 h-0.5 w-full bg-brand-600" />}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {tab === "friends" && (
          <FriendsList friends={friends} activeFriend={activeFriend} onSelect={onSelect} unreadCounts={unreadCounts} presence={presence} moods={moods} />
        )}
        {tab === "search" && <SearchUsers />}
        {tab === "requests" && <FriendRequests onAccepted={onFriendAdded} />}
      </div>

      {editOpen && <ProfileEdit onClose={() => setEditOpen(false)} />}
    </div>
  );
}
