// ChatWave's mark: a simple abstract "wave" glyph in a rounded gradient
// square, plus the wordmark. This is the one logo used everywhere - the
// splash screen, the sidebar, and the login/register pages - so it's built
// as real code (not an image file) to guarantee it always renders the same
// way, with no risk of a missing-asset fallback.
export default function Logo({ size = 32, showText = true, className = "" }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div
        className="flex shrink-0 items-center justify-center rounded-xl"
        style={{ width: size, height: size, background: "linear-gradient(135deg, var(--accent-from), var(--accent-to))" }}
      >
        <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 24 24" fill="none">
          <path
            d="M4 12c1.5-3 3.5-3 5 0s3.5 3 5 0 3.5-3 5 0"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      {showText && (
        <span
          className="bg-gradient-to-r from-indigo-300 to-sky-300 bg-clip-text font-bold text-transparent"
          style={{ fontSize: size * 0.55 }}
        >
          ChatWave
        </span>
      )}
    </div>
  );
}
