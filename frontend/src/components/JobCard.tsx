
interface JobProps {
  company: string;
  role: string;
  status: string;
}

export default function JobCard({
  company,
  role,
  status,
}: JobProps) {
  const statusStyles: Record<string, string> = {
    Applied: "bg-blue-100 text-blue-700",
    Interview: "bg-amber-100 text-amber-700",
    Offer: "bg-green-100 text-green-700",
    Rejected: "bg-red-100 text-red-700",
  };

  const badgeStyle =
    statusStyles[status] ?? "bg-slate-100 text-slate-700";

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg">
      {/* Company and icon */}
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

      {/* Job details */}
      <h3 className="mb-1 text-lg font-bold text-slate-900">
        {role}
      </h3>

      <p className="mb-4 text-sm text-slate-500">
        {company}
      </p>

      <div className="border-t border-slate-100 pt-3">
        <p className="text-xs text-slate-400">
          Job application
        </p>
      </div>
    </article>
  );
}
