import { useEffect, useState } from "react";

// A quick, elegant dark-glass intro shown once when the app loads: a glowing
// gradient ring draws itself in, a frosted glass panel fades up behind the
// wordmark, then everything fades out to reveal the app.
export default function SplashScreen({ onDone }) {
  const [phase, setPhase] = useState("in"); // in -> hold -> out

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("hold"), 1200);
    const t2 = setTimeout(() => setPhase("out"), 2000);
    const t3 = setTimeout(() => onDone?.(), 2600);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [onDone]);

  return (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center"
      style={{
        background: "radial-gradient(circle at 50% 40%, #1c2340 0%, #0a0e1f 70%)",
        opacity: phase === "out" ? 0 : 1,
        transition: "opacity 0.6s ease-out",
      }}
    >
      <style>{`
        @keyframes splashRingDraw {
          0%   { stroke-dashoffset: 300; opacity: 0; }
          15%  { opacity: 1; }
          100% { stroke-dashoffset: 0; opacity: 1; }
        }
        @keyframes splashGlassFade {
          0%   { opacity: 0; transform: scale(0.92); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes splashGlow {
          0%, 100% { opacity: 0.5; }
          50%      { opacity: 0.9; }
        }
        .splash-ring { animation: splashRingDraw 1s cubic-bezier(0.22, 0.61, 0.36, 1) forwards; }
        .splash-glass { animation: splashGlassFade 0.7s ease-out 0.5s forwards; opacity: 0; }
        .splash-orb { animation: splashGlow 2.4s ease-in-out infinite; }
      `}</style>

      {/* soft glow behind everything */}
      <div
        className="splash-orb absolute rounded-full"
        style={{ width: 320, height: 320, background: "radial-gradient(circle, rgba(99,102,241,0.35), rgba(99,102,241,0) 70%)" }}
      />

      <div className="relative flex flex-col items-center">
        {/* animated gradient ring */}
        <svg width="120" height="120" viewBox="0 0 120 120" className="mb-4">
          <defs>
            <linearGradient id="splashGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#818cf8" />
              <stop offset="100%" stopColor="#38bdf8" />
            </linearGradient>
          </defs>
          <circle
            className="splash-ring"
            cx="60"
            cy="60"
            r="46"
            fill="none"
            stroke="url(#splashGrad)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray="290"
          />
        </svg>

        {/* frosted glass wordmark panel */}
        <div
          className="splash-glass rounded-2xl border border-white/10 px-8 py-4 backdrop-blur-xl"
          style={{ background: "rgba(255,255,255,0.06)" }}
        >
          <h1 className="text-2xl font-semibold tracking-wide text-white">ChatWave</h1>
        </div>
      </div>
    </div>
  );
}
