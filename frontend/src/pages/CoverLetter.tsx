
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { jsPDF } from "jspdf";


interface CoverLetterResponse {
  message: string;
  coverLetter: string;
  error?: string;
}

interface CoverLetterHistoryItem {
  id: number;
  job_title: string;
  company: string;
  tone: string;
  content: string;
  created_at: string;
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

  const navigate = useNavigate();
  const [coverLetter, setCoverLetter] = useState("");
  const [selectedHistoryLetter, setSelectedHistoryLetter] = useState<CoverLetterHistoryItem | null>(null);

  const [isEditingHistoryLetter, setIsEditingHistoryLetter] = useState(false);
  const [editedCoverLetter, setEditedCoverLetter] = useState("");
  const hasUnsavedChanges =
  isEditingHistoryLetter &&
  editedCoverLetter !== coverLetter;

  const [savingHistoryChanges, setSavingHistoryChanges] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<CoverLetterHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const [historySearch, setHistorySearch] = useState("");
  const [historySort, setHistorySort] = useState("newest");
  const [historyTone, setHistoryTone] = useState("all");
  const [activeHistoryDownloadId, setActiveHistoryDownloadId] =
  useState<number | null>(null);
  const historyDownloadRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
  const hasUnsavedChanges =
    isEditingHistoryLetter &&
    editedCoverLetter !== coverLetter;

  if (!hasUnsavedChanges) return;

  const handleBeforeUnload = (event: BeforeUnloadEvent) => {
    event.preventDefault();
    event.returnValue = "";
  };

  window.addEventListener("beforeunload", handleBeforeUnload);

