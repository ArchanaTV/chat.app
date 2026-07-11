// Ringtones and call tones, synthesized directly with the Web Audio API
// instead of shipping audio files. Keeps the app lightweight and avoids
// licensing/asset concerns entirely.
let audioCtx = null;
let activeLoop = null;

function getCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}

function beep(ctx, freq, startTime, duration, gain = 0.15) {
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.frequency.value = freq;
  osc.type = "sine";
  g.gain.setValueAtTime(0, startTime);
  g.gain.linearRampToValueAtTime(gain, startTime + 0.02);
  g.gain.linearRampToValueAtTime(0, startTime + duration);
  osc.connect(g);
  g.connect(ctx.destination);
  osc.start(startTime);
  osc.stop(startTime + duration + 0.05);
}

function startLoop(pattern, patternDuration) {
  stopAll();
  const ctx = getCtx();
  const play = () => {
    const now = ctx.currentTime;
    pattern.forEach(([freq, offset, dur]) => beep(ctx, freq, now + offset, dur));
  };
  play();
  activeLoop = setInterval(play, patternDuration);
}

// Classic two-tone ringback (what the caller hears while it rings on the other end)
export function playRingback() {
  startLoop([[480, 0, 1], [440, 0, 1]], 3000);
}

// Slightly brighter repeating tone for an incoming call
export function playIncomingRingtone() {
  startLoop(
    [
      [900, 0, 0.3],
      [900, 0.4, 0.3],
    ],
    1600
  );
}

export function playEndTone() {
  stopAll();
  const ctx = getCtx();
  const now = ctx.currentTime;
  beep(ctx, 500, now, 0.15);
  beep(ctx, 350, now + 0.18, 0.25);
}

export function stopAll() {
  if (activeLoop) {
    clearInterval(activeLoop);
    activeLoop = null;
  }
}
