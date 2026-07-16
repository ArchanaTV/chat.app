import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X } from "lucide-react";
import api from "../api/axios.js";

// Shows 2-3 short AI-suggested replies above the message box, based on the
// recent conversation. Only fetches when the last message wasn't sent by
// me (no point suggesting a reply to my own message), and refetches
// whenever the conversation changes.
export default function SmartReplies({ friendId, lastMessage, currentUserId, onSelect }) {
  const [replies, setReplies] = useState([]);
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(false);

  const lastSenderId = lastMessage?.sender?._id || lastMessage?.sender;
  const shouldShow = lastMessage && lastSenderId !== currentUserId && !dismissed;

  useEffect(() => {
    setDismissed(false);
    setReplies([]);
  }, [friendId]);

  useEffect(() => {
    if (!shouldShow) return;
    let cancelled = false;
    setLoading(true);
    api
      .post("/ai/smart-replies", { friendId })
      .then(({ data }) => {
        if (!cancelled) setReplies(data.replies || []);
      })
      .catch(() => {
        if (!cancelled) setReplies([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastMessage?._id, shouldShow]);

  if (!shouldShow || (!loading && replies.length === 0)) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: "auto" }}
        exit={{ opacity: 0, height: 0 }}
        className="overflow-hidden border-t border-white/5 px-3 pt-2"
      >
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          <Sparkles size={13} className="shrink-0 text-indigo-300" />
          {loading ? (
            <span className="text-xs text-white/30">Thinking of replies...</span>
          ) : (
            <>
              {replies.map((r, i) => (
                <motion.button
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => {
                    onSelect(r);
                    setDismissed(true);
                  }}
                  className="shrink-0 whitespace-nowrap rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/80 hover:bg-white/10"
                >
                  {r}
                </motion.button>
              ))}
              <button onClick={() => setDismissed(true)} className="ml-auto shrink-0 text-white/25 hover:text-white/50">
                <X size={13} />
              </button>
            </>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
