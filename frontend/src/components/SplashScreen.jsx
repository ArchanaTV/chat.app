import { useEffect, useState } from "react";

// Full-screen intro animation shown once when the app first loads:
// the logo swims in from the left with bubbles + a wave beneath it,
// settles with a little bounce, a tagline fades in, then the whole
// thing fades out to reveal the real app underneath.
export default function SplashScreen({ onDone }) {
  const [phase, setPhase] = useState("swim"); // swim -> settled -> fadeOut -> (unmount)

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("settled"), 2200); // logo has arrived + bounced
    const t2 = setTimeout(() => setPhase("fadeOut"), 4200); // after a short pause
    const t3 = setTimeout(() => onDone?.(), 4800); // fully gone, show the app
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [onDone]);

  const bubbles = [
    { left: "42%", delay: "0.2s", size: 10 },
    { left: "48%", delay: "0.6s", size: 7 },
    { left: "55%", delay: "1.0s", size: 12 },
    { left: "45%", delay: "1.4s", size: 8 },
    { left: "52%", delay: "1.8s", size: 9 },
  ];

  return (
    <div
      className="fixed inset-0 z-[999] flex flex-col items-center justify-center bg-white"
      style={{
        opacity: phase === "fadeOut" ? 0 : 1,
        transition: "opacity 0.6s ease-out",
      }}
    >
      <style>{`
        @keyframes splashSwim {
          0%   { transform: translateX(-70vw) rotate(-4deg); opacity: 0; }
          10%  { opacity: 1; }
          60%  { transform: translateX(4%) rotate(3deg); }
          80%  { transform: translateX(-1%) rotate(-2deg); }
          100% { transform: translateX(0) rotate(0deg); }
        }
        @keyframes splashBounce {
          0%   { transform: scale(1); }
          30%  { transform: scale(1.07); }
          55%  { transform: scale(0.97); }
          100% { transform: scale(1); }
        }
        @keyframes splashGlow {
          0%, 100% { opacity: 0.35; }
          50%      { opacity: 0.6; }
        }
        @keyframes splashBubbleRise {
          0%   { transform: translateY(0) scale(0.4); opacity: 0; }
          20%  { opacity: 0.8; }
          100% { transform: translateY(-90px) scale(1); opacity: 0; }
        }
        @keyframes splashWaveGrow {
          0%   { transform: scaleX(0); opacity: 0; }
          100% { transform: scaleX(1); opacity: 1; }
        }
        @keyframes splashTextFade {
          0%   { transform: translateY(14px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        .splash-logo-wrap {
          animation: splashSwim 2s cubic-bezier(0.22, 0.61, 0.36, 1) forwards;
        }
        .splash-logo-settled {
          animation: splashBounce 0.5s ease-out forwards;
        }
        .splash-glow {
          animation: splashGlow 2.4s ease-in-out infinite;
        }
        .splash-bubble {
          position: absolute;
          bottom: 40%;
          border-radius: 9999px;
          background: radial-gradient(circle at 30% 30%, #cdeffd, #7fd4f0);
          animation: splashBubbleRise 2.2s ease-out infinite;
        }
        .splash-wave {
          transform-origin: center;
          animation: splashWaveGrow 1.2s ease-out 0.9s forwards;
          opacity: 0;
        }
        .splash-tagline {
          animation: splashTextFade 0.7s ease-out 2.3s forwards;
          opacity: 0;
        }
      `}</style>

      <div className="relative flex items-center justify-center" style={{ width: 220, height: 220 }}>
        {/* soft glow behind the logo */}
        <div
          className="splash-glow absolute rounded-full"
          style={{
            width: 260,
            height: 260,
            background: "radial-gradient(circle, rgba(255,153,51,0.35) 0%, rgba(255,153,51,0) 70%)",
          }}
        />

        {/* rising water bubbles */}
        {bubbles.map((b, i) => (
          <span
            key={i}
            className="splash-bubble"
            style={{ left: b.left, width: b.size, height: b.size, animationDelay: b.delay }}
          />
        ))}

        {/* the logo itself, swimming in then settling with a bounce */}
        <div className={`splash-logo-wrap ${phase !== "swim" ? "splash-logo-settled" : ""}`}>
          <img src="/logo.png" alt="ChatWave" style={{ width: 170, height: "auto" }} draggable={false} />
        </div>

        {/* soft wave beneath the logo */}
        <svg
          className="splash-wave absolute"
          style={{ bottom: 8, width: 200, height: 24 }}
          viewBox="0 0 200 24"
          fill="none"
        >
          <path
            d="M0 12 Q 25 0, 50 12 T 100 12 T 150 12 T 200 12 V24 H0 Z"
            fill="#7fd4f0"
            opacity="0.6"
          />
        </svg>
      </div>

      <p className="splash-tagline mt-6 text-sm font-medium tracking-wide text-brand-600">
        Ride the wave of conversation
      </p>
    </div>
  );
}
