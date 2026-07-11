import { useEffect, useRef } from "react";

// Small synthesized "ding" so we don't need an external sound file.
function playNotificationSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = 880;
    osc.type = "sine";
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.02);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.35);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.4);
  } catch {
    /* Web Audio unsupported - fail silently, not critical */
  }
}

// Requests notification permission once, then exposes a `notify` function
// that shows an OS-level notification (while this browser tab/window is
// open, including minimized/backgrounded - not when the browser itself is
// fully closed, which would need a bigger push-notification system), plays
// a short sound, and updates a lightweight unread badge on the tab title
// plus the OS app icon badge where the browser supports it.
export default function useMessageNotifications({ onNotificationClick }) {
  const permissionRequested = useRef(false);
  const baseTitleRef = useRef(document.title);

  useEffect(() => {
    if (!("Notification" in window)) return;
    if (Notification.permission === "default" && !permissionRequested.current) {
      permissionRequested.current = true;
      Notification.requestPermission();
    }
  }, []);

  const notify = (message, senderName, senderAvatar) => {
    playNotificationSound();

    if ("Notification" in window && Notification.permission === "granted" && document.visibilityState !== "visible") {
      const preview =
        message.type === "text" || message.type === "emoji"
          ? message.text
          : `Sent ${message.type === "image" ? "a photo" : message.type === "video" ? "a video" : message.type === "voice" || message.type === "audio" ? "a voice message" : "a file"}`;

      const n = new Notification(senderName, {
        body: preview,
        icon: senderAvatar || "/favicon.png",
        tag: `chatwave-${message.sender?._id || message.sender}`,
      });
      n.onclick = () => {
        window.focus();
        onNotificationClick?.(message.sender?._id || message.sender);
        n.close();
      };
    }
  };

  const setBadgeCount = (count) => {
    document.title = count > 0 ? `(${count}) ${baseTitleRef.current}` : baseTitleRef.current;
    if (navigator.setAppBadge) {
      if (count > 0) navigator.setAppBadge(count).catch(() => {});
      else navigator.clearAppBadge?.().catch(() => {});
    }
  };

  return { notify, setBadgeCount };
}
