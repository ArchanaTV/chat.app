// A quiet, ambient backdrop: a soft gradient wash, slow-drifting waves near
// the bottom, and a few faint floating particles. Everything here is subtle
// on purpose (low opacity, slow timing) so it adds depth without competing
// with the actual chat content sitting on top of it.
export default function OceanBackground() {
  const particles = [
    { left: "8%", size: 5, duration: "14s", delay: "0s" },
    { left: "22%", size: 3, duration: "18s", delay: "3s" },
    { left: "37%", size: 6, duration: "16s", delay: "6s" },
    { left: "58%", size: 4, duration: "20s", delay: "1s" },
    { left: "74%", size: 5, duration: "15s", delay: "8s" },
    { left: "88%", size: 3, duration: "19s", delay: "4s" },
  ];

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <style>{`
        @keyframes oceanParticleDrift {
          0%   { transform: translateY(0) translateX(0); opacity: 0; }
          10%  { opacity: 0.5; }
          90%  { opacity: 0.5; }
          100% { transform: translateY(-40vh) translateX(12px); opacity: 0; }
        }
        @keyframes oceanWaveDrift {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .ocean-particle {
          position: absolute;
          bottom: -20px;
          border-radius: 9999px;
          background: radial-gradient(circle at 30% 30%, rgba(255,255,255,0.9), rgba(127,212,240,0.4));
          animation: oceanParticleDrift ease-in-out infinite;
        }
        .ocean-wave-layer {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 200%;
          height: 90px;
          animation: oceanWaveDrift linear infinite;
        }
      `}</style>

      {/* soft ambient gradient wash */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-brand-50/40 dark:to-brand-700/10" />

      {/* faint drifting light particles */}
      {particles.map((p, i) => (
        <span
          key={i}
          className="ocean-particle"
          style={{
            left: p.left,
            width: p.size,
            height: p.size,
            animationDuration: p.duration,
            animationDelay: p.delay,
          }}
        />
      ))}

      {/* two slow, offset wave layers along the bottom for parallax depth */}
      <svg
        className="ocean-wave-layer"
        style={{ animationDuration: "22s", opacity: 0.12 }}
        viewBox="0 0 400 40"
        preserveAspectRatio="none"
      >
        <path
          d="M0,20 Q50,0 100,20 T200,20 T300,20 T400,20 V40 H0 Z"
          fill="#7fd4f0"
        />
      </svg>
      <svg
        className="ocean-wave-layer"
        style={{ animationDuration: "30s", animationDirection: "reverse", opacity: 0.08, bottom: -6 }}
        viewBox="0 0 400 40"
        preserveAspectRatio="none"
      >
        <path
          d="M0,22 Q50,4 100,22 T200,22 T300,22 T400,22 V40 H0 Z"
          fill="#FF9933"
        />
      </svg>
    </div>
  );
}
