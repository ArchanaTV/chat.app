import AmbientGlowBackground from "./AmbientGlowBackground.jsx";
import Logo from "./Logo.jsx";

// Shared dark-glass shell for Login and Register: ambient glowing background,
// a frosted glass card with a subtle border and soft shadow. No mascot —
// clean, minimal, "premium tech product" feel.
export default function AuthCard({ title, subtitle, children }) {
  return (
    <div className="relative flex min-h-screen-safe items-center justify-center overflow-hidden px-4 py-10">
      <AmbientGlowBackground />

      <div className="relative w-full max-w-sm">
        <div className="mb-6 flex justify-center">
          <Logo size={40} />
        </div>
        <div
          className="animate-fade-in rounded-3xl border border-white/10 p-8 shadow-2xl backdrop-blur-xl"
          style={{ background: "rgba(255,255,255,0.06)" }}
        >
          <h1 className="mb-1 text-center text-2xl font-semibold text-white">{title}</h1>
          {subtitle && <p className="mb-6 text-center text-sm text-white/50">{subtitle}</p>}
          {children}
        </div>
      </div>
    </div>
  );
}
