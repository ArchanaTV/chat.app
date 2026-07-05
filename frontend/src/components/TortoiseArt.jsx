// The tortoise artwork, reused everywhere the mascot appears (splash screen,
// floating companion, empty states, loaders). Flippers/tail are separate
// elements so CSS animations (blink, flap, wag) can be applied via className
// props without redrawing the shape each time.
export default function TortoiseArt({
  width = 90,
  eyesClosed = false,
  flipperTopClass = "",
  flipperBottomClass = "",
  tailClass = "",
}) {
  return (
    <svg width={width} height={(width * 140) / 190} viewBox="0 0 200 140">
      <path className={tailClass} d="M55,71 L35,60 L38,71 L35,82 Z" fill="#3f9c6b" />
      <path className={flipperBottomClass} d="M138,92 Q112,108 96,128 Q118,120 138,100 Z" fill="#4caf6b" />
      <ellipse cx="102" cy="70" rx="58" ry="37" fill="#1f6b4a" />
      <path d="M58,58 Q102,40 146,58" stroke="#3f9c6b" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M52,78 Q102,98 152,78" stroke="#3f9c6b" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M102,35 L102,105" stroke="#3f9c6b" strokeWidth="2.5" fill="none" opacity="0.7" />
      <ellipse cx="102" cy="96" rx="46" ry="12" fill="#eef2c0" opacity="0.5" />
      <path className={flipperTopClass} d="M138,50 Q112,32 96,12 Q118,20 138,42 Z" fill="#4caf6b" />
      <circle cx="163" cy="58" r="21" fill="#4fae6f" />
      {eyesClosed ? (
        <path d="M166,51 Q171,55 176,51" stroke="#1b1b1b" strokeWidth="2" fill="none" strokeLinecap="round" />
      ) : (
        <>
          <circle cx="171" cy="51" r="3.2" fill="#1b1b1b" />
          <circle cx="172" cy="49.5" r="1" fill="#ffffff" />
        </>
      )}
      <path d="M156,66 Q166,73 177,64" stroke="#1b1b1b" strokeWidth="2" fill="none" strokeLinecap="round" />
    </svg>
  );
}
