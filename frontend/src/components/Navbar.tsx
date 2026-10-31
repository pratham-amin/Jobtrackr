
import { useTheme } from "../context/ThemeContext";


export default function Navbar() {
  const { theme, toggleTheme } = useTheme();
  return (
  <nav className="flex items-center justify-between border-b border-blue-700 bg-blue-600 px-6 py-5 dark:border-slate-700 dark:bg-blue-200">
    <a
      href="/"
      className="text-3xl font-bold text-white no-underline dark:text-slate-900"
    >
      JobTrackr
    </a>

    <button
      type="button"
      onClick={toggleTheme}
      className="rounded-lg border border-white/30 px-4 py-2 text-sm font-medium transition hover:bg-slate-900 hover:text-white dark:text-white dark:hover:bg-white dark:border-slate-700 dark:bg-slate-900 bg-white dark:hover:text-slate-900 text-slate-900"
    >
      {theme === "light" ? "🌙 Dark Mode" : "☀️ Light Mode"}
    </button>
  </nav>
);
}