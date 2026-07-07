// A quiet, dark ambient backdrop: a few large, soft, blurred color orbs that
// drift very slowly, used behind glass panels throughout the app (auth pages,
// and later the main chat screen). Everything here is decorative and sits
// behind the real UI (pointer-events: none, negative z-index).
export default function AmbientGlowBackground() {
  const orbs = [
    { top: "-10%", left: "-8%", size: 420, color: "rgba(99,102,241,0.35)", duration: "26s" },
    { top: "55%", left: "70%", size: 480, color: "rgba(56,189,248,0.28)", duration: "32s" },
    { top: "75%", left: "5%", size: 320, color: "rgba(168,85,247,0.25)", duration: "28s" },
  ];

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#0a0e1f]">
      <style>{`
        @keyframes ambientDrift {
          0%   { transform: translate(0, 0) scale(1); }
          50%  { transform: translate(30px, -20px) scale(1.08); }
          100% { transform: translate(0, 0) scale(1); }
        }
      `}</style>
      {orbs.map((o, i) => (
        <div
          key={i}
          className="absolute rounded-full blur-3xl"
          style={{
            top: o.top,
            left: o.left,
            width: o.size,
            height: o.size,
            background: o.color,
            animation: `ambientDrift ${o.duration} ease-in-out infinite`,
            animationDelay: `${i * 3}s`,
          }}
        />
      ))}
      {/* faint grid texture for a "premium tech" feel */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
    </div>
  );
}
