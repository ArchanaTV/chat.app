import { motion } from "framer-motion";

export default function TypingIndicator({ username }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      className="flex items-center gap-2 px-4 py-1.5 text-xs text-white/40"
    >
      <div className="flex items-center gap-0.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1.5">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-white/50"
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
          />
        ))}
      </div>
      <span>{username} is typing...</span>
    </motion.div>
  );
}
