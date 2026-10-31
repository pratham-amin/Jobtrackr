
import { useEffect, useState } from "react";
import JobCard from "../components/JobCard";
import AddApplication from "../components/AddApplication";
import Analytics from "../components/analytics";
import {exportApplications} from "../utils/exportApplications";
const API_URL = "http://localhost:5000";

type Job = {
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

export default function Dashboard() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sortOrder, setSortOrder] = useState("newest");

  async function fetchApplications() {
  try {
    setLoading(true);
    setError("");

    const response = await fetch(`${API_URL}/applications`, {
      credentials: "include",
    });

    if (response.status === 401) {
      window.location.href = "/login";
      return;
    }

    if (!response.ok) {
      throw new Error("Failed to fetch applications.");
    }

    const data: Job[] = await response.json();



setJobs(data);
  } catch (err) {
    console.error("Dashboard error:", err);
    setError("Unable to load your applications. Please try again.");
  } finally {
    setLoading(false);
  }
}

async function handleUpdate(
  id: number,
  updatedJob: {
    company: string;
    role: string;
    status: string;
    application_date: string | null;
    job_url: string | null;
    description: string | null;
    notes: string | null;
  }
) {
  try {
    const response = await fetch(`${API_URL}/applications/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(updatedJob),
    });

    if (!response.ok) {
      throw new Error("Failed to update application.");
    }

    await fetchApplications();
  } catch (error) {
    console.error("Update error:", error);
    alert("Unable to update application. Please try again.");
  }
}

async function handleDelete(id: number) {
  const confirmed = window.confirm(
    "Are you sure you want to delete this application?"
  );

  if (!confirmed) return;

  try {
    const response = await fetch(`${API_URL}/applications/${id}`, {
      method: "DELETE",
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Failed to delete application.");
    }

    await fetchApplications();
  } catch (error) {
    console.error(error);
    alert("Unable to delete application.");
  }
}

  useEffect(() => {
    
    fetchApplications();
  }, []);

  const totalApplications = jobs.length;

  const interviews = jobs.filter(
    (job) => job.status.toLowerCase() === "interview"
  ).length;

  const offers = jobs.filter(
    (job) => job.status.toLowerCase() === "offer"
  ).length;

  const applied = jobs.filter(
    (job) => job.status.toLowerCase() === "applied"
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

  const filteredJobs = jobs
  .filter((job) => {
    const matchesSearch =
      job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.role.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "All" || job.status === statusFilter;

    return matchesSearch && matchesStatus;
  })
  .sort((a, b) => {
    const dateA = new Date(a.created_at || 0).getTime();
    const dateB = new Date(b.created_at || 0).getTime();

    return sortOrder === "newest"
      ? dateB - dateA
      : dateA - dateB;
  });

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 dark:bg-slate-950 dark:text-white sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="mb-2 text-3xl font-bold text-slate-900 dark:text-white">
              My Dashboard
            </h2>
            <p className="text-slate-500 dark:text-slate-400">
              Track your job applications and career progress.
            </p>
          </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => exportApplications(jobs)}
                className="rounded-lg border border-gray-300 bg-white px-5 py-3 font-semibold text-gray-700 shadow-sm transition hover:bg-gray-100"
              >
                ↓ Export CSV
              </button>

              <button
                type="button"
                onClick={() => setShowAddForm(true)}
                className="rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-blue-700"
              >
                + Add Application
              </button>
            </div>
        </div>

        
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          {/* Search */}
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search company or job role..."
            className="rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder-slate-400"
          />

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder-slate-400"
          >
            <option value="All">All Applications</option>
            <option value="Applied">Applied</option>
            <option value="Interview">Interview</option>
            <option value="Offer">Offer</option>
            <option value="Rejected">Rejected</option>
          </select>

          {/* Sort */}
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder-slate-400"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>


        {/* Loading */}
        {loading && (
          <p className="py-10 text-center text-slate-500">
            Loading your applications...
          </p>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="rounded-lg bg-red-50 p-4 text-red-600">
            {error}
          </div>
        )}

        {!loading && !error && (
          <>
          <Analytics applications={jobs} />

            {/* Statistics */}
            <section className="mb-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {stats.map((stat) => (
                <div
                  key={stat.title}
                  className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md dark:border-slate-700 dark:bg-slate-900"
                >
                  <p className="mb-3 text-sm font-medium text-slate-500 dark:text-slate-400"
>
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
                  <h3 className="mb-1 text-xl font-bold text-slate-900 dark:text-white">
                    Recent Applications
                  </h3>

                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Keep track of your current opportunities.
                  </p>
                </div>

                <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-700">
                  {totalApplications} jobs
                </span>
              </div>

              {filteredJobs.length > 0 ? (
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                 {filteredJobs.map((job) => (
                  <JobCard
                    key={job.id}
                    {...job}
                    application_date={job.application_date ?? null}
                    job_url={job.job_url ?? null}
                    description={job.description ?? null}
                    notes={job.notes ?? null}
                    onUpdate={handleUpdate}
                    onDelete={handleDelete}
                  />
                ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
                  <h4 className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center dark:border-slate-700 dark:bg-slate-900">
                    No applications yet
                  </h4>

                  <p className="text-slate-500 dark:text-slate-400">
                    Add your first job application to get started.
                  </p>
                </div>
              )}
            </section>
          </>
        )}
      </div>
      {showAddForm && (
          <AddApplication
            onApplicationAdded={fetchApplications}
            onClose={() => setShowAddForm(false)}
          />
        )}
    </main>
  );
}
