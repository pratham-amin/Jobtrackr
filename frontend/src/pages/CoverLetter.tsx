
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { jsPDF } from "jspdf";


interface CoverLetterResponse {
  message: string;
  coverLetter: string;
  error?: string;
}

export default function CoverLetter() {
  const [formData, setFormData] = useState({
    jobTitle: "",
    company: "",
    jobDescription: "",
    skills: "",
    experience: "",
    tone: "professional",
  });

   // Load saved professional details here
  useEffect(() => {
    async function loadProfile() {
      try {
        const response = await fetch("http://localhost:5000/auth/me", {
          credentials: "include",
        });

        if (!response.ok) {
          return;
        }

        const data = await response.json();

        setFormData((prev) => ({
          ...prev,
          skills: data.user.skills || "",
          experience: data.user.experience || "",
        }));
      } catch (err) {
        console.error("Unable to load professional profile:", err);
      }
    }

    loadProfile();
  }, []);


  const [coverLetter, setCoverLetter] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const [showDownloadOptions, setShowDownloadOptions] = useState(false);

const downloadMenuRef = useRef<HTMLDivElement>(null);

useEffect(() => {
  function handleClickOutside(event: MouseEvent) {
    if (
      downloadMenuRef.current &&
      !downloadMenuRef.current.contains(event.target as Node)
    ) {
      setShowDownloadOptions(false);
    }
  }

  document.addEventListener("mousedown", handleClickOutside);

  return () => {
    document.removeEventListener("mousedown", handleClickOutside);
  };
}, []);

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

  const handleGenerate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setLoading(true);
    setError("");
    setCoverLetter("");

    try {
      const response = await fetch(
        "http://localhost:5000/ai/cover-letter",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(formData),
        }
      );

      const data: CoverLetterResponse = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to generate cover letter."
        );
      }

      setCoverLetter(data.coverLetter);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(coverLetter);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Unable to copy. Please select and copy the text manually.");
    }
  };

  const handleDownload = () => {
  const blob = new Blob([coverLetter], {
    type: "text/plain;charset=utf-8",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `Cover_Letter_${formData.company.replace(/\s+/g, "_")}.txt`;

  document.body.appendChild(link);
  link.click();

  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const handleDownloadPDF = () => {
  const doc = new jsPDF();

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const maxWidth = pageWidth - margin * 2;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("Cover Letter", margin, 25);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);

  const lines = doc.splitTextToSize(coverLetter, maxWidth);

  let y = 40;
  const pageHeight = doc.internal.pageSize.getHeight();

  lines.forEach((line: string) => {
    if (y > pageHeight - 20) {
      doc.addPage();
      y = 20;
    }

    doc.text(line, margin, y);
    y += 7;
  });

  const companyName = formData.company.replace(/\s+/g, "_");

  doc.save(`Cover_Letter_${companyName}.pdf`);
};

  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500";

  const labelClass =
    "mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300";

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 transition-colors dark:bg-slate-950 dark:text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">

        {/* Back button */}
        <div className="mb-6 flex justify-end">
          <Link
            to="/ai-assistant"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <span>←</span>
            Back to AI Assistant
          </Link>
        </div>

        {/* Hero section */}
        <section className="relative mb-8 overflow-hidden rounded-3xl bg-linear-to-br from-violet-600 via-indigo-600 to-blue-600 p-8 text-white shadow-xl shadow-indigo-500/10 sm:p-10">
          <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-20 left-1/3 h-56 w-56 rounded-full bg-purple-400/20 blur-3xl" />

          <div className="relative z-10">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium backdrop-blur">
              <span>✦</span>
              AI Powered Career Tool
            </div>

            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              AI Cover Letter Generator
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-7 text-indigo-100 sm:text-base">
              Create personalised, professional cover letters tailored
              to your skills, experience, and the job you're applying for.
            </p>
          </div>
        </section>

        {/* Form */}
        <form
          onSubmit={handleGenerate}
          className="space-y-7 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8"
        >
          <div className="border-b border-slate-200 pb-5 dark:border-slate-800">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Application Information
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Provide the job details so AI can personalise your letter.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Job Title</label>
              <input
                name="jobTitle"
                value={formData.jobTitle}
                onChange={handleChange}
                required
                placeholder="e.g. Frontend Developer"
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Company</label>
              <input
                name="company"
                value={formData.company}
                onChange={handleChange}
                required
                placeholder="Company name"
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Job Description</label>
            <textarea
              name="jobDescription"
              value={formData.jobDescription}
              onChange={handleChange}
              required
              rows={5}
              placeholder="Paste the job description here..."
              className={`${inputClass} resize-y`}
            />
          </div>

          <div>
            <label className={labelClass}>Your Skills</label>
            <textarea
              name="skills"
              value={formData.skills}
              onChange={handleChange}
              rows={3}
              placeholder="React, TypeScript, Node.js..."
              className={`${inputClass} resize-y`}
            />
          </div>

          <div>
            <label className={labelClass}>Your Experience</label>
            <textarea
              name="experience"
              value={formData.experience}
              onChange={handleChange}
              rows={3}
              placeholder="Describe your relevant experience..."
              className={`${inputClass} resize-y`}
            />
          </div>

          <div>
            <label className={labelClass}>Writing Tone</label>
            <select
              name="tone"
              value={formData.tone}
              onChange={handleChange}
              className={inputClass}
            >
              <option value="professional">Professional</option>
              <option value="confident">Confident</option>
              <option value="enthusiastic">Enthusiastic</option>
            </select>
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-linear-to-r from-violet-600 via-indigo-600 to-blue-600 px-6 py-4 font-semibold text-white shadow-lg shadow-indigo-500/20 transition duration-200 hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
          >
            {loading ? "✦ Generating your cover letter..." : "✦ Generate Cover Letter"}
          </button>

          <p className="text-center text-xs text-slate-400 dark:text-slate-500">
            AI-generated content should be reviewed before submitting your application.
          </p>
        </form>

        {/* Generated cover letter */}
        {coverLetter && (
          <section className="mt-8 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 p-6 dark:border-slate-800">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Your Generated Cover Letter
                </h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Review and customise it before sending.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                {/* Copy button */}
                <button
                  type="button"
                  onClick={handleCopy}
                  className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
                >
                  {copied ? "✓ Copied!" : "Copy Letter"}
                </button>

                {/* Download dropdown */}
                <div className="relative" ref={downloadMenuRef}>
                  <button
                    type="button"
                    onClick={() => setShowDownloadOptions(!showDownloadOptions)}
                    className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
                  >
                    ↓ Download
                    <span>{showDownloadOptions ? "▲" : "▼"}</span>
                  </button>

                  {showDownloadOptions && (
                    <div className="absolute right-0 z-20 mt-2 w-52 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-800 dropdown-animation">
                      <button
                        type="button"
                        onClick={() => {
                          handleDownload();
                          setShowDownloadOptions(false);
                        }}
                        className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700"
                      >
                        📄 Download as TXT
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          handleDownloadPDF();
                          setShowDownloadOptions(false);
                        }}
                        className="flex w-full items-center gap-3 border-t border-slate-200 px-4 py-3 text-left text-sm text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700"
                      >
                        📕 Download as PDF
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="overflow-x-auto bg-slate-100 p-4 dark:bg-slate-950 sm:p-8">
              <div className="mx-auto min-h-175 w-full max-w-200 rounded-sm bg-white px-8 py-12 shadow-lg sm:px-14 sm:py-16">
                <div className="mb-8 border-b border-slate-200 pb-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">
                    Cover Letter
                  </p>
                </div>

                <p className="whitespace-pre-wrap wrap-break-words font-serif text-[15px] leading-8 text-slate-800">
                  {coverLetter}
                </p>
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
