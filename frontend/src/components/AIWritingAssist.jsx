import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Check, X, Loader2 } from "lucide-react";
import api from "../api/axios.js";

const MODES = [
  { key: "improve", label: "Improve Writing" },
  { key: "grammar", label: "Fix Grammar" },
  { key: "rewrite", label: "Rewrite" },
  { key: "professional", label: "Professional Tone" },
  { key: "friendly", label: "Friendly Tone" },
  { key: "shorten", label: "Shorten" },
  { key: "expand", label: "Expand" },
  { key: "emojis", label: "Add Emojis" },
];

export default function AIWritingAssist({ text, onApply }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState("");

  const run = async (mode) => {
    setMenuOpen(false);
    setLoading(true);
    setError("");
    try {
      const { data } = await api.post("/ai/writing-assist", { text, mode });
      setPreview(data.result);
    } catch (err) {
      setError(err.response?.data?.message || "AI request failed");
    } finally {
      setLoading(false);
    }
  };

  const accept = () => {
    onApply(preview);
    setPreview(null);
  };

  return (
    <div className="relative">
      <motion.button
        whileHover={{ scale: 1.15 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => text.trim() && setMenuOpen((s) => !s)}
        title="AI Writing Assistant"
        disabled={!text.trim() || loading}
        className="flex h-9 w-9 items-center justify-center rounded-full text-white/50 transition hover:bg-white/10 hover:text-white disabled:opacity-30"
      >
        {loading ? <Loader2 size={17} className="animate-spin" /> : <Sparkles size={17} />}
      </motion.button>

      <AnimatePresence>
        {menuOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 8 }}
              transition={{ duration: 0.15 }}
              className="absolute bottom-11 left-0 z-50 w-48 overflow-hidden rounded-2xl border border-white/10 bg-gray-900/95 py-1 shadow-2xl backdrop-blur-xl"
            >
              {MODES.map((m) => (
                <button
                  key={m.key}
                  onClick={() => run(m.key)}
                  className="block w-full px-4 py-2.5 text-left text-sm text-white/85 transition hover:bg-white/10"
                >
                  {m.label}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {(preview || error) && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            className="absolute bottom-11 left-0 z-50 w-72 rounded-2xl border border-white/10 bg-gray-900/95 p-3 shadow-2xl backdrop-blur-xl"
          >
            {error ? (
              <p className="text-sm text-red-300">{error}</p>
            ) : (
              <>
                <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-indigo-300">
                  <Sparkles size={12} /> AI Suggestion
                </div>
                <p className="mb-3 text-sm text-white/90">{preview}</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPreview(null)}
                    className="flex flex-1 items-center justify-center gap-1 rounded-xl border border-white/10 py-1.5 text-xs text-white/60 hover:bg-white/5"
                  >
                    <X size={13} /> Discard
                  </button>
                  <button
                    onClick={accept}
                    className="flex flex-1 items-center justify-center gap-1 rounded-xl py-1.5 text-xs font-medium text-white"
                    style={{ background: "linear-gradient(135deg, var(--accent-from), var(--accent-to))" }}
                  >
                    <Check size={13} /> Use This
                  </button>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
