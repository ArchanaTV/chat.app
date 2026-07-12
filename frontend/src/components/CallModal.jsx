import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, PhoneOff, Video, VideoOff, Mic, MicOff, Volume2, Pause, Play, Speaker } from "lucide-react";
import { useCall } from "../context/CallContext.jsx";
import Avatar from "./Avatar.jsx";

// Renders nothing when there's no call in progress. `friends` is passed in
// so an incoming call (which only carries the caller's id over the socket)
// can be matched up with a name/avatar we already have loaded.
export default function CallModal({ friends }) {
  const {
    callStatus,
    callType,
    remoteUser,
    localStream,
    remoteStream,
    muted,
    cameraOff,
    onHold,
    error,
    endedReason,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleCamera,
    toggleHold,
  } = useCall();

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const [duration, setDuration] = useState(0);
  const [speakerOn, setSpeakerOn] = useState(false);
  const [outputDevices, setOutputDevices] = useState([]);
  const [showOutputPicker, setShowOutputPicker] = useState(false);

  const friendInfo = friends?.find((f) => f._id === remoteUser?._id) || remoteUser;

  useEffect(() => {
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = localStream || null;
      if (localStream) localVideoRef.current.play().catch(() => {});
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream || null;
      if (remoteStream) remoteVideoRef.current.play().catch(() => {});
    }
    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = remoteStream || null;
      if (remoteStream) remoteAudioRef.current.play().catch(() => {});
    }
  }, [remoteStream]);

  useEffect(() => {
    if (callStatus !== "active") {
      setDuration(0);
      return;
    }
    const t = setInterval(() => setDuration((d) => d + 1), 1000);
    return () => clearInterval(t);
  }, [callStatus]);

  // Best-effort audio output device list - only works in browsers that
  // support setSinkId (Chrome desktop/Android). Safari/iOS will just show
  // no alternate devices, which is an honest Apple platform limitation.
  useEffect(() => {
    if (callStatus !== "active" || !navigator.mediaDevices?.enumerateDevices) return;
    navigator.mediaDevices.enumerateDevices().then((devices) => {
      const outputs = devices.filter((d) => d.kind === "audiooutput");
      setOutputDevices(outputs);
      // Default to the earpiece (quiet) output rather than the loud
      // speaker, matching "off unless I turn it on". Only works where the
      // browser both exposes device labels and supports setSinkId.
      const earpiece = outputs.find((d) => /ear/i.test(d.label));
      if (earpiece) selectOutput(earpiece.deviceId, false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [callStatus]);

  const selectOutput = async (deviceId, closePicker = true) => {
    if (closePicker) setShowOutputPicker(false);
    const target = callType === "video" ? remoteVideoRef.current : remoteAudioRef.current;
    if (target?.setSinkId) {
      try {
        await target.setSinkId(deviceId);
      } catch {
        /* unsupported on this browser/platform */
      }
    }
  };

  const toggleSpeaker = () => {
    const next = !speakerOn;
    setSpeakerOn(next);
    const speakerDevice = outputDevices.find((d) => /speaker/i.test(d.label));
    const earpieceDevice = outputDevices.find((d) => /ear/i.test(d.label));
    if (next && speakerDevice) selectOutput(speakerDevice.deviceId, false);
    else if (!next && earpieceDevice) selectOutput(earpieceDevice.deviceId, false);
    // On browsers/platforms without labeled output devices (most mobile
    // Safari, some Android setups), this toggle is visual-only - actual
    // hardware audio routing on a website has real, honest limits.
  };

  if (callStatus === "idle") return null;

  const mm = String(Math.floor(duration / 60)).padStart(2, "0");
  const ss = String(duration % 60).padStart(2, "0");

  const statusText = {
    calling: "Calling...",
    ringing: "Incoming call...",
    active: onHold ? "On hold" : `${mm}:${ss}`,
    ended: endedReason || "Call ended",
  }[callStatus];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] flex flex-col items-center justify-center overflow-hidden bg-[#05070f]/97 backdrop-blur-xl"
      >
        {/* animated ambient background */}
        <motion.div
          className="absolute rounded-full"
          style={{ width: 500, height: 500, background: "radial-gradient(circle, rgba(99,102,241,0.25), transparent 70%)" }}
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />

        {callType === "audio" && <audio ref={remoteAudioRef} autoPlay />}

        {error && (
          <div className="absolute top-6 z-10 rounded-full border border-red-400/30 bg-red-400/10 px-4 py-1.5 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* ---- Incoming call (ringing) ---- */}
        {callStatus === "ringing" && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative z-10 flex flex-col items-center gap-4"
          >
            <PulsingAvatar user={friendInfo} />
            <div className="text-center">
              <p className="text-2xl font-semibold text-white">{friendInfo?.username || "Someone"}</p>
              <p className="mt-1 text-sm text-white/50">{callType === "video" ? "Incoming video call" : "Incoming voice call"}</p>
            </div>
            <div className="mt-8 flex gap-10">
              <CallButton onClick={rejectCall} color="red" icon={<PhoneOff size={24} />} label="Decline" />
              <CallButton onClick={acceptCall} color="green" icon={<Phone size={24} />} label="Accept" pulse />
            </div>
          </motion.div>
        )}

        {/* ---- Outgoing call (calling) ---- */}
        {callStatus === "calling" && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative z-10 flex flex-col items-center gap-4"
          >
            <PulsingAvatar user={friendInfo} />
            <div className="text-center">
              <p className="text-2xl font-semibold text-white">{friendInfo?.username}</p>
              <p className="mt-1 text-sm text-white/50">{statusText}</p>
            </div>
            <div className="mt-8">
              <CallButton onClick={endCall} color="red" icon={<PhoneOff size={24} />} label="Cancel" />
            </div>
          </motion.div>
        )}

        {/* ---- Call ended (brief terminal screen) ---- */}
        {callStatus === "ended" && (
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative z-10 flex flex-col items-center gap-4"
          >
            <Avatar user={friendInfo} size={88} />
            <div className="text-center">
              <p className="text-xl font-semibold text-white">{friendInfo?.username}</p>
              <p className="mt-1 text-sm text-white/50">{statusText}</p>
            </div>
          </motion.div>
        )}

        {/* ---- Active call ---- */}
        {callStatus === "active" && (
          <div className="relative z-10 flex h-full w-full flex-col items-center justify-center">
            {callType === "video" ? (
              <>
                <video ref={remoteVideoRef} autoPlay playsInline className="absolute inset-0 h-full w-full object-cover" />
                {!remoteStream && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <PulsingAvatar user={friendInfo} />
                  </div>
                )}
                <motion.video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute bottom-28 right-4 h-32 w-24 rounded-2xl border border-white/10 object-cover shadow-2xl sm:h-40 sm:w-28"
                  style={{ transform: "scaleX(-1)" }}
                />
              </>
            ) : (
              <PulsingAvatar user={friendInfo} />
            )}

            <div className={`${callType === "video" ? "absolute top-6" : "mt-4"} flex flex-col items-center gap-1`}>
              {callType !== "video" && <p className="text-xl font-semibold text-white">{friendInfo?.username}</p>}
              <div className="rounded-full border border-white/10 bg-white/5 px-4 py-1.5 backdrop-blur">
                <p className="text-sm text-white/80">{statusText}</p>
              </div>
            </div>

            {/* output device picker */}
            <AnimatePresence>
              {showOutputPicker && outputDevices.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  className="absolute bottom-28 z-20 w-56 rounded-2xl border border-white/10 bg-gray-900/95 p-2 shadow-2xl backdrop-blur-xl"
                >
                  {outputDevices.map((d) => (
                    <button
                      key={d.deviceId}
                      onClick={() => selectOutput(d.deviceId)}
                      className="block w-full rounded-xl px-3 py-2 text-left text-sm text-white/80 hover:bg-white/10"
                    >
                      {d.label || "Audio device"}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            <div className={`${callType === "video" ? "absolute bottom-6" : "mt-10"} flex flex-wrap items-center justify-center gap-3`}>
              <CallButton onClick={toggleMute} color={muted ? "red" : "glass"} icon={muted ? <MicOff size={18} /> : <Mic size={18} />} small />
              {callType === "video" && (
                <CallButton
                  onClick={toggleCamera}
                  color={cameraOff ? "red" : "glass"}
                  icon={cameraOff ? <VideoOff size={18} /> : <Video size={18} />}
                  small
                />
              )}
              <CallButton
                onClick={toggleSpeaker}
                color={speakerOn ? "active" : "glass"}
                icon={speakerOn ? <Volume2 size={18} /> : <Speaker size={18} />}
                small
              />
              <CallButton onClick={toggleHold} color={onHold ? "active" : "glass"} icon={onHold ? <Play size={18} /> : <Pause size={18} />} small />
              {outputDevices.length > 0 && (
                <CallButton onClick={() => setShowOutputPicker((s) => !s)} color="glass" icon={<Speaker size={18} />} small />
              )}
              <CallButton onClick={endCall} color="red" icon={<PhoneOff size={20} />} />
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

function PulsingAvatar({ user }) {
  return (
    <div className="relative">
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{ background: "radial-gradient(circle, rgba(99,102,241,0.4), transparent 70%)" }}
        animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0.2, 0.6] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
      />
      <Avatar user={user} size={96} />
    </div>
  );
}

function CallButton({ onClick, color, icon, label, small, pulse }) {
  const colorClasses = {
    red: "bg-red-500 hover:bg-red-600",
    green: "bg-green-500 hover:bg-green-600",
    glass: "border border-white/10 bg-white/10 hover:bg-white/20",
    active: "bg-indigo-500 hover:bg-indigo-600",
  };
  const size = small ? "h-12 w-12" : "h-16 w-16";
  return (
    <div className="flex flex-col items-center gap-1.5">
      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        animate={pulse ? { scale: [1, 1.08, 1] } : {}}
        transition={pulse ? { duration: 1.2, repeat: Infinity } : {}}
        onClick={onClick}
        className={`flex ${size} items-center justify-center rounded-full text-white shadow-lg transition ${colorClasses[color]}`}
      >
        {icon}
      </motion.button>
      {label && <span className="text-xs text-white/50">{label}</span>}
    </div>
  );
}
