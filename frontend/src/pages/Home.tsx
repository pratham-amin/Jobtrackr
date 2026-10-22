export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center grow bg-linear-to-r from-blue-500 via-indigo-600 to-purple-600 text-white p-8 text-center">
        <h1 className="text-4xl md:text-6xl font-extrabold mb-4 drop-shadow-lg">
          Track Your Job Applications
        </h1>
        <p className="text-lg md:text-xl mb-6 max-w-2xl opacity-90">
          Stay organized and never lose track of your career opportunities.
        </p>
        <a
          href="/dashboard"
          className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold shadow hover:scale-105 hover:bg-gray-200 transition-transform duration-300"
        >
          Go to Dashboard
        </a>
      </section>

      {/* Features Section */}
      <section className="grid gap-8 md:grid-cols-3 p-8 bg-gray-50">
        {[
          { title: "📋 Organize", text: "Keep all your job applications in one place." },
          { title: "🔍 Track", text: "Monitor application status from Applied to Offer." },
          { title: "📈 Progress", text: "Visualize your career journey with ease." },
        ].map((feature, i) => (
          <div
            key={i}
            className="bg-white p-6 rounded-lg shadow hover:shadow-xl transition-transform hover:-translate-y-1"
          >
            <h3 className="font-bold text-xl mb-2">{feature.title}</h3>
            <p className="text-gray-600">{feature.text}</p>
          </div>
        ))}
      </section>

      {/* Footer */}
      <footer className="bg-blue-600 text-white text-center py-4">
        <p className="text-sm">© 2026 JobTrackr — All rights reserved.</p>
      </footer>
    </div>
  );
}
