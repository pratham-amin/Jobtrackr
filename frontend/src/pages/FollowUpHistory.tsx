import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";

interface FollowUpEmail {
  id: number;
  request_id: string;
  recipient_email: string| null;
  subject: string;
  message: string;
  status: string;
  created_at: string;
  sent_at: string | null;
  candidate_name: string | null;
  job_title: string | null;
  company: string | null;
  recruiter_name: string | null;
  situation: string | null;
  additional_context: string | null;
  tone: string | null;
}

export default function FollowUpHistory() {
  const navigate = useNavigate();
  const [emails, setEmails] = useState<FollowUpEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await fetch(
          "http://localhost:5000/follow-up/history",
          { credentials: "include" }
        );

        if (!response.ok) {
          throw new Error("Unable to load email history.");
        }

        const data = await response.json();
        setEmails(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Something went wrong."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  const filteredEmails = emails.filter((email) => {
 const matchesSearch =
  email.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
  (email.recipient_email || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
  (email.company || "").toLowerCase().includes(searchTerm.toLowerCase());

  const matchesStatus =
    statusFilter === "all" || email.status === statusFilter;

  return matchesSearch && matchesStatus;
});

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-10 dark:bg-gray-950">
      <div className="mx-auto max-w-6xl">
        <div className=" mb-4 flex flex-wrap items-center justify-between gap-4">
            <Link
              to="/ai-assistant"
              className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              ← Back to AI Assistant
            </Link>
          </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Follow-up Email History
        </h1>

        <p className="mt-2 text-gray-600 dark:text-gray-400">
          View all your AI-generated follow-up emails, including drafts and sent messages.
        </p>

        <div className="mt-8">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by subject or recipient..."
            className="w-100 rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
          />
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {["all", "generated", "sent", "failed"].map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={`rounded-lg px-4 py-2 text-sm font-medium capitalize transition ${
                statusFilter === status
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              }`}
            >
              {status === "all" ? "All Emails" : status}
            </button>
          ))}
        </div>

        {loading && <p className="mt-8">Loading email history...</p>}

        {error && (
          <p className="mt-8 text-red-500">{error}</p>
        )}

        {!loading && !error && emails.length === 0 && (
          <p className="mt-8 text-gray-500">
            You haven't sent any follow-up emails yet.
          </p>
        )}

        {!loading && !error && filteredEmails.length > 0 && (
          <div className="mt-8 grid gap-5">
            {filteredEmails.map((email) => (
              <div
                key={email.id}
                className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {email.subject}
                    </h2>

                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                      To: {email.recipient_email || "Not sent yet"}
                    </p>
                  </div>

                  <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                    {email.status}
                  </span>
                </div>

                <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                  {email.sent_at
                    ? `Sent: ${new Date(email.sent_at).toLocaleString("en-AU", {
                            timeZone: "Australia/Melbourne",
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}`
                    : `Generated: ${new Date(email.created_at).toLocaleString("en-AU", {
                              timeZone: "Australia/Melbourne",
                              dateStyle: "medium",
                              timeStyle: "short",
                            })}`}
                </p>

                <details className="mt-5">
                  <summary className="cursor-pointer text-sm font-semibold text-blue-600 dark:text-blue-400">
                    View email message
                  </summary>

                  <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-gray-700 dark:text-gray-300">
                    {email.message}
                  </p>
                </details>

                {email.status === "generated" && (
                  <button
                    type="button"
                    onClick={() =>
                      navigate("/follow-up-assistant", {
                        state: { email },
                      })
                    }
                    className="mt-5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                  >
                    Continue Editing →
                  </button>
                )}

              </div>
            ))}
          </div>
        )}

        {!loading && !error && emails.length > 0 && filteredEmails.length === 0 && (
            <p className="mt-8 text-center text-gray-500 dark:text-gray-400">
              No emails match your search or selected filter.
            </p>
          )}
      </div>
    </div>
  );
}