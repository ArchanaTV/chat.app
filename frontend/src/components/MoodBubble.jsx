export const MOODS = [
  { key: "happy", emoji: "😊", label: "Happy" },
  { key: "sleepy", emoji: "😴", label: "Sleepy" },
  { key: "chill", emoji: "😎", label: "Chill" },
];

export const moodEmoji = (mood) => MOODS.find((m) => m.key === mood)?.emoji || "";

// Small inline badge shown beside a username, e.g. "Archana 😊"
export function MoodBadge({ mood }) {
  const emoji = moodEmoji(mood);
  if (!emoji) return null;
  return <span className="ml-1 animate-pop-in">{emoji}</span>;
}
