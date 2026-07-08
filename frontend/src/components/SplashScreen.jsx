import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const LETTERS = "ChatWave".split("");

// A cinematic opening sequence (~3.2s total, well within the 2-4s target):
// dark screen -> ambient glow blooms -> abstract logo mark scales in with a
// pulse -> "ChatWave" reveals letter by letter -> a light sweep travels
// across the wordmark -> a brief hold -> gentle zoom + fade out reveals the
// app underneath. Built with Framer Motion for real, tuned easing rather
// than hand-timed CSS.
export default function SplashScreen({ onDone }) {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setExiting(true), 2600);
    const t2 = setTimeout(() => onDone?.(), 3200);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [onDone]);

  const particles = Array.from({ length: 14 }, (_, i) => ({
    left: `${(i * 29) % 100}%`,
    top: `${(i * 47) % 100}%`,
    delay: (i % 7) * 0.3,
    size: i % 3 === 0 ? 3 : 2,
  }));

  return (
    <motion.div
      className="fixed inset-0 z-[999] flex items-center justify-center overflow-hidden bg-[#05070f]"
      animate={exiting ? { opacity: 0, scale: 1.08 } : { opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: "easeInOut" }}
    >
      {/* ambient glow blooming in the center */}
      <motion.div
        className="absolute rounded-full"
        style={{ width: 600, height: 600, background: "radial-gradient(circle, rgba(99,102,241,0.25), rgba(56,189,248,0.08) 45%, transparent 70%)" }}
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.1, ease: "easeOut" }}
      />

      {/* soft floating light particles */}
      {particles.map((p, i) => (
        <motion.span
          key={i}
          className="absolute rounded-full bg-white"
          style={{ left: p.left, top: p.top, width: p.size, height: p.size }}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.6, 0], y: [0, -30] }}
          transition={{ duration: 3.5, delay: p.delay, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}

      <div className="relative flex flex-col items-center">
        {/* abstract glowing logo mark */}
        <motion.div
          className="relative mb-5 flex h-20 w-20 items-center justify-center rounded-3xl"
          style={{ background: "linear-gradient(135deg, #6366f1, #38bdf8)" }}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{
            opacity: 1,
            scale: [0.5, 1.08, 1, 1.04, 1],
            boxShadow: [
              "0 0 0px rgba(99,102,241,0)",
              "0 0 40px rgba(99,102,241,0.6)",
              "0 0 24px rgba(99,102,241,0.4)",
              "0 0 36px rgba(56,189,248,0.5)",
              "0 0 24px rgba(99,102,241,0.4)",
            ],
          }}
          transition={{ duration: 1.6, times: [0, 0.35, 0.5, 0.75, 1], ease: "easeOut" }}
        >
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none">
            <path
              d="M4 12c1.5-3 3.5-3 5 0s3.5 3 5 0 3.5-3 5 0"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </motion.div>

        {/* wordmark with letter-by-letter reveal, then a light sweep across it */}
        <div className="relative overflow-hidden">
          <h1 className="flex text-3xl font-semibold tracking-wide text-white">
            {LETTERS.map((letter, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.9 + i * 0.06, ease: "easeOut" }}
              >
                {letter}
              </motion.span>
            ))}
          </h1>
          <motion.div
            className="pointer-events-none absolute inset-y-0 w-16"
            style={{ background: "linear-gradient(100deg, transparent, rgba(255,255,255,0.7), transparent)" }}
            initial={{ x: "-120%" }}
            animate={{ x: "220%" }}
            transition={{ duration: 0.9, delay: 1.7, ease: "easeInOut" }}
          />
        </div>
      </div>
    </motion.div>
  );
}
