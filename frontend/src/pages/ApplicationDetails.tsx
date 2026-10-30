import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

const API_URL = "http://localhost:5000";

type Application = {
  id: number;
  company: string;
  role: string;
  status: string;
  application_date: string | null;
  job_url: string | null;
  description: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

function ApplicationDetails() {
  const { id } = useParams<{ id: string }>();

  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchApplication() {
      try {
        const response = await fetch(`${API_URL}/applications/${id}`, {
          credentials: "include",
        });

        if (response.status === 401) {
          window.location.href = "/login";
          return;
        }

        if (!response.ok) {
          throw new Error("Application not found.");
        }

        const data: Application = await response.json();
        setApplication(data);
      } catch (err) {
        console.error(err);
        setError("Unable to load application details.");
      } finally {
        setLoading(false);
      }
    }

    fetchApplication();
  }, [id]);

  if (loading) {
    return <p className="p-8 text-center">Loading application...</p>;
  }

  if (error || !application) {
    return (
      <div className="mx-auto max-w-3xl p-8 text-center">
        <p className="mb-4 text-red-600">
          {error || "Application not found."}
        </p>
        <Link to="/dashboard" className="text-blue-600 hover:underline">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto max-w-3xl">
        <Link
          to="/dashboard"
          className="mb-6 inline-block text-sm font-medium text-blue-600 hover:underline"
        >
          ← Back to Dashboard
        </Link>

        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mb-6">
            <p className="text-sm font-medium text-slate-500">
              Application Details
            </p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900">
              {application.role}
            </h1>
            <p className="mt-1 text-lg text-slate-600">
              {application.company}
            </p>
            <span className="mt-4 inline-block rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">
              {application.status}
            </span>
          </div>

          <div className="space-y-5 border-t border-slate-200 pt-6">
            <Detail label="Application Date" value={application.application_date} />
            <Detail label="Job Posting URL" value={application.job_url} />
            <Detail label="Description" value={application.description} />
            <Detail label="Notes" value={application.notes} />
            <Detail label="Created At" value={application.created_at} />
            <Detail label="Last Updated" value={application.updated_at} />
          </div>
        </div>
      </div>
    </main>
  );
}

function Detail({ label, value }: { label: string; value: string | null }) {
  const displayValue =
    label === "Application Date" && value
      ? value.split("T")[0].split("-").reverse().join("-")
      : value;

  return (
    <div>
      <h2 className="text-sm font-semibold text-slate-500">{label}</h2>

      {label === "Job Posting URL" && value ? (
        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 break-all text-blue-600 hover:underline"
        >
          {value}
        </a>
      ) : (
        <p className="mt-1 whitespace-pre-wrap text-slate-800">
          {displayValue || "Not provided"}
        </p>
      )}
    </div>
  );
}

export default ApplicationDetails;