
import { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { exportApplications } from '../utils/exportApplications';

import { Settings, X, Bell, LogOut, Download} from "lucide-react";

const API_URL = 'http://localhost:5000';

type Application = {
  id: number;
  company: string;
  role: string;
  status: string;
  application_date?: string | null;
  job_url?: string | null;
  description?: string | null;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
};

type User = {
  id: number;
  name: string;
  email: string;
  created_at?: string;
  phone?: string | null;
  skills?: string | null;
  experience?: string | null;
  linkedin_url?: string | null;
  portfolio_url?: string | null;
};

type NotificationSettings = {
  followUpReminders: boolean;
  applicationUpdates: boolean;
  emailNotifications: boolean;
};

export default function Profile() {
  const navigate = useNavigate();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [loggingOut, setLoggingOut] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [activeSettings, setActiveSettings] = useState<string | null>(null);
  const [jobs, setJobs] = useState<Application[]>([]);
  
  const settingsRef = useRef<HTMLDivElement>(null);

  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(() => {
  const savedSettings = localStorage.getItem(
    "jobtrackr_notification_settings"
  );

  if (savedSettings) {
    try {
      return JSON.parse(savedSettings);
    } catch {
      // Use default preferences if saved data is invalid.
    }
  }

  return {
    followUpReminders: true,
    applicationUpdates: true,
    emailNotifications: false,
  };
});

useEffect(() => {
  localStorage.setItem(
    "jobtrackr_notification_settings",
    JSON.stringify(notificationSettings)
  );
}, [notificationSettings]);

useEffect(() => {
  function handleOutsideClick(event: MouseEvent) {
    if (
      settingsRef.current &&
      !settingsRef.current.contains(event.target as Node)
    ) {
      setShowSettings(false);
    }
  }

  document.addEventListener("mousedown", handleOutsideClick);

  return () => {
    document.removeEventListener("mousedown", handleOutsideClick);
  };
}, []);
  
  const [profileData, setProfileData] = useState({
  name: "",
  phone: "",
  skills: "",
  experience: "",
  linkedin_url: "",
  portfolio_url: "",
});

const [savingProfile, setSavingProfile] = useState(false);
const [profileMessage, setProfileMessage] = useState("");

  useEffect(() => {
    async function fetchProfile() {
      try {
        const response = await fetch(`${API_URL}/auth/me`, {
          credentials: 'include',
        });

        if (response.status === 401) {
          navigate('/login', { replace: true });
          return;
        }

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Unable to load your profile.');
        }

        setUser(data.user);
        setProfileData({
          name: data.user.name || "",
          phone: data.user.phone || "",
          skills: data.user.skills || "",
          experience: data.user.experience || "",
          linkedin_url: data.user.linkedin_url || "",
          portfolio_url: data.user.portfolio_url || "",
        });
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Unable to connect to the server.'
        );
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
    fetchApplications();
  }, [navigate]);

  async function handleSaveProfile() {
  setSavingProfile(true);
  setError("");
  setProfileMessage("");

  try {
    const response = await fetch(`${API_URL}/auth/profile`, {
      method: "PUT",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(profileData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Unable to update profile.");
    }

    setUser(data.user);
    setProfileMessage("Professional profile updated successfully.");
  } catch (err) {
    setError(
      err instanceof Error
        ? err.message
        : "Unable to connect to the server."
    );
  } finally {
    setSavingProfile(false);
  }
}

  async function handleChangePassword() {
  setChangingPassword(true);
  setPasswordMessage("");
  setPasswordError("");

  try {
    const response = await fetch(`${API_URL}/auth/change-password`, {
      method: "PUT",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        currentPassword,
        newPassword,
        confirmPassword,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Unable to change password.");
    }

    setPasswordMessage("Password changed successfully!");

    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");

    setTimeout(() => {
    setActiveSettings(null);
    setPasswordMessage("");
  }, 1500);

  } catch (err) {
    setPasswordError(
      err instanceof Error
        ? err.message
        : "Unable to connect to the server."
    );
  } finally {
    setChangingPassword(false);
  }
}

async function fetchApplications() {
  try {
    const response = await fetch(`${API_URL}/applications`, {
      credentials: "include",
    });

    if (response.status === 401) {
      navigate("/login", { replace: true });
      return;
    }

    if (!response.ok) {
      throw new Error("Failed to fetch applications.");
    }

    const data: Application[] = await response.json();
    setJobs(data);
  } catch (err) {
    console.error("Profile applications error:", err);
    setError("Unable to load applications for export.");
  }
}

  async function handleLogout() {
    setLoggingOut(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Unable to log out.');
      }

      navigate('/login', { replace: true });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to connect to the server.'
      );
    } finally {
      setLoggingOut(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <p className="text-sm font-medium text-slate-500">
          Loading your profile...
        </p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 dark:bg-slate-950 px-5">
        <p className="text-slate-600">
          {error || 'Unable to load your profile.'}
        </p>
        <Link
          to="/"
          className="font-semibold text-blue-600 hover:text-blue-700"
        >
          Return home
        </Link>
      </div>
    );
  }

  const initials = user.name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const memberSince = user.created_at
    ? new Date(user.created_at).toLocaleDateString('en-AU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : 'Not available';

  const profileFields = [
  profileData.name,
  profileData.phone,
  profileData.skills,
  profileData.experience,
  profileData.linkedin_url,
  profileData.portfolio_url,
];

const completedFields = profileFields.filter(
  (field) => field.trim() !== ""
).length;

const profileCompletion = Math.round(
  (completedFields / profileFields.length) * 100
);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 dark:bg-slate-950 dark:text-slate-300 selection:bg-blue-600 selection:text-white">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
        <nav className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4 sm:px-8">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 font-bold text-white">
              J
            </span>
            <span className="text-xl font-bold tracking-tight text-slate-900">
              Job<span className="text-blue-600">Trackr</span>
            </span>
          </Link>

          <div
            ref={settingsRef}
            className="relative flex items-center gap-2">
            <button
              type="button"
              onClick={() => {setShowSettings((prev) => !prev)
                
              }
              }
              className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-blue-600 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700"
            >
              <Settings size={16} />
              Settings
            </button>

            <Link
              to="/dashboard"
              className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-blue-600 dark:text-white dark:hover:bg-slate-800 dark:bg-slate-800"
            >
              Dashboard
            </Link>

            {showSettings && (
              <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-xl border border-slate-200 bg-white p-2 shadow-lg dark:border-slate-700 dark:bg-slate-900">
                <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Account Settings
                </p>

                <button
                  type="button"
                  onClick={() => {
                    setActiveSettings("security");
                    setShowSettings(false);
                  }}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <Settings size={16} />
                  Security
                </button>

                <button
                    type="button"
                    onClick={() => {
                      setActiveSettings("notifications");
                      setShowSettings(false);
                    }}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    <Bell size={16} />
                    Notifications
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowSettings(false);
                    exportApplications(jobs);
                  }}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <Download size={16} />
                  Data & Export
                </button>

                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-red-600 transition hover:bg-red-50 disabled:opacity-50 dark:hover:bg-red-950/30"
                >
                  <LogOut size={16} />
                  {loggingOut ? "Logging out..." : "Logout"}
                </button>

                
              </div>
            )}
          </div>

        </nav>
      </header>

      <main className="mx-auto max-w-5xl px-5 py-10 sm:px-8 sm:py-14">
        <div className="mb-8">
          <p className="mb-2 text-sm font-semibold text-blue-600 dark:text-white">
            ACCOUNT SETTINGS
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
            My Profile
          </h1>
          <p className="mt-2 text-slate-500 dark:text-slate-400">
            View your account details and manage your session.
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-400"
          >
            {error}
          </div>
        )}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="h-28 bg-linear-to-r from-blue-600 via-blue-500 to-indigo-500 " />

          <div className="px-6 pb-7 sm:px-8">
            <div className="-mt-12 mb-5 flex h-24 w-24 items-center justify-center rounded-2xl border-4 border-white bg-blue-100 text-3xl font-bold text-blue-700 shadow-sm">
              {initials || 'U'}
            </div>

            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              {user.name}
            </h2>
            <p className="mt-1 text-slate-500 dark:text-slate-400">
              {user.email}
            </p>

            <div className="mt-7 border-t border-slate-100 pt-6 ">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Personal information
              </h3>

              <div className="grid gap-5 sm:grid-cols-2">
                <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800 dark:border-slate-700">
                  <p className="text-sm text-slate-500 dark:text-white">Full name</p>
                  <p className="mt-1 wrap-break-word font-semibold text-slate-800 dark:text-white">
                    {user.name}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800">
                  <p className="text-sm text-slate-500 dark:text-white">Email address</p>
                  <p className="mt-1 wrap-break-word font-semibold text-slate-800 dark:text-white">
                    {user.email}
                  </p>
                </div>

                <div className="mt-6 max-w-xl">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      Profile Completion
                    </span>
                    <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                      {profileCompletion}%
                    </span>
                  </div>

                  <div className="h-2.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                    <div
                      className="h-full rounded-full bg-blue-600 transition-all duration-500"
                      style={{ width: `${profileCompletion}%` }}
                    />
                  </div>

                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                    Complete your professional details to get the most out of JobTrackr.
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-4 sm:col-span-2 dark:bg-slate-800">
                  <p className="text-sm text-slate-500 dark:text-white">Member since</p>
                  <p className="mt-1 font-semibold text-slate-800 dark:text-white">
                    {memberSince}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 border-t border-slate-100 pt-6 dark:border-slate-600">
              <h3 className="mb-2 text-lg font-bold text-slate-900 dark:text-white">
                Professional Details
              </h3>

              <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
                Add your professional information to personalise your AI-generated cover letters.
              </p>

              {profileMessage && (
                <div className="mb-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-900 dark:bg-green-950/40 dark:text-green-400">
                  {profileMessage}
                </div>
              )}

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSaveProfile();
                }}
                className="space-y-5"
              >
                {[
                  { name: "name", label: "Full Name", placeholder: "Enter your full name" },
                  { name: "phone", label: "Phone Number", placeholder: "Enter your phone number" },
                  { name: "skills", label: "Professional Skills", placeholder: "React, TypeScript, Node.js..." },
                  { name: "experience", label: "Work Experience", placeholder: "Describe your experience..." },
                  { name: "linkedin_url", label: "LinkedIn URL", placeholder: "https://linkedin.com/in/your-profile" },
                  { name: "portfolio_url", label: "Portfolio URL", placeholder: "https://yourportfolio.com" },
                ].map((field) => (
                  <div key={field.name}>
                    <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                      {field.label}
                    </label>

                    <input
                      type={
                        field.name === "linkedin_url" || field.name === "portfolio_url"
                          ? "url"
                          : "text"
                      }
                      value={profileData[field.name as keyof typeof profileData]}
                      onChange={(e) =>
                        setProfileData({
                          ...profileData,
                          [field.name]: e.target.value,
                        })
                      }
                      placeholder={field.placeholder}
                      className="w-full rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                ))}

                <button
                  type="submit"
                  disabled={savingProfile}
                  className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {savingProfile ? "Saving..." : "Save Professional Details"}
                </button>
              </form>
            </div>

            
            

         </div>
        </section>

        {activeSettings === "security" && (

            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
                    onClick={() => setActiveSettings(null)}
                  >
              <div
                role="dialog"
                onClick={(e) => e.stopPropagation()}
                aria-modal="true"
                aria-labelledby="security-modal-title"
                className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 sm:p-8"
              >
              <button
                  type="button"
                  onClick={() => setActiveSettings(null)}
                  className="mb-5 text-sm font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400"
                >
                  ← Back to Profile
                </button>
              
              <button
                  type="button"
                  onClick={() => setActiveSettings(null)}
                  aria-label="Close security settings"
                  className="absolute right-5 top-5 rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
                >
                  <X size={20} />
                </button>
              <h3
                id="security-modal-title"
                className="mb-2 text-xl font-bold text-slate-900 dark:text-white"
              >
                Security Settings
              </h3>

              <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
                Update your password to keep your account secure.
              </p>

              {passwordMessage && (
                <div className="mb-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-900 dark:bg-green-950/40 dark:text-green-400">
                  {passwordMessage}
                </div>
              )}

              {passwordError && (
                <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-400">
                  {passwordError}
                </div>
              )}

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleChangePassword();
                }}
                className="max-w-xl space-y-5"
              >
                {[
                  {
                    label: "Current Password",
                    value: currentPassword,
                    setter: setCurrentPassword,
                  },
                  {
                    label: "New Password",
                    value: newPassword,
                    setter: setNewPassword,
                  },
                  {
                    label: "Confirm New Password",
                    value: confirmPassword,
                    setter: setConfirmPassword,
                  },
                ].map((field) => (
                  <div key={field.label}>
                    <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                      {field.label}
                    </label>

                    <input
                      type="password"
                      value={field.value}
                      onChange={(e) => field.setter(e.target.value)}
                      required
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      placeholder={`Enter ${field.label.toLowerCase()}`}
                    />
                  </div>
                ))}

                <button
                  type="submit"
                  disabled={changingPassword}
                  className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {changingPassword ? "Updating..." : "Update Password"}
                </button>
              </form>
            </div>
          </div>
            
        )}

        {activeSettings === "notifications" && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
            onClick={() => setActiveSettings(null)}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="notifications-modal-title"
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 sm:p-8"
            >
              <button
                type="button"
                onClick={() => setActiveSettings(null)}
                aria-label="Close notification settings"
                className="absolute right-5 top-5 rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X size={20} />
              </button>

              <h3
                id="notifications-modal-title"
                className="mb-2 text-xl font-bold text-slate-900 dark:text-white"
              >
                Notification Settings
              </h3>

              <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
                Choose which notifications you would like to receive.
              </p>

              <div className="space-y-5">

                <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-slate-200 p-4 dark:border-slate-700">
                  <div>
                    <p className="font-semibold text-slate-800 dark:text-white">
                      Follow-up Reminders
                    </p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      Get reminders when job applications need follow-up.
                    </p>
                  </div>

                  <input
                    type="checkbox"
                    checked={notificationSettings.followUpReminders}
                    onChange={(e) =>
                      setNotificationSettings((prev) => ({
                        ...prev,
                        followUpReminders: e.target.checked,
                      }))
                    }
                    className="h-5 w-5 accent-blue-600"
                  />
                </label>

                <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-slate-200 p-4 dark:border-slate-700">
                  <div>
                    <p className="font-semibold text-slate-800 dark:text-white">
                      Application Updates
                    </p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      Get notified about changes to your application statuses.
                    </p>
                  </div>

                  <input
                    type="checkbox"
                    checked={notificationSettings.applicationUpdates}
                    onChange={(e) =>
                      setNotificationSettings((prev) => ({
                        ...prev,
                        applicationUpdates: e.target.checked,
                      }))
                    }
                    className="h-5 w-5 accent-blue-600"
                  />
                </label>

                <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-slate-200 p-4 dark:border-slate-700">
                  <div>
                    <p className="font-semibold text-slate-800 dark:text-white">
                      Email Notifications
                    </p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      Enable email notifications for important updates.
                    </p>
                  </div>

                  <input
                    type="checkbox"
                    checked={notificationSettings.emailNotifications}
                    onChange={(e) =>
                      setNotificationSettings((prev) => ({
                        ...prev,
                        emailNotifications: e.target.checked,
                      }))
                    }
                    className="h-5 w-5 accent-blue-600"
                  />
                </label>

              </div>

              <div className="mt-7 flex justify-end">
                <button
                  type="button"
                  onClick={() => setActiveSettings(null)}
                  className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  Save Preferences
                </button>
              </div>
            </div>
          </div>
        )}

        <p className="mt-6 text-center text-sm text-slate-400">
          Your JobTrackr account information is displayed here.
        </p>
      </main>
    </div>
  );
}