  return () => {
    window.removeEventListener("beforeunload", handleBeforeUnload);
  };
}, [isEditingHistoryLetter, editedCoverLetter, coverLetter]);
  

  useEffect(() => {
  const handleClickOutside = (event: MouseEvent) => {
    if (
      historyDownloadRef.current &&
      !historyDownloadRef.current.contains(event.target as Node)
    ) {
      setActiveHistoryDownloadId(null);
    }
  };

  document.addEventListener("mousedown", handleClickOutside);

  return () => {
    document.removeEventListener("mousedown", handleClickOutside);
  };
}, []);

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

    const handleOpenHistory = async () => {
    setShowHistory(true);
    setHistoryLoading(true);
    setHistoryError("");

    try {
      const response = await fetch(
        "http://localhost:5000/ai/cover-letter/history",
        {
          credentials: "include",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to load history.");
      }

      setHistory(data.history || []);
    } catch (err) {
      setHistoryError(
        err instanceof Error ? err.message : "Unable to load history."
      );
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleDeleteHistory = async (id: number) => {
  const confirmed = window.confirm(
    "Are you sure you want to delete this cover letter? This action cannot be undone."
  );

  if (!confirmed) return;

  try {
    const response = await fetch(
      `http://localhost:5000/ai/cover-letter/history/${id}`,
      {
        method: "DELETE",
        credentials: "include",
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Unable to delete cover letter.");
    }

    setHistory((previousHistory) =>
      previousHistory.filter((item) => item.id !== id)
    );

    if (selectedHistoryLetter?.id === id) {
      setSelectedHistoryLetter(null);
      setCoverLetter("");
    }

  } catch (err) {
    alert(
      err instanceof Error
        ? err.message
        : "Unable to delete cover letter."
    );
  }
};

const handleSaveHistoryChanges = async () => {
  if (!selectedHistoryLetter) return;

  setSavingHistoryChanges(true);
  setError("");

  try {
    const response = await fetch(
      `http://localhost:5000/ai/cover-letter/history/${selectedHistoryLetter.id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          content: editedCoverLetter,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Unable to save changes.");
    }

    const updatedLetter = data.historyItem;

    setCoverLetter(updatedLetter.content);
    setSelectedHistoryLetter(updatedLetter);

    setHistory((previousHistory) =>
      previousHistory.map((item) =>
        item.id === updatedLetter.id ? updatedLetter : item
      )
    );

    setIsEditingHistoryLetter(false);
    alert("Cover letter updated successfully!");
  } catch (err) {
    setError(
      err instanceof Error ? err.message : "Unable to save changes."
    );
  } finally {
    setSavingHistoryChanges(false);
  }
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
      setSelectedHistoryLetter(null);
      if (showHistory) {
        const historyResponse = await fetch(
          "http://localhost:5000/ai/cover-letter/history",
          {
            credentials: "include",
          }
        );

        const historyData = await historyResponse.json();

        if (historyResponse.ok) {
          setHistory(historyData.history || []);
        }
      }
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

const handleHistoryDownloadPDF = (item: CoverLetterHistoryItem) => {
  const doc = new jsPDF();

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const maxWidth = pageWidth - margin * 2;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("Cover Letter", margin, 25);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);

  const lines = doc.splitTextToSize(item.content, maxWidth);

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

  const companyName = item.company.replace(/\s+/g, "_");

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
        <div className="mb-6 flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                if (
                  isEditingHistoryLetter &&
                  editedCoverLetter !== coverLetter
                ) {
                  const confirmLeave = window.confirm(
                    "You have unsaved changes. Are you sure you want to leave without saving?"
                  );

                  if (!confirmLeave) return;
                }

                navigate("/ai-assistant");
              }}
              className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Back to AI Assistant
            </button>

            <button
              type="button"
              onClick={handleOpenHistory}
              className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Cover Letter History
            </button>

            
          </div>
          {showHistory && (
            <div className="mb-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-slate-800 ">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900  dark:text-white">
                    Cover Letter History
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Your previously generated cover letters.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowHistory(false)}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                >
                  Close
                </button>
              </div>

              {historyLoading && (
                <p className="text-sm text-gray-500">
                  Loading your cover letters...
                </p>
              )}

              {historyError && (
                <p className="text-sm text-red-600">{historyError}</p>
              )}

              {!historyLoading && !historyError && history.length === 0 && (
                <p className="text-sm text-gray-500">
                  No saved cover letters yet. Generate a cover letter to see it here.
                </p>
              )}

              {!historyLoading && history.length > 0 && (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={historySearch}
                    onChange={(e) => setHistorySearch(e.target.value)}
                    placeholder="Search by job title or company..."
                    className="mb-4 w-75 rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-gray-700 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500/20"
                  />
                 <div className="relative mb-4 inline-block mx-2">
                      <select
                        value={historySort}
                        onChange={(e) => setHistorySort(e.target.value)}
                        className="min-w-48 cursor-pointer appearance-none rounded-lg border border-gray-300 bg-white py-3 pl-4 pr-12 text-sm text-gray-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 mx-2"
                      >
                        <option value="all">All filters</option>
                        <option value="newest">Newest First</option>
                        <option value="oldest">Oldest First</option>
                        <option value="company">Company A–Z</option>

                      </select>

                      <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-gray-500">
                        ▼
                      </span>
                    </div>

                    <div className="relative mb-4 inline-block mx-0.5">
                      <select
                        value={historyTone}
                        onChange={(e) => setHistoryTone(e.target.value)}
                        className="min-w-48 cursor-pointer appearance-none rounded-lg border border-gray-300 bg-white py-3 pl-4 pr-12 text-sm text-gray-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      >
                        <option value="all">All Tones</option>
                        <option value="professional">Professional</option>
                        <option value="confident">Confident</option>
                        <option value="enthusiastic">Enthusiastic</option>
                      </select>

                      <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-gray-500">
                        ▼
                      </span>
                    </div>
                    {history
                    .filter((item) => {
                      const search = historySearch.toLowerCase().trim();

                      const matchesSearch =
                        item.job_title.toLowerCase().includes(search) ||
                        item.company.toLowerCase().includes(search);

                      const matchesTone =
                        historyTone === "all" || item.tone === historyTone;

                      return matchesSearch && matchesTone;
                    })
                    .sort((a, b) => {
                       if (historySort === "all") {
                          return 0;
                        }

                      if (historySort === "oldest") {
                        return (
                          new Date(a.created_at).getTime() -
                          new Date(b.created_at).getTime()
                        );
                      }

                      if (historySort === "company") {
                        return a.company.localeCompare(b.company);
                      }

                      return (
                        new Date(b.created_at).getTime() -
                        new Date(a.created_at).getTime()
                      );
                    })
                    .map((item) => (
                    <div
                      key={item.id}
                      className="flex flex-col gap-3 rounded-lg border border-gray-200 p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          {item.job_title}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          {item.company}
                        </p>
                        <p className="mt-1 text-xs text-gray-400 dark:text-gray-400">
                          {new Date(item.created_at).toLocaleDateString()} · {item.tone}
                        </p>
                      </div>

                      <div className="flex gap-2">
                      <button
                        type="button"
                          onClick={() => {
                            if (
                            isEditingHistoryLetter &&
                            editedCoverLetter !== coverLetter
                          ) {
                            const confirmSwitch = window.confirm(
                              "You have unsaved changes. Are you sure you want to switch to another letter?"
                            );

                            if (!confirmSwitch) return;
                          }
                          setIsEditingHistoryLetter(false);
                          setEditedCoverLetter(item.content);

                          setCoverLetter(item.content);
                          setSelectedHistoryLetter(item);
                          setShowHistory(false);

                          setTimeout(() => {
                            document
                              .getElementById("cover-letter-preview")
                              ?.scrollIntoView({ behavior: "smooth", block: "start" });
                          }, 100);
                        }}
                        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                      >
                        View
                      </button>

                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(item.content);
                            alert("Cover letter copied successfully!");
                          } catch {
                            alert("Unable to copy cover letter.");
                          }
                        }}
                        className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                      >
                        Copy
                      </button>

                      <div
                          className="relative"
                          ref={
                            activeHistoryDownloadId === item.id
                              ? historyDownloadRef
                              : null
                          }
                        >
                          <button
                            type="button"
                            onClick={() =>
                            setActiveHistoryDownloadId(
                              activeHistoryDownloadId === item.id ? null : item.id
                            )
                            }
                            className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
                          >
                            ↓ Download
                            <span>{showDownloadOptions ? "▲" : "▼"}</span>
                          </button>

                          {activeHistoryDownloadId === item.id && (
                            <div className="absolute right-0 z-30 mt-2 w-48 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
                              <button
                                type="button"
                                onClick={() => {
                                  const blob = new Blob([item.content], {
                                    type: "text/plain;charset=utf-8",
                                  });

                                  const url = URL.createObjectURL(blob);
                                  const link = document.createElement("a");

                                  link.href = url;
                                  link.download = `${item.job_title.replace(/[^a-z0-9]/gi, "_")}_Cover_Letter.txt`;

                                  document.body.appendChild(link);
                                  link.click();
                                  document.body.removeChild(link);
                                  URL.revokeObjectURL(url);

                                  setActiveHistoryDownloadId(null);
                                }}
                                className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-100"
                              >
                                📄 Download as TXT
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  handleHistoryDownloadPDF(item);
                                  setShowDownloadOptions(false);
                                }}
                                className="w-full border-t border-gray-200 px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-100"
                              >
                                📕 Download as PDF
                              </button>
                            </div>
                          )}
                        </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteHistory(item.id)}
                        className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 dark:border-red-700 dark:bg-red-700 dark:text-red-100 dark:hover:bg-red-600"
                      >
                        Delete
                      </button>
                    </div>

                    </div>
                    ))}

                   {!history.some((item) => {
                  const search = historySearch.toLowerCase().trim();

                  return (
                    item.job_title.toLowerCase().includes(search) ||
                    item.company.toLowerCase().includes(search)
                  );
                  }) && (
                  <p className="py-6 text-center text-sm text-gray-500">
                    No cover letters found matching "{historySearch}".
                  </p>
                  )}
                </div>
              )}
            </div>
          )}

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
          <section
            id="cover-letter-preview"
            className="mt-8 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 p-6 dark:border-slate-800">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  {selectedHistoryLetter
                    ? `${selectedHistoryLetter.job_title} — ${selectedHistoryLetter.company}`
                    : "Your Generated Cover Letter"}
                </h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Review and customise it before sending.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                {selectedHistoryLetter && !isEditingHistoryLetter && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditedCoverLetter(coverLetter);
                        setIsEditingHistoryLetter(true);
                      }}
                      className="rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-600"
                    >
                      ✏️ Edit Letter
                    </button>
                  )}

                  {selectedHistoryLetter && isEditingHistoryLetter && (
                    <>
                      <button
                        type="button"
                        onClick={handleSaveHistoryChanges}
                        disabled={savingHistoryChanges || !hasUnsavedChanges}
                        className="rounded-xl bg-green-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-60"
                      >
                        {savingHistoryChanges ? "Saving..." : "Save Changes"}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setEditedCoverLetter(coverLetter);
                          setIsEditingHistoryLetter(false);
                        }}
                        disabled={savingHistoryChanges}
                        className="rounded-xl border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                      >
                        Cancel
                      </button>

                      {hasUnsavedChanges && (
                    <span className="rounded-full bg-amber-100 px-3 py-3 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                      Unsaved changes
                    </span>
                      )}
                    </>
                  )}

                  

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
                          if (selectedHistoryLetter) {
                            handleHistoryDownloadPDF(selectedHistoryLetter);
                          } else {
                            handleDownloadPDF();
                          }
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

                {isEditingHistoryLetter ? (
                  <textarea
                    value={editedCoverLetter}
                    onChange={(e) => setEditedCoverLetter(e.target.value)}
                    rows={22}
                    className="w-full min-h-137.5 resize-y border-0 bg-white font-serif text-[15px] leading-8 text-slate-800 outline-none"
                    placeholder="Edit your cover letter here..."
                  />
                ) : (
                  <p className="whitespace-pre-wrap wrap-break-words font-serif text-[15px] leading-8 text-slate-800">
                    {coverLetter}
                  </p>
                )}
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
