export default function TypingIndicator({ username }) {
  return (
    <div className="flex items-center gap-2 px-4 py-1 text-xs text-gray-400">
      <span className="inline-block animate-tortoise-walk text-base">🐢</span>
      <span>{username} is typing...</span>
    </div>
  );
}
