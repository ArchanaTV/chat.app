import { useEffect, useState, useCallback } from "react";
import api from "../api/axios.js";
import { useSocket } from "../context/SocketContext.jsx";
import Sidebar from "../components/Sidebar.jsx";
import ChatWindow from "../components/ChatWindow.jsx";
import AmbientGlowBackground from "../components/AmbientGlowBackground.jsx";

export default function Chat() {
  const { socket } = useSocket();
  const [friends, setFriends] = useState([]);
  const [activeFriend, setActiveFriend] = useState(null);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [presence, setPresence] = useState({}); // { [userId]: { isOnline, lastSeen } }
  const [moods, setMoods] = useState({}); // { [userId]: "happy" | "sleepy" | "chill" | null }
  const [requestCount, setRequestCount] = useState(0);

  const loadFriends = useCallback(async () => {
    const { data } = await api.get("/friends");
    setFriends(data.friends);
  }, []);

  const loadRequestCount = useCallback(async () => {
    const { data } = await api.get("/friends/requests");
    setRequestCount(data.requests.length);
  }, []);

  const loadUnread = useCallback(async () => {
    const { data } = await api.get("/messages/unread/count");
    const map = {};
    data.unread.forEach((u) => (map[u._id] = u.count));
    setUnreadCounts(map);
  }, []);

  useEffect(() => {
    loadFriends();
    loadRequestCount();
    loadUnread();
  }, [loadFriends, loadRequestCount, loadUnread]);

  // Global socket listeners: presence + incoming messages (for unread badges) + friend request pushes
  useEffect(() => {
    if (!socket) return;

    const handlePresence = ({ userId, isOnline, lastSeen }) => {
      setPresence((p) => ({ ...p, [userId]: { isOnline, lastSeen } }));
    };

    const handleMoodUpdate = ({ userId, mood }) => {
      setMoods((m) => ({ ...m, [userId]: mood }));
    };

    const handleNewMessage = (message) => {
      const senderId = message.sender?._id || message.sender;
      const isActiveConvo = activeFriend && senderId === activeFriend._id;
      if (senderId && !isActiveConvo && senderId !== message.receiver) {
        setUnreadCounts((prev) => ({ ...prev, [senderId]: (prev[senderId] || 0) + 1 }));
      }
    };

    socket.on("presence:update", handlePresence);
    socket.on("mood:update", handleMoodUpdate);
    socket.on("message:new", handleNewMessage);

    return () => {
      socket.off("presence:update", handlePresence);
      socket.off("mood:update", handleMoodUpdate);
      socket.off("message:new", handleNewMessage);
    };
  }, [socket, activeFriend]);

  const selectFriend = (friend) => {
    setActiveFriend(friend);
    setUnreadCounts((prev) => ({ ...prev, [friend._id]: 0 }));
  };

  return (
    <div className="relative flex h-screen w-full overflow-hidden">
      <AmbientGlowBackground />
      <div className={`${activeFriend ? "hidden md:flex" : "flex"} h-full`}>
        <Sidebar
          friends={friends}
          activeFriend={activeFriend}
          onSelect={selectFriend}
          unreadCounts={unreadCounts}
          presence={presence}
          moods={moods}
          requestCount={requestCount}
          onFriendAdded={() => {
            loadFriends();
            loadRequestCount();
          }}
        />
      </div>

      <div className={`${activeFriend ? "flex" : "hidden md:flex"} h-full flex-1`}>
        {activeFriend ? (
          <div className="flex h-full w-full flex-col">
            <button
              onClick={() => setActiveFriend(null)}
              className="border-b border-gray-200 bg-white px-4 py-2 text-left text-sm text-brand-600 dark:border-gray-800 dark:bg-gray-900 md:hidden"
            >
              ← Back
            </button>
            <ChatWindow friend={activeFriend} presence={presence} mood={moods[activeFriend._id] ?? activeFriend.mood} />
          </div>
        ) : (
          <div className="flex h-full w-full items-center justify-center text-gray-400">
            Select a friend to start chatting
          </div>
        )}
      </div>
    </div>
  );
}
