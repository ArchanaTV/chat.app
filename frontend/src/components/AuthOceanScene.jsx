import { useEffect, useRef } from "react";
import TortoiseArt from "./TortoiseArt.jsx";

// A living, illustrated ocean scene used behind the login/register forms.
// Everything here is CSS-driven (no per-frame JS loop) so it stays smooth
// and light, except a gentle mouse-parallax effect on desktop. The form
// sitting on top of this is unaffected — this is purely decorative and
// always stays behind the actual UI (z-index and pointer-events: none).
export default function AuthOceanScene() {
  const sceneRef = useRef(null);

  // Subtle parallax: background layers drift a few pixels toward the cursor,
  // giving a sense of depth. Very small movement on purpose — this should
  // feel alive, not distracting.
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    const handleMove = (e) => {
      const { innerWidth, innerHeight } = window;
      const x = (e.clientX / innerWidth - 0.5) * 2; // -1..1
      const y = (e.clientY / innerHeight - 0.5) * 2;
      scene.style.setProperty("--parallax-x", x.toFixed(3));
      scene.style.setProperty("--parallax-y", y.toFixed(3));
    };
    window.addEventListener("mousemove", handleMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMove);
  }, []);

  const stars = Array.from({ length: 18 }, (_, i) => ({
    left: `${(i * 37) % 100}%`,
    top: `${(i * 53) % 55}%`,
    delay: `${(i % 6) * 0.7}s`,
    size: i % 3 === 0 ? 2.5 : 1.5,
  }));

  const sparkles = [
    { left: "44%", delay: "0.3s" },
    { left: "52%", delay: "1.1s" },
    { left: "60%", delay: "1.9s" },
    { left: "48%", delay: "2.6s" },
  ];

  return (
    <div ref={sceneRef} className="absolute inset-0 -z-0 overflow-hidden" style={{ pointerEvents: "none" }}>
      <style>{`
        @keyframes authSkyShift {
          0%, 100% { background-position: 0% 0%; }
          50%      { background-position: 0% 15%; }
        }
        @keyframes authTwinkle {
          0%, 100% { opacity: 0.15; }
          50%      { opacity: 0.9; }
        }
        @keyframes authCloudDrift {
          0%   { transform: translateX(-6%); }
          100% { transform: translateX(6%); }
        }
        @keyframes authBirdDrift {
          0%   { transform: translateX(-10vw) translateY(0); opacity: 0; }
          8%   { opacity: 0.5; }
          92%  { opacity: 0.5; }
          100% { transform: translateX(60vw) translateY(-14px); opacity: 0; }
        }
        @keyframes authWaveShimmer {
          0%   { background-position: 0% 0%; }
          100% { background-position: 200px 0%; }
        }
        @keyframes authRipple {
          0%   { transform: scale(0.3); opacity: 0.55; }
          100% { transform: scale(2.6); opacity: 0; }
        }
        @keyframes authSparkleRise {
          0%   { transform: translateY(0) scale(0.5); opacity: 0; }
          25%  { opacity: 1; }
          100% { transform: translateY(-46px) scale(1); opacity: 0; }
        }
        @keyframes authTortoiseBob {
          0%, 100% { transform: translateY(0) rotate(-1deg); }
          50%      { transform: translateY(-6px) rotate(1deg); }
        }
        @keyframes authTortoiseBlink {
          0%, 96%, 100% { opacity: 0; }
          97%, 99%       { opacity: 1; }
        }
        @keyframes authHeadTurn {
          0%, 100% { transform: rotate(-2deg); }
          50%      { transform: rotate(3deg); }
        }
        @keyframes authFigureSway {
          0%, 100% { transform: rotate(-0.6deg); }
          50%      { transform: rotate(0.6deg); }
        }
        @keyframes authHairSway {
          0%, 100% { transform: rotate(-3deg) translateX(0); }
          50%      { transform: rotate(3deg) translateX(2px); }
        }
        @keyframes authBreathe {
          0%, 100% { transform: scaleY(1); }
          50%      { transform: scaleY(1.015); }
        }
        @keyframes authPushIn {
          0%, 100% { transform: scale(1); }
          50%      { transform: scale(1.025); }
        }

        .auth-scene-zoom {
          animation: authPushIn 26s ease-in-out infinite;
          transform: translate(calc(var(--parallax-x, 0) * -4px), calc(var(--parallax-y, 0) * -3px));
          transition: transform 0.6s ease-out;
        }
        .auth-sky {
          background: linear-gradient(180deg, #2b1550 0%, #6a3a7a 22%, #c2537a 42%, #f08a55 62%, #ffce7a 80%, #ffe9c2 100%);
          background-size: 100% 130%;
          animation: authSkyShift 18s ease-in-out infinite;
        }
        .auth-star { position: absolute; border-radius: 9999px; background: white; animation: authTwinkle ease-in-out infinite; animation-duration: 3.5s; }
        .auth-cloud { animation: authCloudDrift 24s ease-in-out infinite alternate; }
        .auth-bird { position: absolute; animation: authBirdDrift linear infinite; }
        .auth-wave-shimmer {
          background: repeating-linear-gradient(100deg, rgba(255,255,255,0.12) 0px, rgba(255,255,255,0.12) 2px, transparent 2px, transparent 40px);
          animation: authWaveShimmer 6s linear infinite;
        }
        .auth-ripple {
          position: absolute;
          border: 1.5px solid rgba(255,255,255,0.55);
          border-radius: 9999px;
          animation: authRipple 3.5s ease-out infinite;
        }
        .auth-sparkle {
          position: absolute;
          width: 4px;
          height: 4px;
          border-radius: 9999px;
          background: radial-gradient(circle, #fff, rgba(255,255,255,0));
          animation: authSparkleRise 2.4s ease-out infinite;
        }
        .auth-tortoise-wrap { animation: authTortoiseBob 5s ease-in-out infinite; }
        .auth-tortoise-head { transform-origin: 163px 58px; animation: authHeadTurn 6s ease-in-out infinite; }
        .auth-figure { animation: authFigureSway 5.5s ease-in-out infinite; transform-origin: bottom center; }
        .auth-figure-hair { transform-origin: top center; animation: authHairSway 3.2s ease-in-out infinite; }
        .auth-figure-chest { transform-origin: center; animation: authBreathe 4s ease-in-out infinite; }
      `}</style>

      {/* base sunset sky */}
      <div className="auth-scene-zoom absolute inset-0">
        <div className="auth-sky absolute inset-0" />

        {/* stars */}
        {stars.map((s, i) => (
          <span
            key={i}
            className="auth-star"
            style={{ left: s.left, top: s.top, width: s.size, height: s.size, animationDelay: s.delay }}
          />
        ))}

        {/* soft drifting clouds */}
        <div className="auth-cloud absolute left-[10%] top-[12%] h-10 w-40 rounded-full bg-white/10 blur-xl" />
        <div className="auth-cloud absolute left-[55%] top-[20%] h-8 w-56 rounded-full bg-white/10 blur-xl" style={{ animationDelay: "-6s" }} />

        {/* distant birds */}
        <svg className="auth-bird" style={{ top: "18%", animationDuration: "16s", animationDelay: "1s" }} width="18" height="10" viewBox="0 0 18 10">
          <path d="M0,5 Q4.5,0 9,5 Q13.5,0 18,5" stroke="rgba(255,255,255,0.6)" strokeWidth="1.2" fill="none" />
        </svg>
        <svg className="auth-bird" style={{ top: "24%", animationDuration: "20s", animationDelay: "7s" }} width="14" height="8" viewBox="0 0 18 10">
          <path d="M0,5 Q4.5,0 9,5 Q13.5,0 18,5" stroke="rgba(255,255,255,0.5)" strokeWidth="1.2" fill="none" />
        </svg>

        {/* ocean */}
        <div className="absolute inset-x-0 bottom-0 h-[42%]">
          <div className="absolute inset-0 bg-gradient-to-b from-[#3a2f6b] via-[#264a6e] to-[#0f2f45]" />
          <div className="auth-wave-shimmer absolute inset-0 opacity-40" />

          {/* the tortoise, emerging from the water around the horizon line */}
          <div className="auth-tortoise-wrap absolute left-1/2 top-0 -translate-x-1/2 -translate-y-[58%]">
            <div className="relative">
              <TortoiseArt width={130} />
              {/* head-turn overlay to add subtle life without breaking the shared art's layout */}
              <div className="auth-tortoise-head absolute inset-0" />
              {/* gentle blink overlay right over the eye position (scaled to width=130 art) */}
              <div
                className="absolute rounded-full bg-[#4fae6f]"
                style={{
                  left: 130 * 0.855,
                  top: 130 * 0.34,
                  width: 5,
                  height: 5,
                  animation: "authTortoiseBlink 5s ease-in-out infinite",
                }}
              />
            </div>
            {/* ripples spreading from the tortoise */}
            <span className="auth-ripple" style={{ left: "50%", top: "70%", width: 40, height: 14, marginLeft: -20 }} />
            <span className="auth-ripple" style={{ left: "50%", top: "70%", width: 40, height: 14, marginLeft: -20, animationDelay: "1.2s" }} />
            <span className="auth-ripple" style={{ left: "50%", top: "70%", width: 40, height: 14, marginLeft: -20, animationDelay: "2.4s" }} />
          </div>

          {/* sparkling water droplets near the tortoise */}
          {sparkles.map((s, i) => (
            <span key={i} className="auth-sparkle" style={{ left: s.left, bottom: "60%", animationDelay: s.delay }} />
          ))}

          {/* a simple, elegant silhouette standing at the shoreline, looking toward the tortoise */}
          <div className="auth-figure absolute bottom-2 left-[18%]">
            <svg width="46" height="120" viewBox="0 0 46 120">
              {/* hair */}
              <path
                className="auth-figure-hair"
                d="M14,18 Q10,34 14,48 Q8,40 8,24 Q8,14 14,18 Z"
                fill="#241634"
                opacity="0.9"
              />
              {/* head */}
              <circle cx="20" cy="16" r="8" fill="#2e2340" />
              {/* dress/body, gently flared at the hem like fabric in a breeze */}
              <path
                d="M12,30 Q20,26 28,30 L32,100 Q20,108 8,100 Z"
                fill="#3a2a55"
              />
              <path
                className="auth-figure-chest"
                d="M14,32 Q20,29 26,32 L26,54 Q20,57 14,54 Z"
                fill="#4a3768"
                opacity="0.8"
              />
            </svg>
          </div>
        </div>

        {/* soft vignette so the login form stays readable on top of the scene */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/25" />
        <div className="absolute inset-0 bg-white/35 dark:bg-black/40" />
      </div>
    </div>
  );
}
