import { useRef, useState } from "react";

export default function VoiceRecorder({ onRecorded, onCancel }) {
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);

  const start = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    chunksRef.current = [];
    recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
    recorder.onstop = () => {
      stream.getTracks().forEach((t) => t.stop());
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      onRecorded(blob);
    };
    recorder.start();
    mediaRecorderRef.current = recorder;
    setRecording(true);
    setSeconds(0);
    timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
  };

  const stop = () => {
    mediaRecorderRef.current?.stop();
    clearInterval(timerRef.current);
    setRecording(false);
  };

  const cancel = () => {
    mediaRecorderRef.current?.stream.getTracks().forEach((t) => t.stop());
    mediaRecorderRef.current?.stop();
    clearInterval(timerRef.current);
    setRecording(false);
    onCancel();
  };

  if (!recording) {
    return (
      <button onClick={start} title="Record voice message" className="text-xl">
        🎤
      </button>
    );
  }

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  return (
    <div className="flex items-center gap-2 rounded-full bg-red-50 px-3 py-1 dark:bg-red-950">
      <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
      <span className="text-sm text-red-600 dark:text-red-400">
        {mm}:{ss}
      </span>
      <button onClick={cancel} className="text-sm text-gray-400 hover:text-gray-600">
        ✕
      </button>
      <button onClick={stop} className="text-sm font-medium text-brand-600 hover:underline">
        Send
      </button>
    </div>
  );
}
