import { useState } from "react";

// Drop your logo file at frontend/public/logo.png (any size, transparent PNG works best)
// and this will automatically show it everywhere instead of the text fallback.
export default function Logo({ size = 32, showText = true, className = "" }) {
  const [imgFailed, setImgFailed] = useState(false);

  if (imgFailed) {
    return <span className={`text-xl font-bold text-brand-600 ${className}`}>ChatWave</span>;
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <img
        src="/logo.png"
        alt="ChatWave logo"
        style={{ height: size, width: "auto" }}
        onError={() => setImgFailed(true)}
      />
      {showText && <span className="text-xl font-bold text-brand-600">ChatWave</span>}
    </div>
  );
}
