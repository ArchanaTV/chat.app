import { useEffect, useState } from "react";

// Full-screen intro animation shown once when the app first loads.
// The tortoise itself is drawn entirely in code (SVG shapes), not an image,
// so its flippers can actually move. Sequence: swim in from the left with
// bubbles + a growing wave -> settle with a bounce -> "ChatWave" fades in
// below it -> short pause -> everything fades out to reveal the app.
export default function SplashScreen({ onDone }) {
  const [phase, setPhase] = useState("swim"); // swim -> settled -> fadeOut -> (unmount)

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("settled"), 2400); // tortoise has arrived + bounced
    const t2 = setTimeout(() => setPhase("fadeOut"), 4400); // after a short pause
    const t3 = setTimeout(() => onDone?.(), 5000); // fully gone, show the app
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [onDone]);

  const bubbles = [
    { left: "38%", delay: "0.2s", size: 10 },
    { left: "46%", delay: "0.6s", size: 7 },
    { left: "55%", delay: "1.0s", size: 12 },
    { left: "43%", delay: "1.4s", size: 8 },
    { left: "50%", delay: "1.8s", size: 9 },
  ];

  return (
    <div
      className="fixed inset-0 z-[999] flex flex-col items-center justify-center bg-white"
      style={{ opacity: phase === "fadeOut" ? 0 : 1, transition: "opacity 0.6s ease-out" }}
    >
      <style>{`
        @keyframes splashSwim {
          0%   { transform: translateX(-70vw) rotate(-4deg); opacity: 0; }
          10%  { opacity: 1; }
          60%  { transform: translateX(4%) rotate(2deg); }
          80%  { transform: translateX(-1%) rotate(-1deg); }
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
          0%   { transform: translateY(16px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        @keyframes flipperTop {
          0%, 100% { transform: rotate(-8deg); }
          50%      { transform: rotate(22deg); }
        }
        @keyframes flipperBottom {
          0%, 100% { transform: rotate(8deg); }
          50%      { transform: rotate(-22deg); }
        }
        @keyframes tailWag {
          0%, 100% { transform: rotate(-6deg); }
          50%      { transform: rotate(6deg); }
        }
        .splash-tortoise-wrap {
          animation: splashSwim 2.4s cubic-bezier(0.22, 0.61, 0.36, 1) forwards;
        }
        .splash-tortoise-settled {
          animation: splashBounce 0.5s ease-out forwards;
        }
        .splash-glow {
          animation: splashGlow 2.4s ease-in-out infinite;
        }
        .splash-bubble {
          position: absolute;
          bottom: 42%;
          border-radius: 9999px;
          background: radial-gradient(circle at 30% 30%, #cdeffd, #7fd4f0);
          animation: splashBubbleRise 2.2s ease-out infinite;
        }
        .splash-wave {
          transform-origin: center;
          animation: splashWaveGrow 1.2s ease-out 1.1s forwards;
          opacity: 0;
        }
        .splash-title {
          animation: splashTextFade 0.7s ease-out 2.5s forwards;
          opacity: 0;
        }
        .flipper-top { transform-origin: 138px 50px; animation: flipperTop 0.9s ease-in-out infinite; }
        .flipper-bottom { transform-origin: 138px 92px; animation: flipperBottom 0.9s ease-in-out infinite; }
        .tail-fin { transform-origin: 55px 71px; animation: tailWag 0.9s ease-in-out infinite; }
      `}</style>

      <div className="relative flex items-center justify-center" style={{ width: 240, height: 200 }}>
        {/* soft glow behind the tortoise */}
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

        {/* the hand-drawn tortoise, swimming in then settling with a bounce */}
        <div className={`splash-tortoise-wrap ${phase !== "swim" ? "splash-tortoise-settled" : ""}`}>
          <svg width="190" height="140" viewBox="0 0 200 140">
            {/* tail */}
            <path className="tail-fin" d="M55,71 L35,60 L38,71 L35,82 Z" fill="#3f9c6b" />
            {/* bottom flipper (drawn first so the shell overlaps its base) */}
            <path className="flipper-bottom" d="M138,92 Q112,108 96,128 Q118,120 138,100 Z" fill="#4caf6b" />
            {/* shell */}
            <ellipse cx="102" cy="70" rx="58" ry="37" fill="#1f6b4a" />
            <path d="M58,58 Q102,40 146,58" stroke="#3f9c6b" strokeWidth="3" fill="none" strokeLinecap="round" />
            <path d="M52,78 Q102,98 152,78" stroke="#3f9c6b" strokeWidth="3" fill="none" strokeLinecap="round" />
            <path d="M102,35 L102,105" stroke="#3f9c6b" strokeWidth="2.5" fill="none" opacity="0.7" />
            {/* underbelly hint */}
            <ellipse cx="102" cy="96" rx="46" ry="12" fill="#eef2c0" opacity="0.5" />
            {/* top flipper (drawn after shell so it appears to stroke over the top) */}
            <path className="flipper-top" d="M138,50 Q112,32 96,12 Q118,20 138,42 Z" fill="#4caf6b" />
            {/* head */}
            <circle cx="163" cy="58" r="21" fill="#4fae6f" />
            <circle cx="171" cy="51" r="3.2" fill="#1b1b1b" />
            <circle cx="172" cy="49.5" r="1" fill="#ffffff" />
            <path d="M156,66 Q166,73 177,64" stroke="#1b1b1b" strokeWidth="2" fill="none" strokeLinecap="round" />
          </svg>
        </div>

        {/* soft wave beneath the tortoise */}
        <svg
          className="splash-wave absolute"
          style={{ bottom: 4, width: 210, height: 24 }}
          viewBox="0 0 200 24"
          fill="none"
        >
          <path d="M0 12 Q 25 0, 50 12 T 100 12 T 150 12 T 200 12 V24 H0 Z" fill="#7fd4f0" opacity="0.6" />
        </svg>
      </div>

      <h1 className="splash-title mt-6 text-3xl font-bold tracking-wide text-brand-600">ChatWave</h1>
    </div>
  );
}
