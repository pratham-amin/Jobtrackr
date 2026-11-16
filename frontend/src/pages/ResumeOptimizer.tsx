
import { useState } from "react";

interface ResumeSuggestion {
  section: string;
  original: string;
  improved: string;
  reason: string;
}

function ResumeOptimizer() {
  const [resume, setResume] = useState<File | null>(null);
  const [suggestions, setSuggestions] = useState<ResumeSuggestion[]>([]);
  const [acceptedSuggestions, setAcceptedSuggestions] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (file) {
      setResume(file);
      setSuggestions([]);
      setAcceptedSuggestions([]);
      setError("");
    }
  };

  const handleOptimize = async () => {
    if (!resume) {
      setError("Please select your resume first.");
      return;
    }

    setLoading(true);
    setError("");
    setSuggestions([]);
    setAcceptedSuggestions([]);

    try {
      const formData = new FormData();
      formData.append("resume", resume);

      const response = await fetch(
        "http://localhost:5000/ai/resume/optimize",
        {
          method: "POST",
          credentials: "include",
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Resume optimization failed.");
      }

      setSuggestions(data.suggestions);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const toggleSuggestion = (index: number) => {
    setAcceptedSuggestions((previous) =>
      previous.includes(index)
        ? previous.filter((item) => item !== index)
        : [...previous, index]
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10 dark:bg-gray-950">
      <div className="mx-auto max-w-5xl">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            AI Career Toolkit
          </p>

          <h1 className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
            AI Resume Optimizer
          </h1>

          <p className="mt-3 text-gray-600 dark:text-gray-400">
            Improve your resume with AI-powered suggestions.
            Review each change and decide which improvements
            you want to accept.
          </p>
        </div>

        <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="text-center">
            <div className="text-4xl">✨</div>

            <h2 className="mt-4 text-xl font-semibold text-gray-900 dark:text-white">
              Upload your existing resume
            </h2>

            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Supported formats: PDF and DOCX (maximum 5 MB)
            </p>

            <input
              type="file"
              accept=".pdf,.docx"
              onChange={handleFileChange}
              disabled={loading}
              className="mt-6 block w-full text-sm text-gray-600 file:mr-4 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-4 file:py-2 file:font-semibold file:text-indigo-700 hover:file:bg-indigo-100 dark:text-gray-300 dark:file:bg-gray-800 dark:file:text-indigo-300"
            />

            {resume && (
              <p className="mt-4 text-sm font-medium text-green-600">
                Selected: {resume.name}
              </p>
            )}

            <button
              onClick={handleOptimize}
              disabled={!resume || loading}
              className="mt-6 w-full rounded-lg bg-indigo-600 px-6 py-3 font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Generating suggestions..." : "Improve My Resume"}
            </button>

            {loading && (
              <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                Gemini is reviewing your resume and preparing improvements.
              </p>
            )}

            {error && (
              <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950 dark:text-red-300">
                {error}
              </p>
            )}
          </div>
        </div>

        {suggestions.length > 0 && (
          <div className="mt-10">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Suggested Improvements
                </h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Review each suggestion and select the changes you approve.
                </p>
              </div>

              <span className="rounded-full bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                {acceptedSuggestions.length} of {suggestions.length} accepted
              </span>
            </div>

            <div className="mt-6 space-y-6">
              {suggestions.map((suggestion, index) => {
                const accepted = acceptedSuggestions.includes(index);

                return (
                  <div
                    key={index}
                    className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {suggestion.section}
                      </h3>

                      <button
                        onClick={() => toggleSuggestion(index)}
                        className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                          accepted
                            ? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300"
                            : "bg-indigo-600 text-white hover:bg-indigo-700"
                        }`}
                      >
                        {accepted ? "✓ Accepted" : "Accept suggestion"}
                      </button>
                    </div>

                    <div className="mt-5 grid gap-4 md:grid-cols-2">
                      <div className="rounded-xl bg-gray-50 p-4 dark:bg-gray-800">
                        <p className="text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                          Original content
                        </p>
                        <p className="mt-3 whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300">
                          {suggestion.original}
                        </p>
                      </div>

                      <div className="rounded-xl bg-indigo-50 p-4 dark:bg-indigo-950/40">
                        <p className="text-xs font-bold uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
                          AI improved version
                        </p>
                        <p className="mt-3 whitespace-pre-wrap text-sm text-gray-800 dark:text-gray-200">
                          {suggestion.improved}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 rounded-lg border border-gray-100 p-4 dark:border-gray-800">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        Why this improvement?
                      </p>
                      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        {suggestion.reason}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ResumeOptimizer;
