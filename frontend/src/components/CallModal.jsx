import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, PhoneOff, Video, VideoOff, Mic, MicOff } from "lucide-react";
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
    error,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleCamera,
  } = useCall();

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const [duration, setDuration] = useState(0);

  const friendInfo = friends?.find((f) => f._id === remoteUser?._id) || remoteUser;

  useEffect(() => {
    if (localVideoRef.current) localVideoRef.current.srcObject = localStream || null;
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream || null;
    if (remoteAudioRef.current) remoteAudioRef.current.srcObject = remoteStream || null;
  }, [remoteStream]);

  useEffect(() => {
    if (callStatus !== "active") {
      setDuration(0);
      return;
    }
    const t = setInterval(() => setDuration((d) => d + 1), 1000);
    return () => clearInterval(t);
  }, [callStatus]);

  if (callStatus === "idle") return null;

  const mm = String(Math.floor(duration / 60)).padStart(2, "0");
  const ss = String(duration % 60).padStart(2, "0");

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-[#05070f]/95 backdrop-blur-xl"
      >
        {/* hidden audio element carries remote sound for voice-only calls */}
        {callType === "audio" && <audio ref={remoteAudioRef} autoPlay />}

        {error && (
          <div className="absolute top-6 rounded-full border border-red-400/30 bg-red-400/10 px-4 py-1.5 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* ---- Incoming call (ringing) ---- */}
        {callStatus === "ringing" && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex flex-col items-center gap-4"
          >
            <PulsingAvatar user={friendInfo} />
            <div className="text-center">
              <p className="text-xl font-semibold text-white">{friendInfo?.username || "Someone"}</p>
              <p className="text-sm text-white/50">Incoming {callType === "video" ? "video" : "voice"} call...</p>
            </div>
            <div className="mt-6 flex gap-6">
              <CallButton onClick={rejectCall} color="red" icon={<PhoneOff size={22} />} label="Decline" />
              <CallButton onClick={acceptCall} color="green" icon={<Phone size={22} />} label="Accept" />
            </div>
          </motion.div>
        )}

        {/* ---- Outgoing call (calling / ringing on their end) ---- */}
        {callStatus === "calling" && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex flex-col items-center gap-4"
          >
            <PulsingAvatar user={friendInfo} />
            <div className="text-center">
              <p className="text-xl font-semibold text-white">{friendInfo?.username}</p>
              <p className="text-sm text-white/50">Calling...</p>
            </div>
            <div className="mt-6">
              <CallButton onClick={endCall} color="red" icon={<PhoneOff size={22} />} label="Cancel" />
            </div>
          </motion.div>
        )}

        {/* ---- Active call ---- */}
        {callStatus === "active" && (
          <div className="relative flex h-full w-full flex-col items-center justify-center">
            {callType === "video" ? (
              <>
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="absolute inset-0 h-full w-full object-cover"
                />
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
                  className="absolute bottom-24 right-4 h-32 w-24 rounded-2xl border border-white/10 object-cover shadow-2xl sm:h-40 sm:w-28"
                  style={{ transform: "scaleX(-1)" }}
                />
              </>
            ) : (
              <PulsingAvatar user={friendInfo} />
            )}

            <div className={`${callType === "video" ? "absolute top-6" : "mt-4"} rounded-full border border-white/10 bg-white/5 px-4 py-1.5 backdrop-blur`}>
              <p className="text-sm text-white/80">
                {friendInfo?.username} · {mm}:{ss}
              </p>
            </div>

            <div className={`${callType === "video" ? "absolute bottom-6" : "mt-8"} flex gap-4`}>
              <CallButton onClick={toggleMute} color={muted ? "red" : "glass"} icon={muted ? <MicOff size={18} /> : <Mic size={18} />} small />
              {callType === "video" && (
                <CallButton
                  onClick={toggleCamera}
                  color={cameraOff ? "red" : "glass"}
                  icon={cameraOff ? <VideoOff size={18} /> : <Video size={18} />}
                  small
                />
              )}
              <CallButton onClick={endCall} color="red" icon={<PhoneOff size={18} />} small />
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

function CallButton({ onClick, color, icon, label, small }) {
  const colorClasses = {
    red: "bg-red-500 hover:bg-red-600",
    green: "bg-green-500 hover:bg-green-600",
    glass: "border border-white/10 bg-white/10 hover:bg-white/20",
  };
  const size = small ? "h-12 w-12" : "h-16 w-16";
  return (
    <div className="flex flex-col items-center gap-1.5">
      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        onClick={onClick}
        className={`flex ${size} items-center justify-center rounded-full text-white shadow-lg transition ${colorClasses[color]}`}
      >
        {icon}
      </motion.button>
      {label && <span className="text-xs text-white/50">{label}</span>}
    </div>
  );
}
