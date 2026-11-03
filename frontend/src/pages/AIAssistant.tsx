
import { Link } from 'react-router-dom';

const features = [
  {
    title: 'AI Cover Letter Generator',
    description:
      'Create personalised, professional cover letters tailored to your target role and company.',
    icon: '✍️',
    category: 'APPLICATIONS',
    path: '/cover-letter',
    available: true,
    accent: 'from-violet-500 to-indigo-500',
  },
  {
    title: 'AI Resume Analyzer',
    description:
      'Analyse your resume, identify weaknesses and discover opportunities to improve it.',
    icon: '📄',
    category: 'RESUME',
    path: '#',
    available: false,
    accent: 'from-blue-500 to-cyan-500',
  },
  {
    title: 'AI Job Match Score',
    description:
      'Compare your skills and experience against job requirements and get a match score.',
    icon: '🎯',
    category: 'JOB MATCHING',
    path: '#',
    available: false,
    accent: 'from-emerald-500 to-teal-500',
  },
  {
    title: 'AI Interview Preparation',
    description:
      'Practise interview questions and prepare stronger answers for your next opportunity.',
    icon: '💬',
    category: 'INTERVIEWS',
    path: '#',
    available: false,
    accent: 'from-orange-500 to-pink-500',
  },
];

export default function AIAssistant() {
  return (
    <main className="min-h-screen bg-gray-50 px-5 py-10 text-gray-900 dark:bg-gray-950 dark:text-white sm:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 flex items-center justify-between py-3">
        <Link
          to="/dashboard"
          className="absolute right-6 top-6 m-20 mx-8 rounded-lg bg-slate-800 px-4 py-4 text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700"
        >
          ← Back to Dashboard
        </Link>
        </div>
        {/* Hero Section */}
        <section className="relative overflow-hidden rounded-3xl bg-linear-to-br from-violet-700 via-indigo-700 to-blue-700 px-7 py-12 text-white shadow-xl shadow-indigo-500/10 sm:px-12 sm:py-16">

          
          <div className="absolute -right-16 -top-20 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-blue-300/20 blur-3xl" />
          
          <div className="relative z-10 max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium backdrop-blur">
              ✦ JOBTRACKR INTELLIGENCE
            </span>

            <h1 className="mt-7 text-3xl font-bold leading-tight sm:text-5xl">
              Your career journey,
              <br />
              powered by AI.
            </h1>

            <p className="mt-5 max-w-xl text-base leading-7 text-indigo-100 sm:text-lg">
              Meet your personal AI career assistant. Create
              better applications, strengthen your resume and
              prepare to land your next opportunity.
            </p>

            <div className="mt-8 flex flex-wrap gap-3 text-sm">
              <span className="rounded-full bg-white/15 px-4 py-2">
                ✨ Smart career tools
              </span>
              <span className="rounded-full bg-white/15 px-4 py-2">
                ⚡ AI-powered assistance
              </span>
            </div>
          </div>
        </section>

        {/* Feature Heading */}
        <section className="mb-7 mt-12">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                Explore your tools
              </p>

              <h2 className="mt-2 text-2xl font-bold sm:text-3xl dark:text-white">
                AI Career Toolkit
              </h2>

              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Everything you need to improve your job search in one place.
              </p>
            </div>

           
          </div>
        </section>

        {/* Feature Cards */}
        <section className="grid gap-6 sm:grid-cols-2">
          {features.map((feature) => (
            <article
              key={feature.title}
              className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 transition duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-gray-800 dark:bg-gray-900"
            >
              <div
                className={`absolute left-0 top-0 h-1 w-full bg-linear-to-r ${feature.accent}`}
              />

              <div className="flex items-start justify-between">
                <div
                  className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-linear-to-br ${feature.accent} text-2xl text-white shadow-lg`}
                >
                  {feature.icon}
                </div>

               
              </div>

              <p className="mt-6 text-xs font-semibold tracking-widest text-gray-400">
                {feature.category}
              </p>

              <h3 className="mt-2 text-xl font-bold">
                {feature.title}
              </h3>

              <p className="mt-3 min-h-14 text-sm leading-6 text-gray-500 dark:text-gray-400">
                {feature.description}
              </p>

              {feature.available ? (
                <Link
                  to={feature.path}
                  className="mt-6 inline-flex items-center gap-2 rounded-lg bg-linear-to-r from-violet-600 to-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-500/20 transition hover:from-violet-700 hover:to-indigo-700"
                >
                  Open Tool
                  <span className="transition-transform group-hover:translate-x-1">
                    →
                  </span>
                </Link>
              ) : (
                <button
                  type="button"
                  disabled
                  className="mt-6 cursor-not-allowed rounded-lg bg-gray-100 px-5 py-3 text-sm font-semibold text-gray-400 dark:bg-gray-800 dark:text-gray-500"
                >
                  Coming Soon
                </button>
              )}
            </article>
          ))}
        </section>

        {/* Bottom Information */}
        <section className="mt-10 rounded-2xl border border-indigo-100 bg-indigo-50/70 p-6 dark:border-indigo-500/20 dark:bg-indigo-500/5">
          <div className="flex items-start gap-4">
            <div className="text-2xl">💡</div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Your next opportunity starts here
              </h3>
              <p className="mt-1 text-sm leading-6 text-gray-600 dark:text-gray-400">
                Use JobTrackr AI tools to prepare stronger applications
                and approach your job search with confidence.
              </p>
            </div>
          </div>
        </section>

      </div>
    </main>
  );
}
