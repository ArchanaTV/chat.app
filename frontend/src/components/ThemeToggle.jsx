import { useTheme } from "../context/ThemeContext.jsx";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      title="Toggle theme"
      className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-lg transition hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700"
    >
      {theme === "dark" ? "☀️" : "🌙"}
    </button>
  );
}
