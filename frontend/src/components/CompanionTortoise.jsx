import { useEffect, useRef, useState } from "react";
import TortoiseArt from "./TortoiseArt.jsx";

const GREETINGS = [
  "Hi, I'm Wavey! 👋",
  "Just paddling along~",
  "Making waves today?",
  "Chat away, I'm here!",
];

// A small, friendly tortoise that lives in the corner of the app. Mostly it
// just floats and blinks quietly so it doesn't distract from chatting, but
// tap it and it waves + says hello. Every so often it waves on its own too.
export default function CompanionTortoise() {
  const [blinking, setBlinking] = useState(false);
  const [waving, setWaving] = useState(false);
  const [bubble, setBubble] = useState(null);
  const hideTimerRef = useRef(null);

  // Gentle random blinking, like a living creature rather than a looping GIF.
  useEffect(() => {
    let cancelled = false;
    const scheduleBlink = () => {
      const delay = 2500 + Math.random() * 3500;
      setTimeout(() => {
        if (cancelled) return;
        setBlinking(true);
        setTimeout(() => !cancelled && setBlinking(false), 180);
        scheduleBlink();
      }, delay);
    };
    scheduleBlink();
    return () => {
      cancelled = true;
    };
  }, []);

  // Occasionally waves on its own, unprompted, like it's just happy to be there.
  useEffect(() => {
    let cancelled = false;
    const scheduleWave = () => {
      const delay = 20000 + Math.random() * 25000;
      setTimeout(() => {
        if (cancelled) return;
        triggerWave();
        scheduleWave();
      }, delay);
    };
    scheduleWave();
    return () => {
      cancelled = true;
      clearTimeout(hideTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const triggerWave = () => {
    setWaving(true);
    setBubble(GREETINGS[Math.floor(Math.random() * GREETINGS.length)]);
    clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      setWaving(false);
      setBubble(null);
    }, 2400);
  };

  return (
    <div className="fixed bottom-5 right-5 z-40 select-none">
      <style>{`
        @keyframes companionBob {
          0%, 100% { transform: translateY(0) rotate(-1.5deg); }
          50%      { transform: translateY(-7px) rotate(1.5deg); }
        }
        @keyframes companionWaveTop {
          0%, 100% { transform: rotate(-8deg); }
          50%      { transform: rotate(45deg); }
        }
        @keyframes companionIdleFlipper {
          0%, 100% { transform: rotate(-4deg); }
          50%      { transform: rotate(4deg); }
        }
        @keyframes companionPopIn {
          0%   { opacity: 0; transform: translateY(6px) scale(0.9); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        .companion-bob { animation: companionBob 3.2s ease-in-out infinite; }
        .companion-flipper-idle { transform-origin: 138px 92px; animation: companionIdleFlipper 2.6s ease-in-out infinite; }
        .companion-flipper-wave { transform-origin: 138px 50px; animation: companionWaveTop 0.5s ease-in-out 3; }
        .companion-bubble { animation: companionPopIn 0.2s ease-out forwards; }
      `}</style>

      {bubble && (
        <div className="companion-bubble absolute -top-12 right-0 whitespace-nowrap rounded-2xl bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-lg dark:bg-gray-800 dark:text-gray-100">
          {bubble}
          <div className="absolute -bottom-1 right-6 h-2 w-2 rotate-45 bg-white dark:bg-gray-800" />
        </div>
      )}

      <button
        onClick={triggerWave}
        title="Say hi to Wavey"
        className="companion-bob block drop-shadow-lg transition-transform hover:scale-110"
      >
        <TortoiseArt
          width={56}
          eyesClosed={blinking}
          flipperTopClass={waving ? "companion-flipper-wave" : ""}
          flipperBottomClass="companion-flipper-idle"
        />
      </button>
    </div>
  );
}
