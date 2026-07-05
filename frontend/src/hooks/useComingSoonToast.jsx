import { useEffect, useState } from "react";

// A tiny, friendly notice used for buttons that are visually present (to
// match the design) but not wired up to real functionality yet - e.g.
// social login, forgot password. Honest with the user instead of a dead
// click or a silent no-op. Usage: const { toast, show } = useComingSoonToast();
export default function useComingSoonToast() {
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => setMessage(null), 2200);
    return () => clearTimeout(t);
  }, [message]);

  const toast = message ? (
    <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 animate-fade-in rounded-full bg-gray-900/90 px-4 py-2 text-sm text-white shadow-lg">
      {message}
    </div>
  ) : null;

  return { toast, show: (text) => setMessage(text) };
}
