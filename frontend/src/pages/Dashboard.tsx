
import JobCard from "../components/JobCard";

export default function Dashboard() {
  const jobs = [
    {
      company: "Microsoft",
      role: "Frontend Developer",
      status: "Applied",
    },
    {
      company: "Google",
      role: "UI Engineer",
      status: "Interview",
    },
    {
      company: "Amazon",
      role: "React Developer",
      status: "Offer",
    },
  ];

  const totalApplications = jobs.length;
  const interviews = jobs.filter(
    (job) => job.status === "Interview"
  ).length;
  const offers = jobs.filter(
    (job) => job.status === "Offer"
  ).length;
  const applied = jobs.filter(
    (job) => job.status === "Applied"
  ).length;

  const stats = [
    {
      title: "Total Applications",
      value: totalApplications,
      color: "text-blue-600",
      background: "bg-blue-50",
    },
    {
      title: "Applied",
      value: applied,
      color: "text-slate-700",
      background: "bg-slate-100",
    },
    {
      title: "Interviews",
      value: interviews,
      color: "text-amber-600",
      background: "bg-amber-50",
    },
    {
      title: "Offers",
      value: offers,
      color: "text-green-600",
      background: "bg-green-50",
    },
  ];

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="mb-2 text-3xl font-bold text-slate-900">
              My Dashboard
            </h2>
            <p className="text-slate-500">
              Track your job applications and career progress.
            </p>
          </div>

          <button
            type="button"
            onClick={() => alert("Add application form coming next!")}
            className="rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            + Add Application
          </button>
        </div>

        {/* Statistics */}
        <section className="mb-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.title}
              className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <p className="mb-3 text-sm font-medium text-slate-500">
                {stat.title}
              </p>
              <p className={`text-3xl font-bold ${stat.color}`}>
                {stat.value}
              </p>
              <div
                className={`mt-4 h-1.5 w-12 rounded-full ${stat.background}`}
              />
            </div>
          ))}
        </section>

        {/* Applications */}
        <section>
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h3 className="mb-1 text-xl font-bold text-slate-900">
                Recent Applications
              </h3>
              <p className="text-sm text-slate-500">
                Keep track of your current opportunities.
              </p>
            </div>

            <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-700">
              {totalApplications} jobs
            </span>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {jobs.map((job, index) => (
              <JobCard key={`${job.company}-${index}`} {...job} />
            ))}
          </div>

          {jobs.length === 0 && (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
              <h4 className="mb-2 text-lg font-semibold text-slate-800">
                No applications yet
              </h4>
              <p className="text-slate-500">
                Add your first job application to get started.
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
