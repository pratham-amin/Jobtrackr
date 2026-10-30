
import { useState } from "react";
import { Link } from "react-router-dom";

interface JobProps {
  id: number;
  company: string;
  role: string;
  status: string;
  application_date: string | null;
  job_url: string | null;
  description: string | null;
  notes: string | null;
  onUpdate: (
    id: number,
    updatedJob: { company: string; role: string; status: string
      application_date: string | null;
      job_url: string | null;
      description: string | null;
      notes: string | null; }
  ) => void;  
  onDelete: (id: number) => void;
}

export default function JobCard({
  id,
  company,
  role,
  status,
  application_date,
  job_url,
  description,
  notes,
  onUpdate,
  onDelete,
}: JobProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editCompany, setEditCompany] = useState(company);
  const [editRole, setEditRole] = useState(role);
  const [editStatus, setEditStatus] = useState(status);
  const [editApplicationDate, setEditApplicationDate] = useState(
  application_date ? application_date.split("T")[0] : ""
);
const [editJobUrl, setEditJobUrl] = useState(job_url || "");
const [editDescription, setEditDescription] = useState(description || "");
const [editNotes, setEditNotes] = useState(notes || "");

  const statusStyles: Record<string, string> = {
    Applied: "bg-blue-100 text-blue-700",
    Interview: "bg-amber-100 text-amber-700",
    Offer: "bg-green-100 text-green-700",
    Rejected: "bg-red-100 text-red-700",
  };

  const badgeStyle =
    statusStyles[status] ?? "bg-slate-100 text-slate-700";

  function handleSave() {
    if (!editCompany.trim() || !editRole.trim()) {
      alert("Company and role are required.");
      return;
    }

    onUpdate(id, {
      company: editCompany.trim(),
      role: editRole.trim(),
      status: editStatus,
      application_date: editApplicationDate,
      job_url: editJobUrl,
      description: editDescription,
      notes: editNotes,
    });

    setIsEditing(false);
  }

  
  return (
    
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg">
      {isEditing ? (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-900">
            Edit Application
          </h3>

          <input
            value={editCompany}
            onChange={(e) => setEditCompany(e.target.value)}
            placeholder="Company"
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          />

          <input
            value={editRole}
            onChange={(e) => setEditRole(e.target.value)}
            placeholder="Job Role"
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          />

          <select
            value={editStatus}
            onChange={(e) => setEditStatus(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          >
            <option value="Applied">Applied</option>
            <option value="Interview">Interview</option>
            <option value="Offer">Offer</option>
            <option value="Rejected">Rejected</option>
          </select>

          {/* Application Date */}
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Application Date
            </label>
            <input
              type="date"
              value={editApplicationDate}
              onChange={(e) => setEditApplicationDate(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
            />
          </div>

          {/* Job Posting URL */}
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Job Posting URL
            </label>
            <input
              type="url"
              value={editJobUrl}
              onChange={(e) => setEditJobUrl(e.target.value)}
              placeholder="https://example.com/job"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
            />
          </div>

          {/* Job Description */}
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Job Description
            </label>
            <textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Notes
            </label>
            <textarea
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Save
            </button>

            <button
              onClick={() => setIsEditing(false)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="mb-4 flex items-start justify-between gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50 text-lg font-bold text-blue-600">
              {company.trim().charAt(0).toUpperCase()}
            </div>

            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${badgeStyle}`}
            >
              {status}
            </span>
          </div>

          <h3 className="mb-1 text-lg font-bold text-slate-900">
            {role}
          </h3>

          <p className="mb-4 text-sm text-slate-500">
            {company}
          </p>

          <div className="flex gap-3 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="flex-1 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 transition hover:border-blue-600 hover:bg-blue-600 hover:text-white"
            >
              Edit 
            </button>

            <button
              type="button"
              onClick={() => onDelete(id)}
              className="flex-1 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:border-red-600 hover:bg-red-600 hover:text-white"
            >
              Delete
            </button>
          </div>
          <div className="mt-1 flex gap-3">
            <Link
          to={`/applications/${id}`}
          className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-4 py-4 text-center text-sm mt-4 font-semibold text-slate-700 transition hover:border-slate-600 hover:bg-slate-700 hover:text-white"
          >
          View Details
           </Link>
          </div>
  
        </>
      )}
    </article>
  );
}
