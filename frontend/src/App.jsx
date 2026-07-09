import { useState } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "./context/AuthContext.jsx";
import { SocketProvider } from "./context/SocketContext.jsx";
import { CallProvider } from "./context/CallContext.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Chat from "./pages/Chat.jsx";
import SplashScreen from "./components/SplashScreen.jsx";

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <FullScreenLoader />;
  return user ? children : <Navigate to="/login" replace />;
}

function FullScreenLoader() {
  return (
    <div className="flex h-screen-safe w-full items-center justify-center bg-[#0a0e1f]">
      <div className="relative h-10 w-10">
        <div className="absolute inset-0 animate-spin rounded-full border-2 border-indigo-400/20 border-t-indigo-400" />
        <div className="absolute inset-1.5 animate-pulse rounded-full bg-indigo-400/10 blur-sm" />
      </div>
    </div>
  );
}

// Fades + slightly slides each page in/out as the route changes, so moving
// between login, register, and the chat app feels like one continuous,
// premium experience instead of an abrupt jump cut.
function PageTransition({ children }) {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

export default function App() {
  const { user, loading } = useAuth();
  const [showSplash, setShowSplash] = useState(true);

  if (showSplash) return <SplashScreen onDone={() => setShowSplash(false)} />;
  if (loading) return <FullScreenLoader />;

  return (
    <PageTransition>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
        <Route path="/register" element={user ? <Navigate to="/" replace /> : <Register />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <SocketProvider>
                <CallProvider>
                  <Chat />
                </CallProvider>
              </SocketProvider>
            </PrivateRoute>
          }
        />
      </Routes>
    </PageTransition>
  );
}
