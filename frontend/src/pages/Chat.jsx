import { useEffect, useState, useCallback, useRef } from "react";
import api from "../api/axios.js";
import { useSocket } from "../context/SocketContext.jsx";
import Sidebar from "../components/Sidebar.jsx";
import ChatWindow from "../components/ChatWindow.jsx";
import AmbientGlowBackground from "../components/AmbientGlowBackground.jsx";
import CallModal from "../components/CallModal.jsx";
import useMessageNotifications from "../hooks/useMessageNotifications.jsx";

export default function Chat() {
  const { socket } = useSocket();
  const [friends, setFriends] = useState([]);
  const [activeFriend, setActiveFriend] = useState(null);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [presence, setPresence] = useState({}); // { [userId]: { isOnline, lastSeen } }
  const [moods, setMoods] = useState({}); // { [userId]: "happy" | "sleepy" | "chill" | null }
  const [requestCount, setRequestCount] = useState(0);

  const { notify, setBadgeCount } = useMessageNotifications({
    onNotificationClick: (senderId) => {
      const target = friendsRef.current.find((f) => f._id === senderId);
      if (target) selectFriend(target);
    },
  });
  const friendsRef = useRef(friends);
  useEffect(() => {
    friendsRef.current = friends;
  }, [friends]);

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

  useEffect(() => {
    const total = Object.values(unreadCounts).reduce((sum, c) => sum + c, 0);
    setBadgeCount(total);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unreadCounts]);

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
        const sender = friendsRef.current.find((f) => f._id === senderId);
        if (sender) notify(message, sender.username, sender.avatarUrl);
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
    <div className="relative flex h-screen-safe w-full overflow-hidden md:gap-4 md:p-4">
      <AmbientGlowBackground />
      <CallModal friends={friends} />
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

      <div className={`${activeFriend ? "flex" : "hidden md:flex"} h-full min-w-0 flex-1 overflow-hidden md:rounded-2xl md:border md:border-white/10 md:bg-white/[0.04] md:shadow-2xl md:backdrop-blur-xl`}>
        {activeFriend ? (
          <ChatWindow
            friend={activeFriend}
            friends={friends}
            presence={presence}
            mood={moods[activeFriend._id] ?? activeFriend.mood}
            onBack={() => setActiveFriend(null)}
            onRelationshipChanged={() => {
              loadFriends();
              setActiveFriend(null);
            }}
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-3 text-white/30">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400/10 to-sky-400/10">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <p className="text-sm">Select a friend to start chatting</p>
          </div>
        )}
      </div>
    </div>
  );
}
