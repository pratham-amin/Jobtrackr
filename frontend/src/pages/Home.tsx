
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const API_URL = 'http://localhost:5000';

type User = {
  id: number;
  name: string;
  email: string;
};

type Feature = {
  number: string;
  icon: string;
  title: string;
  description: string;
};

type SampleApplication = {
  company: string;
  initials: string;
  color: string;
  role: string;
  date: string;
  status: "Interview" | "Applied" | "Offer";
  statusStyle: string;
};

const features: Feature[] = [
  {
    number: "01",
    icon: "◎",
    title: "Stay organised",
    description:
      "Keep company names, job roles, application dates, and important details in one place.",
  },
  {
    number: "02",
    icon: "↗",
    title: "Track every stage",
    description:
      "See where each opportunity stands, from your first application to an interview or offer.",
  },
  {
    number: "03",
    icon: "▥",
    title: "Understand your progress",
    description:
      "Get a clearer picture of your job search and make more informed decisions.",
  },
];

const sampleApplications: SampleApplication[] = [
  {
    company: "Stripe",
    initials: "S",
    color: "bg-indigo-100 text-indigo-700",
    role: "Frontend Developer",
    date: "Oct 24, 2026",
    status: "Interview",
    statusStyle: "bg-amber-50 text-amber-700 ring-amber-600/20",
  },
  {
    company: "Notion",
    initials: "N",
    color: "bg-stone-100 text-stone-700",
    role: "Software Engineer",
    date: "Oct 22, 2026",
    status: "Applied",
    statusStyle: "bg-blue-50 text-blue-700 ring-blue-600/20",
  },
  {
    company: "Figma",
    initials: "F",
    color: "bg-rose-100 text-rose-700",
    role: "UI Engineer",
    date: "Oct 20, 2026",
    status: "Offer",
    statusStyle: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  },
];

function ArrowIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      fill="none"
      className="h-4 w-4"
    >
      <path
        d="M4.167 10h11.666M10 4.167 15.833 10 10 15.833"
        stroke="currentColor"
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      fill="none"
      className="h-4 w-4"
    >
      <path
        d="m4.5 10.5 3.5 3.5 7.5-8"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DashboardPreview() {
  return (
    <div className="relative mx-auto w-full max-w-xl">
      <div className="absolute -inset-4 -z-10 rounded-[2rem] bg-blue-100/60 blur-3xl" />

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/10">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-sm font-bold text-white">
              J
            </div>
            <div>
              <p className="mb-0 text-sm font-semibold text-slate-900">
                Your workspace
              </p>
              <p className="mb-0 text-xs text-slate-500">
                Job search overview
              </p>
            </div>
          </div>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
            On track
          </span>
        </div>

        <div className="bg-slate-50/70 p-4 sm:p-6">
          <div className="mb-5 flex items-end justify-between">
            <div>
              <p className="mb-1 text-xs font-medium text-slate-500">
                YOUR JOB SEARCH
              </p>
              <h3 className="mb-0 text-xl font-bold tracking-tight text-slate-900">
                Application overview
              </h3>
            </div>
            <span className="text-xs text-slate-500">Sample data</span>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {[
              { label: "Applications", value: "24", note: "Total tracked" },
              { label: "Interviews", value: "06", note: "In progress" },
              { label: "Offers", value: "02", note: "Great progress" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl border border-slate-200/80 bg-white p-3 sm:p-4"
              >
                <p className="mb-2 text-xs text-slate-500">{stat.label}</p>
                <p className="mb-1 text-2xl font-bold tracking-tight text-slate-900">
                  {stat.value}
                </p>
                <p className="mb-0 text-[11px] text-slate-500">{stat.note}</p>
              </div>
            ))}
          </div>

          <div className="mt-5 overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="border-b border-slate-100 px-4 py-3">
              <p className="mb-0 text-sm font-semibold text-slate-900">
                Recent applications
              </p>
            </div>

            <div className="divide-y divide-slate-100">
              {sampleApplications.map((application) => (
                <div
                  key={application.company}
                  className="flex items-center justify-between gap-2 px-4 py-3"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${application.color}`}
                    >
                      {application.initials}
                    </div>
                    <div className="min-w-0">
                      <p className="mb-0 truncate text-sm font-semibold text-slate-800">
                        {application.company}
                      </p>
                      <p className="mb-0 truncate text-xs text-slate-500">
                        {application.role}
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    <span
                      className={`rounded-full px-2 py-1 text-[10px] font-semibold ring-1 ring-inset ${application.statusStyle}`}
                    >
                      {application.status}
                    </span>
                    <span className="hidden text-[10px] text-slate-400 sm:block">
                      {application.date}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2 rounded-lg border border-blue-100 bg-blue-50/70 px-3 py-2.5">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700">
              <CheckIcon />
            </span>
            <p className="mb-0 text-xs leading-5 text-blue-900">
              One organised workspace for your entire job search.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
   const [user, setUser] = useState<User | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    console.log('Home component session check is running');
    async function checkSession() {
      try {
        const response = await fetch(`${API_URL}/auth/me`, {
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Unable to check login session:', error);
        setUser(null);
      } finally {
        setCheckingSession(false);
      }
    }

    checkSession();
  }, []);
  return (
    <div className="min-h-screen overflow-hidden bg-white text-slate-800 ">
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
        <nav
          aria-label="Main navigation"
          className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8 lg:px-10"
        >
          <a href="/" className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-lg font-bold text-white">
              J
            </span>
            <span className="text-xl font-bold tracking-tight text-slate-900">
              Job<span className="text-blue-600">Trackr</span>
            </span>
          </a>

          <div className="hidden items-center gap-8 md:flex">
            <a href="#features" className="text-sm font-medium text-slate-600 hover:text-blue-600">
              Features
            </a>
            <a href="#how-it-works" className="text-sm font-medium text-slate-600 hover:text-blue-600">
              How it works
            </a>
          </div>

          
        <div className="flex items-center gap-3">
          {checkingSession ? (
            <span className="text-sm text-slate-500">Loading...</span>
          ) : user ? (
            <>
              <Link
                to="/dashboard"
                className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                Dashboard
              </Link>

              <Link
                to="/profile"
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20">
                  {user.name.charAt(0).toUpperCase()}
                </span>
                Profile
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="hidden rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 sm:inline-flex"
              >
                Log in
              </Link>

              <Link
                to="/register"
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Get started <ArrowIcon />
              </Link>
            </>
          )}
        </div>

        </nav>
      </header>

      <main>
        <section className="relative isolate">
          <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,_rgba(219,234,254,0.65),_transparent_55%)]" />

          <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-2 lg:gap-16 lg:px-10 lg:py-24">
            <div className="max-w-2xl">
              <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3.5 py-1.5 text-sm font-medium text-blue-700">
                <span className="h-2 w-2 rounded-full bg-blue-600" />
                A smarter way to manage your job search
              </div>

              <h1 className="mb-6 text-4xl font-bold leading-[1.12] tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
                Your next opportunity.
                <span className="mt-2 block text-blue-600">
                  All in one place.
                </span>
              </h1>

              <p className="mb-8 max-w-xl text-base leading-8 text-slate-600 sm:text-lg">
                Job hunting is a journey. Keep every application organised,
                stay on top of interviews, and move forward with confidence.
              </p>

              <div className="flex flex-col gap-3 sm:flex-row">
                
                <Link
                  to={user ? '/dashboard' : '/register'}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-700"
                >
                  {user ? 'Open your dashboard' : 'Get started for free'}
                  <ArrowIcon />
                </Link>

                <a href="#features" className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-6 py-3.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                  Explore features
                </a>
              </div>

              <div className="mt-8 flex flex-wrap gap-x-5 gap-y-3 text-sm text-slate-500">
                {["Simple to use", "Organised tracking", "Built for your goals"].map((item) => (
                  <span key={item} className="inline-flex items-center gap-2">
                    <span className="text-emerald-600"><CheckIcon /></span>
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <DashboardPreview />
          </div>
        </section>

        <section id="features" className="border-t border-slate-100 bg-slate-50/70">
          <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-24 lg:px-10">
            <div className="mx-auto mb-12 max-w-2xl text-center">
              <p className="mb-3 text-sm font-bold uppercase tracking-[0.16em] text-blue-600">
                Everything in one place
              </p>
              <h2 className="mb-4 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                Less searching. More progressing.
              </h2>
              <p className="mb-0 text-base leading-7 text-slate-600">
                Spend less time managing spreadsheets and more time preparing
                for the opportunities that matter.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              {features.map((feature) => (
                <article key={feature.number} className="group rounded-2xl border border-slate-200/80 bg-white p-7 transition duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl hover:shadow-slate-900/[0.04] sm:p-8">
                  <div className="mb-7 flex items-center justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-2xl font-medium text-blue-600 transition group-hover:bg-blue-600 group-hover:text-white">
                      {feature.icon}
                    </div>
                    <span className="text-sm font-semibold tracking-widest text-slate-300">{feature.number}</span>
                  </div>
                  <h3 className="mb-3 text-lg font-bold text-slate-900">{feature.title}</h3>
                  <p className="mb-0 text-sm leading-7 text-slate-600">{feature.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="how-it-works" className="bg-white">
          <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-20 sm:px-8 sm:py-24 lg:grid-cols-2 lg:gap-20 lg:px-10">
            <div>
              <p className="mb-3 text-sm font-bold uppercase tracking-[0.16em] text-blue-600 ">Your workflow, simplified</p>
              <h2 className="mb-5 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                A clearer path from application to offer.
              </h2>
              <p className="mb-8 max-w-lg leading-7 text-slate-600">
                Every opportunity deserves attention. Keep the details
                together so you can focus on your next step.
              </p>
              <a href="/dashboard" className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700">
                Start organising your search <ArrowIcon />
              </a>
            </div>

            <div className="space-y-4">
              {[
                { step: "01", title: "Add an application", description: "Record the company, role, and details when you apply." },
                { step: "02", title: "Update your progress", description: "Keep your application status current as things change." },
                { step: "03", title: "Stay ready for what's next", description: "Use your overview to keep track of active opportunities." },
              ].map((item) => (
                <div key={item.step} className="flex gap-4 rounded-2xl border border-slate-200 p-5 transition hover:border-blue-200 hover:bg-blue-50/30 sm:p-6">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-sm font-bold text-blue-700">{item.step}</span>
                  <div>
                    <h3 className="mb-1 text-base font-bold text-slate-900">{item.title}</h3>
                    <p className="mb-0 text-sm leading-6 text-slate-600">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-5 pb-20 sm:px-8 sm:pb-24 lg:px-10">
          <div className="mx-auto max-w-7xl rounded-3xl bg-slate-950 px-6 py-14 text-center sm:px-12 sm:py-16">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-blue-300">Take control of your job search</p>
            <h2 className="mx-auto mb-4 max-w-2xl text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Make every opportunity count.
            </h2>
            <p className="mx-auto mb-8 max-w-xl leading-7 text-slate-300">
              Bring your applications together and make your next career move with clarity.
            </p>
            <a href="/dashboard" className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-semibold text-slate-950 transition hover:bg-blue-50">
              Go to JobTrackr <ArrowIcon />
            </a>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-7 sm:px-8 md:flex-row md:items-center md:justify-between lg:px-10">
          <a href="/" className="flex w-fit items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-sm font-bold text-white">J</span>
            <span className="font-bold tracking-tight text-slate-900">
              Job<span className="text-blue-600">Trackr</span>
            </span>
          </a>
          <p className="mb-0 text-sm text-slate-500">Stay organised. Keep moving forward.</p>
          <p className="mb-0 text-sm text-slate-400">
            © {new Date().getFullYear()} JobTrackr
          </p>
        </div>
      </footer>
    </div>
  );
}
