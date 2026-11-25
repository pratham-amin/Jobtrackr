
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";

interface FollowUpEmail {
  subject: string;
  body: string;
  requestId: string;
}

export default function FollowUpAssistant() {
  const location = useLocation();
  const [formData, setFormData] = useState({
    name: "",
    jobTitle: "",
    company: "",
    recruiterName: "",
    situation: "application_follow_up",
    additionalContext: "",
    tone: "professional",
  });

  const [email, setEmail] = useState<FollowUpEmail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [recipientEmail, setRecipientEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sendMessage, setSendMessage] = useState("");
  const [copyMessage, setCopyMessage] = useState("");

  const [hasSent, setHasSent] = useState(false);
  const [requestId, setRequestId] = useState("");

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  useEffect(() => {
  const saved = location.state?.email;
  

  if (saved) {
   setFormData({
    name: saved.candidate_name || "",
    jobTitle: saved.job_title || "",
    company: saved.company || "",
    recruiterName: saved.recruiter_name || "",
    situation: saved.situation || "application_follow_up",
    additionalContext: saved.additional_context || "",
    tone: saved.tone || "professional",
  });

  setEmail({
    subject: saved.subject,
    body: saved.message,
    requestId: saved.request_id,
  });

  setRequestId(saved.request_id);

    setRequestId(saved.request_id);
    setHasSent(false);
    setRecipientEmail("");
    setError("");
    setSendMessage("");
    setCopyMessage("");
  }
}, [location.state]);

  const handleGenerate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setLoading(true);
    setError("");
    setSendMessage("")
    setCopyMessage("")
    setEmail(null);
    setHasSent(false);
    setRequestId("");

    try {
      const response = await fetch(
        "http://localhost:5000/follow-up/generate",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(formData),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to generate follow-up email.");
      }

      setEmail(data);
      setRequestId(data.requestId);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  };


const handleSend = async () => {
  if (!email) return;

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailPattern.test(recipientEmail.trim())) {
    setSendMessage("Please enter a valid email address.");
    return;
  }

  const confirmed = window.confirm(
    `Are you sure you want to send this email to ${recipientEmail}?`
  );

  if (!confirmed) return;

  setSending(true);
  setSendMessage("");

  try {
    const response = await fetch(
      "http://localhost:5000/follow-up/send",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          requestId,
          recipientEmail,
          subject: email.subject,
          message: email.body,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Unable to send email.");
    }

    setSendMessage("Email sent successfully!");
    setHasSent(true)
  } catch (err) {
    setSendMessage(
      err instanceof Error ? err.message : "Something went wrong."
    );
  } finally {
    setSending(false);
  }
};


const handleCopy = async () => {
  if (!email) return;

  try {
    await navigator.clipboard.writeText(
      `Subject: ${email.subject}\n\n${email.body}`
    );

    setCopyMessage("Email copied successfully!");

    setTimeout(() => {
      setCopyMessage("");
    }, 3000);
  } catch {
    setCopyMessage("Unable to copy email. Please try again.");
  }
};


const handleClear = () => {
  setFormData({
    name: "",
    jobTitle: "",
    company: "",
    recruiterName: "",
    situation: "application_follow_up",
    additionalContext: "",
    tone: "professional",
  });

  setRecipientEmail("");
  setEmail(null);
  setError("");
  setSendMessage("");
  setCopyMessage("");
  setHasSent(false);
  setRequestId("");
};



  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500";

  const labelClass =
    "mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300";

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 transition-colors dark:bg-slate-950 dark:text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
       <div className="flex flex-wrap items-center justify-between gap-4">
            <Link
              to="/ai-assistant"
              className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              ← Back to AI Assistant
            </Link>

            <Link
              to="/follow-up-history"
              className="text-sm font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400"
            >
              View Sent Email History →
            </Link>
          </div>
        
<section className=" mt-8 relative mb-8 overflow-hidden rounded-3xl bg-linear-to-br from-violet-600 via-indigo-600 to-blue-600 p-8 text-white shadow-xl shadow-indigo-500/10 sm:p-10">
  <div className="relative z-10">
    <span className="mb-4 inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold">
      AI Powered Career Tool
    </span>

    <h1 className="mb-3 text-3xl font-bold sm:text-4xl">
      AI Follow-up Assistant
    </h1>

    <p className="max-w-2xl text-sm leading-6 text-indigo-100 sm:text-base">
      Create personalised, professional follow-up emails for your job
      applications and interviews with the help of AI.
    </p>
  </div>
</section>

<section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
  <div className="mb-7">
    <h2 className="text-xl font-bold">Email Details</h2>
    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
      Enter the job and recruiter details to generate your email.
    </p>
  </div>

  <form
  id="follow-up-form"
  onSubmit={handleGenerate}
  className="space-y-6"
