import { useState } from "react";
import { Lock, MessageCircle, CheckCircle2 } from "lucide-react";

// Shared visual shell for the Login and Register pages: a soft purple/lavender
// scene with floating icon badges, sparkles, potted plants in the corners,
// and a rounded card with the tortoise "peeking" over the top edge. Login.jsx
// and Register.jsx just pass their own form fields in as children.
export default function AuthCard({ title, subtitle, children }) {
  const sparkles = [
    { left: "12%", top: "18%", delay: "0s" },
    { left: "85%", top: "14%", delay: "0.8s" },
    { left: "20%", top: "70%", delay: "1.6s" },
    { left: "88%", top: "62%", delay: "0.4s" },
    { left: "50%", top: "8%", delay: "1.2s" },
  ];

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10" style={{ background: "linear-gradient(135deg, #e9e3fb 0%, #eddcf2 45%, #f6dfe8 100%)" }}>
      <style>{`
        @keyframes authCardTwinkle {
          0%, 100% { opacity: 0.2; transform: scale(0.8); }
          50%      { opacity: 1; transform: scale(1.1); }
        }
        @keyframes authCardFloat {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-8px); }
        }
        @keyframes authTortoiseBob2 {
          0%, 100% { transform: translateY(0) rotate(-1.5deg); }
          50%      { transform: translateY(-5px) rotate(1.5deg); }
        }
        @keyframes leafSway {
          0%, 100% { transform: rotate(-3deg); }
          50%      { transform: rotate(3deg); }
        }
        .auth-sparkle-2 { position: absolute; animation: authCardTwinkle 2.6s ease-in-out infinite; }
        .auth-badge-float { animation: authCardFloat 4.5s ease-in-out infinite; }
        .auth-tortoise-peek { animation: authTortoiseBob2 4s ease-in-out infinite; }
        .auth-leaf { transform-origin: bottom center; animation: leafSway 3.5s ease-in-out infinite; }
      `}</style>

      {/* floating sparkles across the scene */}
      {sparkles.map((s, i) => (
        <span
          key={i}
          className="auth-sparkle-2 text-purple-300"
          style={{ left: s.left, top: s.top, animationDelay: s.delay }}
        >
          ✦
        </span>
      ))}

      {/* floating icon badges */}
      <div
        className="auth-badge-float absolute left-[8%] top-[16%] flex h-12 w-12 items-center justify-center rounded-2xl shadow-lg md:left-[20%]"
        style={{ background: "linear-gradient(135deg, #b79cf2, #8f7ee0)", animationDelay: "0.3s" }}
      >
        <MessageCircle size={22} color="white" />
      </div>
      <div
        className="auth-badge-float absolute right-[8%] top-[14%] flex h-12 w-12 items-center justify-center rounded-2xl shadow-lg md:right-[20%]"
        style={{ background: "linear-gradient(135deg, #f0a8c0, #e78bb0)", animationDelay: "1s" }}
      >
        <Lock size={20} color="white" />
      </div>
      <div
        className="auth-badge-float absolute right-[10%] top-[42%] hidden h-10 w-10 items-center justify-center rounded-full shadow-lg md:right-[22%] md:flex"
        style={{ background: "linear-gradient(135deg, #f6b98a, #f0937f)", animationDelay: "0.6s" }}
      >
        <CheckCircle2 size={18} color="white" />
      </div>

      {/* potted plant decorations in the corners */}
      <PottedPlant className="absolute bottom-0 left-[3%] hidden sm:block" />
      <PottedPlant className="absolute bottom-0 right-[3%] hidden sm:block" flip />

      {/* the card itself */}
      <div className="relative w-full max-w-sm">
        {/* tortoise mascot floating above the top edge of the card */}
        <div className="auth-tortoise-peek absolute -top-24 left-1/2 z-10 -translate-x-1/2 drop-shadow-xl">
          <img src="/tortoise-mascot.png" alt="ChatWave tortoise" style={{ width: 220, height: "auto" }} draggable={false} />
        </div>

        <div className="relative animate-fade-in rounded-[2rem] bg-white/95 px-8 pb-8 pt-24 shadow-2xl backdrop-blur">
          <h1 className="mb-1 text-center text-2xl font-bold text-[#3a2a55]">{title}</h1>
          {subtitle && <p className="mb-6 text-center text-sm text-gray-500">{subtitle}</p>}
          {children}
        </div>
      </div>
    </div>
  );
}

function PottedPlant({ className = "", flip = false }) {
  return (
    <svg
      className={className}
      width="90"
      height="130"
      viewBox="0 0 90 130"
      style={flip ? { transform: "scaleX(-1)" } : undefined}
    >
      <g className="auth-leaf">
        <path d="M45,70 C20,60 15,25 40,10 C45,35 45,55 45,70 Z" fill="#8fbf8a" />
      </g>
      <g className="auth-leaf" style={{ animationDelay: "0.6s" }}>
        <path d="M45,70 C70,58 78,22 50,8 C46,32 45,55 45,70 Z" fill="#a9d19f" />
      </g>
      <g className="auth-leaf" style={{ animationDelay: "1.1s" }}>
        <path d="M45,68 C40,45 45,20 45,5 C55,25 55,50 45,68 Z" fill="#7fae7a" />
      </g>
      <path d="M25,72 L65,72 L60,120 Q45,128 30,120 Z" fill="#d98a5e" />
      <path d="M25,72 L65,72 L63,82 L27,82 Z" fill="#c97a4e" />
    </svg>
  );
}
