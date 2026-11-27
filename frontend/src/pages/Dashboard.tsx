
import { useEffect, useState } from "react";
import JobCard from "../components/JobCard";
import AddApplication from "../components/AddApplication";
import Analytics from "../components/analytics";
import {exportApplications} from "../utils/exportApplications";
import { Link } from "react-router-dom";
const API_URL = "http://localhost:5000";

type Job = {
  id: number;
  company: string;
  role: string;
  status: string;
  application_date?: string | null;
  follow_up_date?: string | null;
  follow_up_status?: string | null;
  last_follow_up_at?: string | null;
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

  const [dueFollowUps, setDueFollowUps] = useState<Job[]>([]);
  const [followUpsLoading, setFollowUpsLoading] = useState(true);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [successMessage, setSuccessMessage] = useState("");

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


async function fetchDueFollowUps() {
  try {
    setFollowUpsLoading(true);

    const response = await fetch(
      `${API_URL}/applications/follow-ups/due`,
      {
        credentials: "include",
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch due follow-ups.");
    }

    const data: Job[] = await response.json();
    setDueFollowUps(data);
  } catch (err) {
    console.error("Follow-up fetch error:", err);
  } finally {
    setFollowUpsLoading(false);
  }
}


async function handleMarkFollowUpSent(id: number) {
  try {
    const response = await fetch(
      `${API_URL}/applications/${id}/follow-up`,
      {
        method: "PATCH",
        credentials: "include",
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error || "Failed to update follow-up."
      );
    }

    await fetchDueFollowUps();
    await fetchApplications();
    setSuccessMessage("Follow-up marked as sent!");
  } catch (err) {
    console.error("Mark follow-up error:", err);
    alert("Unable to mark follow-up as sent. Please try again.");
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
): Promise<boolean> {
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
  const errorData = await response.json();
  throw new Error(errorData.error || "Failed to update application.");
}

    await fetchApplications();
    await fetchDueFollowUps();

    setSuccessMessage("Application updated successfully!");

    return true;
  } catch (error) {
    console.error("Update error:", error);
    alert(error instanceof Error ? error.message : "Unable to update application.");
    return false;
  }
}

function handleDelete(id: number) {
  setSelectedJobId(id);
  setShowDeleteConfirm(true);
}

async function confirmDelete() {
  if (selectedJobId === null) return;

  try {
    setDeleteLoading(true);

    const response = await fetch(
      `${API_URL}/applications/${selectedJobId}`,
      {
        method: "DELETE",
        credentials: "include",
      }
    );

    if (!response.ok) {
      throw new Error("Failed to delete application.");
    }

    setShowDeleteConfirm(false);
    setSelectedJobId(null);

    await fetchApplications();
    setSuccessMessage("Application deleted successfully!");
  } catch (error) {
    console.error(error);
    alert("Unable to delete application.");
  } finally {
    setDeleteLoading(false);
  }
}
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

  const recentActivity = [...jobs]
  .sort((a, b) => {
    const dateA = new Date(
      a.updated_at || a.created_at || 0
    ).getTime();

    const dateB = new Date(
      b.updated_at || b.created_at || 0
    ).getTime();

    return dateB - dateA;
  })
  .slice(0, 5);


  useEffect(() => {
  if (!successMessage) return;

  const timer = setTimeout(() => {
    setSuccessMessage("");
  }, 4000);

  return () => clearTimeout(timer);
}, [successMessage]);

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
              <Link
                to="/ai-assistant"
                className="
                  inline-flex items-center gap-2 rounded-lg
                  bg-linear-to-r from-violet-600 via-indigo-600 to-blue-600
                  px-5 py-2.5 font-semibold text-white
                  shadow-md shadow-indigo-500/20
                  transition-all duration-300
                  hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-500/30
                  focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
                  dark:from-violet-500 dark:via-indigo-500 dark:to-blue-500
                "
              >
                <span>✦</span>
                AI Assistant
              </Link>
            </div>
        </div>

        
        <div className="mb-6 flex w-full flex-col gap-4 sm:flex-row sm:items-center">
          {/* Search */}
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search company or job role..."
            className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder-slate-400"
          />

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
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
            className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>
        

        {statusFilter !== "All" && (
            <div className="mb-6 flex items-center gap-2">
              <span className="text-sm text-slate-600 dark:text-slate-300">
                Showing applications with status:
              </span>

              <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                {statusFilter}
              </span>

              <button
                type="button"
                onClick={() => setStatusFilter("All")}
                className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
              >
                Clear
              </button>
            </div>
          )}

          {/* Applications */}
            <section className="mb-8">
              <div className="mb-8 flex items-center justify-between">
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

              {loading ? (
                <div className="py-10 text-center text-slate-500">
                  Loading your applications...
                </div>
              ) : filteredJobs.length > 0 ? (
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
              ) : jobs.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center dark:border-slate-700 dark:bg-slate-900">
                  <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-900/30">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="h-8 w-8 text-blue-600 dark:text-blue-400"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 4.5v15m7.5-7.5h-15"
                      />
                    </svg>
                  </div>

                  <h4 className="text-xl font-bold text-slate-900 dark:text-white">
                    No applications yet
                  </h4>

                  <p className="mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">
                    Start organizing your job search. Add your first application and track your progress all in one place.
                  </p>

                  <button
                    type="button"
                    onClick={() => setShowAddForm(true)}
                    className="mt-6 rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                  >
                    + Add Your First Application
                  </button>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center dark:border-slate-700 dark:bg-slate-900">
                  <h4 className="text-lg font-semibold">No matching applications</h4>
                  <p className="mt-2 text-slate-500 dark:text-slate-400">
                    Try changing your search or status filter.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchTerm("");
                      setStatusFilter("All");
                    }}
                    className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                  >
                    Clear Filters
                  </button>
                </div>
              )}
            </section>

        {/* Loading */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>

              <p className="mt-4 text-sm font-medium text-slate-500 dark:text-slate-400">
                Loading your applications...
              </p>
            </div>
          )}

          {/* Error */}
          {/* Error */}
          {!loading && error && (
            <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-red-200 bg-red-50 p-6 text-center dark:border-red-800 dark:bg-red-950/30">
              <p className="text-sm font-medium text-red-600 dark:text-red-400">
                {error}
              </p>

              <button
                type="button"
                onClick={fetchApplications}
                className="rounded-lg bg-red-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
              >
                Try Again
              </button>
            </div>
          )}

        {!loading && !error && (
          <>
          <Analytics applications={jobs} />



            {/* Statistics */}
            <section className="mb-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {stats.map((stat) => (
                  <button
                    type="button"
                    key={stat.title}
                    onClick={() => {
                      const filterMap: Record<string, string> = {
                        "Total Applications": "All",
                        "Applied": "Applied",
                        "Interviews": "Interview",
                        "Offers": "Offer",
                      };

                      setStatusFilter(filterMap[stat.title] || "All");
                    }}
                    className="w-full rounded-xl border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-md dark:border-slate-700 dark:bg-slate-900 text-black dark:text-amber-50"
                  >
                    <div className={`mb-4 inline-flex rounded-lg p-3 ${stat.background}`}>
                    <span className={`text-2xl font-bold ${stat.color}`}>
                      {stat.value}
                    </span>
                  </div>

                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                    {stat.title}
                  </p>
                </button>
              ))}
            </section>
            
             
              {/* Recent Activity */}
              
            {!loading && (
              <section className="mb-10 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                <div className="mb-5">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                    Recent Activity
                  </h3>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Your five most recently updated applications.
                  </p>
                </div>

                {recentActivity.length === 0 ? (
                  <p className="py-6 text-center text-slate-500">
                    No recent activity yet.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {recentActivity.map((job) => (
                      <div
                        key={job.id}
                        className="flex flex-col justify-between gap-2 border-b border-slate-100 pb-4 last:border-0 last:pb-0 dark:border-slate-800 sm:flex-row sm:items-center"
                      >
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white">
                            {job.company}
                          </p>
                          <p className="text-sm text-slate-500 dark:text-slate-400">
                            {job.role} · {job.status}
                          </p>
                        </div>

                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {job.updated_at
                            ? `Updated ${new Date(job.updated_at).toLocaleDateString()}`
                            : `Added ${new Date(job.created_at || "").toLocaleDateString()}`}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}

            

            
          </>
        )}
      </div>
      {showAddForm && (
          <AddApplication
            onApplicationAdded={() => {
              fetchApplications();
              setSuccessMessage("Application added successfully!");
            }}
            onClose={() => setShowAddForm(false)}
          />
        )}

      
            {/* Follow-up Reminders */}
          {!loading && !followUpsLoading && (
            <section className="mt-10 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                    Follow-up Reminders
                  </h3>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Keep track of applications that need your attention.
                  </p>
                </div>

                <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-700">
                  {dueFollowUps.length} Due
                </span>
              </div>

              {followUpsLoading ? (
                <p className="py-6 text-center text-slate-500">
                  Loading follow-ups...
                </p>
              ) : dueFollowUps.length === 0 ? (
                <div className="rounded-lg bg-slate-50 px-4 py-8 text-center dark:bg-slate-800">
                  <p className="font-medium text-slate-700 dark:text-slate-200">
                    You're all caught up!
                  </p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    No follow-ups are due right now.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {dueFollowUps.map((job) => (
                    <div
                      key={job.id}
                      className="flex flex-col gap-4 rounded-lg border border-slate-200 p-4 dark:border-slate-700 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <h4 className="font-semibold text-slate-900 dark:text-white">
                          {job.company}
                        </h4>
                        <p className="text-sm text-slate-600 dark:text-slate-300">
                          {job.role}
                        </p>
                        <p className="mt-1 text-sm text-amber-600 dark:text-amber-400 ">
                          Follow-up date: {job.follow_up_date}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleMarkFollowUpSent(job.id)}
                        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                      >
                        Mark as Sent
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>

          )}
            
            {/* Delete Confirmation Dialog */}
            {showDeleteConfirm && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900">

                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                    <span className="text-2xl text-red-600">!</span>
                  </div>

                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                    Delete Application?
                  </h3>

                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                    Are you sure you want to delete this application? This action cannot be undone.
                  </p>

                  <div className="mt-6 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowDeleteConfirm(false);
                        setSelectedJobId(null);
                      }}
                      disabled={deleteLoading}
                      className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      onClick={confirmDelete}
                      disabled={deleteLoading}
                      className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                    >
                      {deleteLoading ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {successMessage && (
            <div className="fixed right-5 top-5 z-[100] flex items-center gap-3 rounded-xl border border-green-200 bg-white px-5 py-4 shadow-lg dark:border-green-800 dark:bg-slate-900">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400">
                ✓
              </div>

              <p className="text-sm font-medium text-slate-800 dark:text-white">
                {successMessage}
              </p>

              <button
                type="button"
                onClick={() => setSuccessMessage("")}
                className="ml-2 text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                ✕
              </button>
            </div>
          )}
    </main>
  );
}
