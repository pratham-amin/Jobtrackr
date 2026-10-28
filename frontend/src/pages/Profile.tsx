
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const API_URL = 'http://localhost:5000';

type User = {
  id: number;
  name: string;
  email: string;
  created_at?: string;
};

export default function Profile() {
  const navigate = useNavigate();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [loggingOut, setLoggingOut] = useState(false);

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
  }, [navigate]);

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
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-sm font-medium text-slate-500">
          Loading your profile...
        </p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 px-5">
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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
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

          <Link
            to="/dashboard"
            className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-blue-600"
          >
            Dashboard
          </Link>
        </nav>
      </header>

      <main className="mx-auto max-w-5xl px-5 py-10 sm:px-8 sm:py-14">
        <div className="mb-8">
          <p className="mb-2 text-sm font-semibold text-blue-600">
            ACCOUNT SETTINGS
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            My Profile
          </h1>
          <p className="mt-2 text-slate-500">
            View your account details and manage your session.
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="h-28 bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-500" />

          <div className="px-6 pb-7 sm:px-8">
            <div className="-mt-12 mb-5 flex h-24 w-24 items-center justify-center rounded-2xl border-4 border-white bg-blue-100 text-3xl font-bold text-blue-700 shadow-sm">
              {initials || 'U'}
            </div>

            <h2 className="text-2xl font-bold text-slate-900">
              {user.name}
            </h2>
            <p className="mt-1 text-slate-500">{user.email}</p>

            <div className="mt-7 border-t border-slate-100 pt-6">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
                Personal information
              </h3>

              <div className="grid gap-5 sm:grid-cols-2">
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Full name</p>
                  <p className="mt-1 break-words font-semibold text-slate-800">
                    {user.name}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Email address</p>
                  <p className="mt-1 break-words font-semibold text-slate-800">
                    {user.email}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-4 sm:col-span-2">
                  <p className="text-sm text-slate-500">Member since</p>
                  <p className="mt-1 font-semibold text-slate-800">
                    {memberSince}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-3 border-t border-slate-100 pt-6 sm:flex-row">
              <Link
                to="/dashboard"
                className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Go to dashboard
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="inline-flex items-center justify-center rounded-xl border border-red-200 px-5 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loggingOut ? 'Logging out...' : 'Log out'}
              </button>
            </div>
          </div>
        </section>

        <p className="mt-6 text-center text-sm text-slate-400">
          Your JobTrackr account information is displayed here.
        </p>
      </main>
    </div>
  );
}
