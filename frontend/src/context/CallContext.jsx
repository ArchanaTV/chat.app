import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useSocket } from "./SocketContext.jsx";
import { useAuth } from "./AuthContext.jsx";

const CallContext = createContext(null);

// Free public STUN server from Google - lets two browsers on most networks
// discover how to reach each other directly. Good enough for most home/office
// wifi. Some strict corporate or mobile networks may still fail to connect
// without a paid TURN relay server as a fallback - a real limitation of any
// browser calling app, not specific to this one.
const ICE_SERVERS = [{ urls: "stun:stun.l.google.com:19302" }];

export const CallProvider = ({ children }) => {
  const { socket } = useSocket();
  const { user } = useAuth();

  // idle -> calling (outgoing, ringing) -> active
  // idle -> ringing (incoming) -> active
  const [callStatus, setCallStatus] = useState("idle");
  const [callType, setCallType] = useState(null); // "audio" | "video"
  const [remoteUser, setRemoteUser] = useState(null); // { _id, username, avatarUrl }
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [error, setError] = useState("");

  const pcRef = useRef(null);
  const pendingCandidatesRef = useRef([]);
  const incomingOfferRef = useRef(null);

  const cleanup = useCallback(() => {
    pcRef.current?.close();
    pcRef.current = null;
    localStream?.getTracks().forEach((t) => t.stop());
    setLocalStream(null);
    setRemoteStream(null);
    setCallStatus("idle");
    setCallType(null);
    setRemoteUser(null);
    setMuted(false);
    setCameraOff(false);
    setError("");
    pendingCandidatesRef.current = [];
    incomingOfferRef.current = null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localStream]);

  const createPeerConnection = useCallback(
    (targetUserId) => {
      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

      pc.onicecandidate = (e) => {
        if (e.candidate) {
          socket?.emit("call:ice-candidate", { to: targetUserId, candidate: e.candidate });
        }
      };

      pc.ontrack = (e) => {
        setRemoteStream(e.streams[0]);
      };

      pc.onconnectionstatechange = () => {
        if (["failed", "disconnected", "closed"].includes(pc.connectionState)) {
          if (pc.connectionState === "failed") setError("Call connection failed");
        }
      };

      pcRef.current = pc;
      return pc;
    },
    [socket]
  );

  // ---- Outgoing call ----
  const startCall = useCallback(
    async (friend, type) => {
      try {
        setError("");
        setCallType(type);
        setRemoteUser(friend);
        setCallStatus("calling");

        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: type === "video",
        });
        setLocalStream(stream);

        const pc = createPeerConnection(friend._id);
        stream.getTracks().forEach((track) => pc.addTrack(track, stream));

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        socket?.emit("call:invite", { to: friend._id, callType: type, offer });
      } catch (err) {
        setError("Couldn't access camera/microphone");
        setTimeout(cleanup, 1500);
      }
    },
    [socket, createPeerConnection, cleanup]
  );

  // ---- Accept an incoming call ----
  const acceptCall = useCallback(async () => {
    if (!incomingOfferRef.current) return;
    const { from, offer, callType: type } = incomingOfferRef.current;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: type === "video",
      });
      setLocalStream(stream);

      const pc = createPeerConnection(from);
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      for (const candidate of pendingCandidatesRef.current) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      }
      pendingCandidatesRef.current = [];

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket?.emit("call:answer", { to: from, answer });
      setCallStatus("active");
    } catch (err) {
      setError("Couldn't access camera/microphone");
      setTimeout(cleanup, 1500);
    }
  }, [socket, createPeerConnection, cleanup]);

  const rejectCall = useCallback(() => {
    if (incomingOfferRef.current) {
      socket?.emit("call:reject", { to: incomingOfferRef.current.from });
    }
    cleanup();
  }, [socket, cleanup]);

  const endCall = useCallback(() => {
    if (remoteUser) {
      socket?.emit(callStatus === "calling" ? "call:cancel" : "call:end", { to: remoteUser._id });
    }
    cleanup();
  }, [socket, remoteUser, callStatus, cleanup]);

  const toggleMute = useCallback(() => {
    localStream?.getAudioTracks().forEach((t) => (t.enabled = muted));
    setMuted((m) => !m);
  }, [localStream, muted]);

  const toggleCamera = useCallback(() => {
    localStream?.getVideoTracks().forEach((t) => (t.enabled = cameraOff));
    setCameraOff((c) => !c);
  }, [localStream, cameraOff]);

  // ---- Socket listeners for incoming signaling ----
  useEffect(() => {
    if (!socket) return;

    const handleIncoming = ({ from, callType: type, offer }) => {
      // Busy handling: if already on/starting a call, auto-reject new ones
      if (callStatus !== "idle") {
        socket.emit("call:reject", { to: from });
        return;
      }
      incomingOfferRef.current = { from, offer, callType: type };
      setCallType(type);
      setRemoteUser({ _id: from });
      setCallStatus("ringing");
    };

    const handleAnswered = async ({ answer }) => {
      if (!pcRef.current) return;
      await pcRef.current.setRemoteDescription(new RTCSessionDescription(answer));
      for (const candidate of pendingCandidatesRef.current) {
        await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      }
      pendingCandidatesRef.current = [];
      setCallStatus("active");
    };

    const handleIceCandidate = async ({ candidate }) => {
      if (pcRef.current?.remoteDescription) {
        try {
          await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        } catch {
          /* ignore late/invalid candidates */
        }
      } else {
        pendingCandidatesRef.current.push(candidate);
      }
    };

    const handleRejected = () => {
      setError("Call declined");
      setTimeout(cleanup, 1200);
    };

    const handleEnded = () => cleanup();
    const handleCancelled = () => cleanup();

    socket.on("call:incoming", handleIncoming);
    socket.on("call:answered", handleAnswered);
    socket.on("call:ice-candidate", handleIceCandidate);
    socket.on("call:rejected", handleRejected);
    socket.on("call:ended", handleEnded);
    socket.on("call:cancelled", handleCancelled);

    return () => {
      socket.off("call:incoming", handleIncoming);
      socket.off("call:answered", handleAnswered);
      socket.off("call:ice-candidate", handleIceCandidate);
      socket.off("call:rejected", handleRejected);
      socket.off("call:ended", handleEnded);
      socket.off("call:cancelled", handleCancelled);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, callStatus, cleanup]);

  return (
    <CallContext.Provider
      value={{
        callStatus,
        callType,
        remoteUser,
        localStream,
        remoteStream,
        muted,
        cameraOff,
        error,
        startCall,
        acceptCall,
        rejectCall,
        endCall,
        toggleMute,
        toggleCamera,
        currentUser: user,
      }}
    >
      {children}
    </CallContext.Provider>
  );
};

export const useCall = () => useContext(CallContext);
