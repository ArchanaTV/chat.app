import { createContext, useContext, useEffect, useState } from "react";

const SettingsContext = createContext(null);

const ACCENT_PRESETS = {
  indigo: { from: "#6366f1", to: "#38bdf8", label: "Indigo" },
  emerald: { from: "#10b981", to: "#34d399", label: "Emerald" },
  rose: { from: "#f43f5e", to: "#fb7185", label: "Rose" },
  amber: { from: "#f59e0b", to: "#fbbf24", label: "Amber" },
  violet: { from: "#8b5cf6", to: "#c084fc", label: "Violet" },
};

const DEFAULTS = {
  themeMode: "dark", // "dark" | "light" | "system" - see note in ThemeContext about light mode scope
  accent: "indigo",
  reduceMotion: false,
  largerText: false,
  highContrast: false,
  notificationSound: true,
  echoCancellation: true,
  noiseCancellation: true,
};

function loadStored() {
  try {
    const raw = localStorage.getItem("chatwave-settings");
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS;
  } catch {
    return DEFAULTS;
  }
}

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(loadStored);

  useEffect(() => {
    localStorage.setItem("chatwave-settings", JSON.stringify(settings));

    const root = document.documentElement;
    const accent = ACCENT_PRESETS[settings.accent] || ACCENT_PRESETS.indigo;
    root.style.setProperty("--accent-from", accent.from);
    root.style.setProperty("--accent-to", accent.to);

    root.classList.toggle("reduce-motion", settings.reduceMotion);
    root.classList.toggle("larger-text", settings.largerText);
    root.classList.toggle("high-contrast", settings.highContrast);
  }, [settings]);

  const updateSetting = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSetting, accentPresets: ACCENT_PRESETS }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => useContext(SettingsContext);