>
    <div className="grid gap-5 sm:grid-cols-2">
      <div>
        <label className={labelClass}>Your Name *</label>
        <input
          name="name"
          value={formData.name}
          onChange={handleChange}
          className={inputClass}
          placeholder="Enter your name"
          required
        />
      </div>

      <div>
        <label className={labelClass}>Job Title *</label>
        <input
          name="jobTitle"
          value={formData.jobTitle}
          onChange={handleChange}
          className={inputClass}
          placeholder="e.g. Software Developer"
          required
        />
      </div>

      <div>
        <label className={labelClass}>Company *</label>
        <input
          name="company"
          value={formData.company}
          onChange={handleChange}
          className={inputClass}
          placeholder="Enter company name"
          required
        />
      </div>

      <div>
        <label className={labelClass}>Recruiter Name</label>
        <input
          name="recruiterName"
          value={formData.recruiterName}
          onChange={handleChange}
          className={inputClass}
          placeholder="Optional"
        />
      </div>
    </div>

    <div>
      <label className={labelClass}>Follow-up Situation *</label>
      <select
        name="situation"
        value={formData.situation}
        onChange={handleChange}
        className={inputClass}
      >
        <option value="application_follow_up">
          Following up on a job application
        </option>
        <option value="after_interview">
          Following up after an interview
        </option>
        <option value="after_no_response">
          No response from the recruiter
        </option>
        <option value="thank_you">
          Sending a thank-you email
        </option>
      </select>
    </div>

    <div>
      <label className={labelClass}>Additional Context</label>
      <textarea
        name="additionalContext"
        value={formData.additionalContext}
        onChange={handleChange}
        className={inputClass}
        rows={4}
        placeholder="Add details such as interview date, previous communication, or anything you'd like the email to mention..."
      />
    </div>

    <div>
      <label className={labelClass}>Email Tone</label>
      <select
        name="tone"
        value={formData.tone}
        onChange={handleChange}
        className={inputClass}
      >
        <option value="professional">Professional</option>
        <option value="friendly">Friendly</option>
        <option value="confident">Confident</option>
      </select>
    </div>

    {error && (
      <p className="rounded-xl bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950/30 dark:text-red-400">
        {error}
      </p>
    )}

        
      <button
        type="submit"
        disabled={loading}
        className="inline-flex w-full items-center justify-center gap-3 rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      >
        {loading && (
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
        )}

        {loading ? "Generating Email..." : "Generate Follow-up Email"}
      </button>

  </form>
</section>


{email && (
  <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 className="text-xl font-bold">Generated Email</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Review and edit your AI-generated email before sending.
        </p>
      </div>

      <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
        Generated
      </span>
    </div>

    <div className="space-y-5">

      <div>
        <label className={labelClass}>Recipient Email *</label>
        <input
          type="email"
          value={recipientEmail}
          onChange={(e) => setRecipientEmail(e.target.value)}
          className={inputClass}
          placeholder="Enter recruiter email address"
          required
        />
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          The email will be sent from the Gmail account configured in JobTrackr.
        </p>
      </div>

      <div>
        <label className={labelClass}>Email Subject</label>
        <input
          value={email.subject}
          onChange={(e) =>
            setEmail({ ...email, subject: e.target.value })
          }
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass}>Email Message</label>
        <textarea
          value={email.body}
          onChange={(e) =>
            setEmail({ ...email, body: e.target.value })
          }
          className={inputClass}
          rows={12}
        />
      </div>

      <div className="flex flex-wrap gap-3">
        
        <button
          type="submit"
          form="follow-up-form"
          disabled={loading || sending}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-indigo-200 px-5 py-3 text-sm font-semibold text-indigo-600 transition hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-indigo-800 dark:text-indigo-400 dark:hover:bg-indigo-950"
        >
          {loading && (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-300 border-t-indigo-600" />
          )}

          {loading ? "Regenerating..." : "Regenerate Email"}
        </button>


        <button
          type="button"
          onClick={handleCopy}
          className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold transition hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
        >
          Copy Email
        </button>


                
        <button
          type="button"
          onClick={handleSend}
          disabled={sending || hasSent}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {sending && (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          )}

          {sending
            ? "Sending..."
            : hasSent
              ? "Email Sent"
              : "Send Email"}
        </button>


        <button
          type="button"
          onClick={handleClear}
          className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          Start New Email
        </button>

      </div>

      {sendMessage && (
          <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
            {sendMessage}
          </p>
        )}

      {copyMessage && (
          <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
            {copyMessage}
          </p>
        )}

    </div>
  </section>
)}



      </div>
    </main>
  );
}
