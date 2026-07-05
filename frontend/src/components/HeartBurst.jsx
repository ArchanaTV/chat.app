const HEART_EMOJIS = ["❤️", "💕", "💖", "💗", "💓"];

// A short-lived overlay of floating hearts. Mount this once near the bottom of
// the chat window and bump `burstKey` (any changing value) to trigger a burst.
export default function HeartBurst({ burstKey }) {
  if (!burstKey) return null;

  const hearts = Array.from({ length: 8 }, (_, i) => ({
    id: `${burstKey}-${i}`,
    left: 10 + Math.random() * 80,
    delay: Math.random() * 0.3,
    emoji: HEART_EMOJIS[i % HEART_EMOJIS.length],
    size: 18 + Math.random() * 16,
  }));

  return (
    <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden">
      {hearts.map((h) => (
        <span
          key={h.id}
          className="absolute bottom-8 animate-float-up"
          style={{ left: `${h.left}%`, fontSize: h.size, animationDelay: `${h.delay}s` }}
        >
          {h.emoji}
        </span>
      ))}
    </div>
  );
}

// A message counts as a "heart message" if it's made up of only heart emojis
// (optionally repeated / with spaces), e.g. "❤️", "❤️❤️❤️", "💕 💖".
const HEART_SET = ["❤️", "💕", "💖", "💗", "💓", "💞", "😍", "🧡", "💛", "💚", "💙", "💜", "🤍", "🖤", "🤎", "❤"];

export function isHeartOnlyMessage(text) {
  if (!text) return false;
  let remaining = text.trim();
  if (!remaining) return false;
  let matchedAny = false;

  // Repeatedly strip a known heart (or whitespace) off the front until nothing's left.
  outer: while (remaining.length > 0) {
    if (/^\s/.test(remaining)) {
      remaining = remaining.replace(/^\s+/, "");
      continue;
    }
    for (const heart of HEART_SET) {
      if (remaining.startsWith(heart)) {
        remaining = remaining.slice(heart.length);
        matchedAny = true;
        continue outer;
      }
    }
    return false; // hit a character that isn't whitespace or a known heart
  }
  return matchedAny;
}
