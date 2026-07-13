import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Search,
  User,
  ShieldOff,
  Lock,
  Bell,
  Phone,
  Palette,
  HardDrive,
  Accessibility,
  Info,
  ChevronRight,
  Mail,
  Star,
  MessageSquare,
} from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { useSettings } from "../context/SettingsContext.jsx";
import api from "../api/axios.js";
import BlockedContactsPage from "./BlockedContactsPage.jsx";

export default function SettingsPage({ onClose, onOpenProfile }) {
  const { user, setUser, logout } = useAuth();
  const { settings, updateSetting, accentPresets } = useSettings();
  const [query, setQuery] = useState("");
  const [subView, setSubView] = useState(null); // null | "blocked"
  const [storageInfo, setStorageInfo] = useState(null);

  useMemo(() => {
    if (navigator.storage?.estimate) {
      navigator.storage.estimate().then((est) => setStorageInfo(est));
    }
  }, []);

  const updatePrivacy = async (key, value) => {
    const { data } = await api.put("/users/me/privacy", { [key]: value });
    setUser(data.user);
  };

  if (subView === "blocked") {
    return (
      <Overlay onClose={onClose}>
        <BlockedContactsPage onBack={() => setSubView(null)} />
      </Overlay>
    );
  }

  const usedMB = storageInfo ? (storageInfo.usage / 1024 / 1024).toFixed(1) : null;
  const quotaMB = storageInfo ? (storageInfo.quota / 1024 / 1024).toFixed(0) : null;
  const usedPct = storageInfo ? Math.min(100, (storageInfo.usage / storageInfo.quota) * 100) : 0;

  const sections = [
    {
      id: "account",
      icon: User,
      title: "Account",
      rows: [
        { label: "Profile", desc: "Username, bio, and photo", type: "nav", onClick: onOpenProfile },
        { label: "Log Out", desc: "Sign out of ChatWave on this device", type: "nav", onClick: logout, danger: true },
      ],
    },
    {
      id: "privacy",
      icon: Lock,
      title: "Privacy & Security",
      rows: [
        {
          label: "Last Seen & Online",
          desc: "Let friends see when you were last active",
          type: "toggle",
          value: user.privacy?.showLastSeen !== false,
          onChange: (v) => updatePrivacy("showLastSeen", v),
        },
        {
          label: "Read Receipts",
          desc: "Let friends see when you've read their messages",
          type: "toggle",
          value: user.privacy?.showReadReceipts !== false,
          onChange: (v) => updatePrivacy("showReadReceipts", v),
        },
        {
          label: "Typing Indicator",
          desc: "Let friends see when you're typing",
          type: "toggle",
          value: user.privacy?.showTypingIndicator !== false,
          onChange: (v) => updatePrivacy("showTypingIndicator", v),
        },
      ],
    },
    {
      id: "blocked",
      icon: ShieldOff,
      title: "Blocked Contacts",
      rows: [{ label: "Manage Blocked Contacts", desc: "See and unblock people you've blocked", type: "nav", onClick: () => setSubView("blocked") }],
    },
    {
      id: "appearance",
      icon: Palette,
      title: "Appearance",
      rows: [
        {
          label: "Accent Color",
          desc: "Changes the color used across buttons and messages",
          type: "colors",
          value: settings.accent,
          onChange: (v) => updateSetting("accent", v),
        },
        {
          label: "Reduce Motion",
          desc: "Minimize animations throughout the app",
          type: "toggle",
          value: settings.reduceMotion,
          onChange: (v) => updateSetting("reduceMotion", v),
        },
      ],
    },
    {
      id: "notifications",
      icon: Bell,
      title: "Notifications",
      rows: [
        {
          label: "Notification Sound",
          desc: "Play a sound for new messages",
          type: "toggle",
          value: settings.notificationSound,
          onChange: (v) => updateSetting("notificationSound", v),
        },
        {
          label: "Browser Permission",
          desc:
            "Notification" in window
              ? Notification.permission === "granted"
                ? "Enabled — you'll get notified even when the tab is in the background"
                : "Tap to allow notifications"
              : "Not supported in this browser",
          type: "action",
          actionLabel: "Notification" in window && Notification.permission !== "granted" ? "Enable" : null,
          onClick: () => "Notification" in window && Notification.requestPermission(),
        },
      ],
    },
    {
      id: "calls",
      icon: Phone,
      title: "Calls",
      rows: [
        {
          label: "Noise Cancellation",
          desc: "Reduce background noise on your microphone during calls",
          type: "toggle",
          value: settings.noiseCancellation,
          onChange: (v) => updateSetting("noiseCancellation", v),
        },
        {
          label: "Echo Cancellation",
          desc: "Prevent audio feedback/echo during calls",
          type: "toggle",
          value: settings.echoCancellation,
          onChange: (v) => updateSetting("echoCancellation", v),
        },
      ],
    },
    {
      id: "storage",
      icon: HardDrive,
      title: "Storage & Data",
      rows: [
        {
          label: "Storage Usage",
          desc: storageInfo ? `${usedMB} MB used of ${quotaMB} MB available in this browser` : "Calculating...",
          type: "storage",
          value: usedPct,
        },
      ],
    },
    {
      id: "accessibility",
      icon: Accessibility,
      title: "Accessibility",
      rows: [
        {
          label: "Larger Text",
          desc: "Increase text size throughout the app",
          type: "toggle",
          value: settings.largerText,
          onChange: (v) => updateSetting("largerText", v),
        },
        {
          label: "High Contrast Mode",
          desc: "Boost text and border contrast for readability",
          type: "toggle",
          value: settings.highContrast,
          onChange: (v) => updateSetting("highContrast", v),
        },
      ],
    },
    {
      id: "about",
      icon: Info,
      title: "About",
      rows: [
        { label: "App Version", desc: "ChatWave 1.0", type: "static" },
        { label: "Contact Support", desc: "Reach out for help", type: "link", href: "mailto:support@chatwave.app", linkIcon: Mail },
        { label: "Send Feedback", desc: "Tell us what you think", type: "link", href: "mailto:feedback@chatwave.app", linkIcon: MessageSquare },
        { label: "Rate ChatWave", desc: "Enjoying the app?", type: "static", linkIcon: Star },
      ],
    },
  ];

  const filteredSections = query
    ? sections
        .map((s) => ({
          ...s,
          rows: s.rows.filter(
            (r) => r.label.toLowerCase().includes(query.toLowerCase()) || r.desc?.toLowerCase().includes(query.toLowerCase())
          ),
        }))
        .filter((s) => s.rows.length > 0)
    : sections;

  return (
    <Overlay onClose={onClose}>
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
        <h2 className="text-lg font-semibold text-white">Settings</h2>
        <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-full text-white/50 hover:bg-white/10 hover:text-white">
          <X size={18} />
        </button>
      </div>

      <div className="border-b border-white/10 p-4">
        <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
          <Search size={16} className="text-white/40" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search settings..."
            className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/30"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {filteredSections.length === 0 ? (
          <p className="py-8 text-center text-sm text-white/30">No settings match "{query}"</p>
        ) : (
          filteredSections.map((section) => (
            <div key={section.id} className="mb-5">
              <div className="mb-2 flex items-center gap-2 px-1 text-sm font-semibold text-white/70">
                <section.icon size={15} />
                {section.title}
              </div>
              <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
                {section.rows.map((row, i) => (
                  <SettingRow key={i} row={row} accentPresets={accentPresets} isLast={i === section.rows.length - 1} />
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </Overlay>
  );
}

function SettingRow({ row, accentPresets, isLast }) {
  return (
    <div className={`flex items-center justify-between gap-3 px-4 py-3 ${!isLast ? "border-b border-white/5" : ""}`}>
      <div className="min-w-0">
        <p className={`text-sm font-medium ${row.danger ? "text-red-400" : "text-white"}`}>{row.label}</p>
        {row.desc && <p className="mt-0.5 text-xs text-white/40">{row.desc}</p>}
        {row.type === "storage" && (
          <div className="mt-2 h-1.5 w-40 overflow-hidden rounded-full bg-white/10">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${row.value}%` }}
              transition={{ duration: 0.6 }}
              className="h-full rounded-full"
              style={{ background: "linear-gradient(90deg, var(--accent-from), var(--accent-to))" }}
            />
          </div>
        )}
        {row.type === "colors" && (
          <div className="mt-2 flex gap-2">
            {Object.entries(accentPresets).map(([key, preset]) => (
              <button
                key={key}
                onClick={() => row.onChange(key)}
                title={preset.label}
                className="h-6 w-6 rounded-full transition"
                style={{
                  background: `linear-gradient(135deg, ${preset.from}, ${preset.to})`,
                  boxShadow: row.value === key ? "0 0 0 2px white" : "none",
                }}
              />
            ))}
          </div>
        )}
      </div>

      {row.type === "toggle" && <Toggle checked={row.value} onChange={row.onChange} />}
      {row.type === "nav" && (
        <button onClick={row.onClick} className="text-white/30">
          <ChevronRight size={18} />
        </button>
      )}
      {row.type === "action" && row.actionLabel && (
        <button
          onClick={row.onClick}
          className="shrink-0 rounded-full px-3 py-1.5 text-xs font-medium text-white"
          style={{ background: "linear-gradient(135deg, var(--accent-from), var(--accent-to))" }}
        >
          {row.actionLabel}
        </button>
      )}
      {row.type === "link" && (
        <a href={row.href} className="text-white/30 hover:text-white/60">
          <ChevronRight size={18} />
        </a>
      )}
    </div>
  );
}

function Toggle({ checked, onChange }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="relative h-6 w-11 shrink-0 rounded-full transition"
      style={{ background: checked ? "linear-gradient(135deg, var(--accent-from), var(--accent-to))" : "rgba(255,255,255,0.12)" }}
    >
      <motion.span
        className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow"
        animate={{ left: checked ? 22 : 2 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
      />
    </button>
  );
}

function Overlay({ children, onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-0 backdrop-blur-sm sm:p-6"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        onClick={(e) => e.stopPropagation()}
        className="flex h-full w-full max-w-lg flex-col overflow-hidden border border-white/10 bg-gray-900/95 shadow-2xl backdrop-blur-xl sm:h-[85vh] sm:rounded-3xl"
      >
        {children}
      </motion.div>
    </motion.div>
  );
}
