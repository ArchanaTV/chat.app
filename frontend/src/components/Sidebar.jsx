import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import Avatar from "./Avatar.jsx";
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
    <div
      className="flex h-full w-full flex-col border border-white/10 bg-white/[0.04] backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.04] md:w-80 md:rounded-2xl md:shadow-2xl"
      style={{ colorScheme: "dark" }}
    >
      <div className="flex items-center justify-center border-b border-white/10 py-3">
        <Logo size={28} />
      </div>

      {/* Profile header */}
      <div className="flex items-center justify-between border-b border-white/10 p-3">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setEditOpen(true)}
          className="flex items-center gap-2 rounded-xl px-2 py-1 transition hover:bg-white/5"
        >
          <Avatar user={user} size={38} />
          <span className="font-medium text-white">{user.username}</span>
        </motion.button>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <motion.button
            whileHover={{ scale: 1.1, rotate: -8 }}
            whileTap={{ scale: 0.9 }}
            onClick={logout}
            title="Logout"
            className="flex h-9 w-9 items-center justify-center rounded-full text-white/60 transition hover:bg-white/10 hover:text-white"
          >
            <LogOut size={16} />
          </motion.button>
        </div>
      </div>

      {/* Tabs */}
      <div className="relative flex border-b border-white/10">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`relative flex-1 py-2.5 text-sm font-medium transition ${
              tab === t.id ? "text-white" : "text-white/40 hover:text-white/70"
            }`}
          >
            <span className="inline-flex items-center gap-1">
              {t.label}
              {t.id === "requests" && requestCount > 0 && (
                <motion.span
                  key={requestCount}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="rounded-full bg-gradient-to-br from-indigo-400 to-sky-400 px-1.5 py-0.5 text-[10px] text-white"
                >
                  {requestCount}
                </motion.span>
              )}
            </span>
            {tab === t.id && (
              <motion.span
                layoutId="sidebar-tab-underline"
                className="absolute bottom-0 left-0 h-0.5 w-full bg-gradient-to-r from-indigo-400 to-sky-400"
                transition={{ type: "spring", stiffness: 400, damping: 32 }}
              />
            )}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
          >
            {tab === "friends" && (
              <FriendsList
                friends={friends}
                activeFriend={activeFriend}
                onSelect={onSelect}
                unreadCounts={unreadCounts}
                presence={presence}
                moods={moods}
              />
            )}
            {tab === "search" && <SearchUsers />}
            {tab === "requests" && <FriendRequests onAccepted={onFriendAdded} />}
          </motion.div>
        </AnimatePresence>
      </div>

      <AnimatePresence>{editOpen && <ProfileEdit onClose={() => setEditOpen(false)} />}</AnimatePresence>
    </div>
  );
}
