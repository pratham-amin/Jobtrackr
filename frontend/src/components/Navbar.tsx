
import { useState } from "react";
import { useTheme } from "../context/ThemeContext";
import { Bell, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import {useRef} from "react";


type FollowUp = {
  id: number;
  company: string;
  role: string;
};

export default function Navbar() {
  const { theme, toggleTheme } = useTheme();

  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<FollowUp[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationError, setNotificationError] = useState("");
  const location = useLocation();
  const navigate= useNavigate();
  const notificationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
  if (location.hash === "#follow-up-reminders") {
    setTimeout(() => {
      document
        .getElementById("follow-up-reminders")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 300);
  }
}, [location]);

  useEffect(() => {
  fetchNotifications();

  const interval = window.setInterval(() => {
    fetchNotifications();
  }, 60000);

  return () => window.clearInterval(interval);
}, []);

useEffect(() => {
  function handleOutsideClick(event: MouseEvent) {
    if (
      notificationRef.current &&
      !notificationRef.current.contains(event.target as Node)
    ) {
      setShowNotifications(false);
    }
  }

  document.addEventListener("mousedown", handleOutsideClick);

  return () => {
    document.removeEventListener("mousedown", handleOutsideClick);
  };
}, []);

  async function fetchNotifications() {
    setNotificationsLoading(true);
    setNotificationError("");

    try {
      const response = await fetch(
        "http://localhost:5000/applications/follow-ups/due",
        { credentials: "include" }
      );

      if (response.status === 401) {
        setNotifications([]);
        setNotificationError("Please log in to view notifications.");
        return;
      }

      if (!response.ok) {
        throw new Error("Unable to load notifications.");
      }

      const data: FollowUp[] = await response.json();
      setNotifications(data);
    } catch (error) {
      console.error("Notification error:", error);
      setNotificationError("Unable to load notifications.");
    } finally {
      setNotificationsLoading(false);
    }
  }

  return (
    <nav className="flex items-center justify-between border-b border-blue-700 bg-blue-600 px-6 py-5 dark:border-slate-700 dark:bg-blue-200">
      <a
        href="/"
        className="text-3xl font-bold text-white no-underline dark:text-slate-900"
      >
        JobTrackr
      </a>

      <div
            ref={notificationRef}
            className="relative flex items-center gap-3"
          >
        {/* Notification Bell */}
        <button
          type="button"
          aria-label="Notifications"
          onClick={() => {
            const nextState = !showNotifications;
            setShowNotifications(nextState);

            if (nextState) {
              fetchNotifications();
            }
          }}
          className="relative rounded-lg border border-white/30 bg-white px-3 py-2 text-slate-900 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800"
        >
          <Bell size={20} />

          {notifications.length > 0 && (
            <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-xs font-bold text-white">
              {notifications.length}
            </span>
          )}
        </button>

        {/* Notification Dropdown */}
        {showNotifications && (
          <div className="absolute right-0 top-full z-50 mt-3 w-80 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 p-4 dark:border-slate-700">
              <h3 className="font-bold text-slate-900 dark:text-white">
                Notifications
              </h3>

              <button
                type="button"
                onClick={() => setShowNotifications(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto p-4">
              {notificationsLoading ? (
                <p className="text-sm text-slate-500">
                  Loading notifications...
                </p>
              ) : notificationError ? (
                <p className="text-sm text-red-500">
                  {notificationError}
                </p>
              ) : notifications.length === 0 ? (
                <div className="py-6 text-center">
                  <Bell size={28} className="mx-auto mb-2 text-slate-300" />
                  <p className="font-medium text-slate-700 dark:text-white">
                    You're all caught up!
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    No due follow-up reminders.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {notifications.map((item) => (
                    <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setShowNotifications(false);
                          navigate("/dashboard#follow-up-reminders");
                        }}
                        className="w-full rounded-lg border border-slate-100 p-3 text-left transition hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                      >
                      <p className="text-sm font-semibold text-slate-800 dark:text-white">
                        Follow-up reminder
                      </p>
                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                        {item.role} at {item.company}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Theme Toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          className="rounded-lg border border-white/30 px-4 py-2 text-sm font-medium transition hover:bg-slate-900 hover:text-white dark:text-white dark:hover:bg-white dark:border-slate-700 dark:bg-slate-900 bg-white dark:hover:text-slate-900 text-slate-900"
        >
          {theme === "light" ? "🌙 Dark Mode" : "☀️ Light Mode"}
        </button>
      </div>
    </nav>
  );
}
