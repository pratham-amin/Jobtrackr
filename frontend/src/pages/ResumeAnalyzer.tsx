
import { useState } from "react";
import { Link } from "react-router-dom";
import { jsPDF } from "jspdf";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
} from "docx";

interface ResumeAnalysis {
  overallScore: number;
  summary: string;
  strengths: string[];
  improvements: string[];
  skillsFound: string[];
  sectionFeedback: {
    section: string;
    score: number;
    feedback: string;
  }[];
}

interface ResumeSuggestion {
  section: string;
  original: string;
  improved: string;
  reason: string;
}

function ResumeAnalyzer() {
  const [resume, setResume] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null);

  const [suggestions, setSuggestions] = useState<ResumeSuggestion[]>([]);
  const [acceptedSuggestions, setAcceptedSuggestions] = useState<number[]>([]);
  const [optimizing, setOptimizing] = useState(false);
  const [finalResume, setFinalResume] = useState("");
  const [generatingFinal, setGeneratingFinal] = useState(false);

  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    setAnalysis(null);
    setError("");

    if (file) {
      setResume(file);
    }
  };

  const handleAnalyze = async () => {
    if (!resume) {
      setError("Please select a resume first.");
      return;
    }

    setLoading(true);
    setError("");
    setAnalysis(null);

    try {
      const formData = new FormData();
      formData.append("resume", resume);

      const response = await fetch(
        "http://localhost:5000/ai/resume/analyze",
        {
          method: "POST",
          credentials: "include",
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Resume analysis failed.");
      }

      setAnalysis(data.analysis);
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

  const handleOptimize = async () => {
  if (!resume) {
    setError("Please upload your resume first.");
    return;
  }

  setOptimizing(true);
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
      throw new Error(data.error || "Unable to optimise resume.");
    }

    setSuggestions(data.suggestions);
  } catch (err) {
    setError(
      err instanceof Error
        ? err.message
        : "Something went wrong. Please try again."
    );
  } finally {
    setOptimizing(false);
  }
};

const toggleSuggestion = (index: number) => {
  setAcceptedSuggestions((previous) =>
    previous.includes(index)
      ? previous.filter((item) => item !== index)
      : [...previous, index]
  );
};


const handleGenerateFinalResume = async () => {
  if (!resume) {
    setError("Please upload your original resume.");
    return;
  }

  const approvedSuggestions = suggestions.filter(
    (_, index) => acceptedSuggestions.includes(index)
  );

  if (approvedSuggestions.length === 0) {
    setError("Please accept at least one suggestion.");
    return;
  }

  try {
    setGeneratingFinal(true);
    setError("");

    const formData = new FormData();
    formData.append("resume", resume);
    formData.append(
      "acceptedSuggestions",
      JSON.stringify(approvedSuggestions)
    );

    const response = await fetch(
      "http://localhost:5000/ai/resume/finalize",
      {
        method: "POST",
        credentials: "include",
        body: formData,
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error || "Unable to generate your improved resume."
      );
    }

    setFinalResume(data.finalResume);
  } catch (err) {
    setError(
      err instanceof Error
        ? err.message
        : "Something went wrong."
    );
  } finally {
    setGeneratingFinal(false);
  }
};

const handleDownloadResume = () => {
  if (!finalResume) return;

  const blob = new Blob([finalResume], {
    type: "text/plain;charset=utf-8",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "JobTrackr-Improved-Resume.txt";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
};



const handleDownloadPDF = () => {
  if (!finalResume) return;

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  const margin = 20;
  const maxWidth = pageWidth - margin * 2;
  const lineHeight = 6;

  let y = margin;

  // Clean unsupported characters and formatting
  const cleanResume = finalResume
    .normalize("NFKC")
    .replace(/\u0000/g, "")
    .replace(/\u00A0/g, " ")
    .replace(/[•●▪◦]/g, "-")
    .replace(/[–—]/g, "-")
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, "");

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  pdf.setTextColor(40, 40, 40);

  const paragraphs = cleanResume.split(/\r?\n/);

  paragraphs.forEach((paragraph) => {
    if (!paragraph.trim()) {
      y += 3;
      return;
    }

    const lines = pdf.splitTextToSize(paragraph, maxWidth);

    lines.forEach((line: string) => {
      if (y + lineHeight > pageHeight - margin) {
        pdf.addPage();
        y = margin;
      }

      pdf.text(line, margin, y);
      y += lineHeight;
    });

    y += 2;
  });

  pdf.save("JobTrackr-Improved-Resume.pdf");
};


const handleDownloadDOCX = async () => {
  if (!finalResume) return;

  const paragraphs = finalResume.split(/\r?\n/).map((line) => {
    return new Paragraph({
      children: [
        new TextRun({
          text: line || " ",
          font: "Arial",
          size: 22,
        }),
      ],
      spacing: {
        after: 120,
      },
    });
  });

  const resumeDocument = new Document({
  sections: [
    {
      children: paragraphs,
    },
  ],
});

const blob = await Packer.toBlob(resumeDocument);

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "JobTrackr-Improved-Resume.docx";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
};


  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10 dark:bg-gray-950">
      <div className="mx-auto max-w-4xl">
        <Link
          to="/ai-assistant"
          className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          ← Back to AI Assistant
        </Link>

        <div className="mt-8">
          <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            AI Career Toolkit
          </p>

          <h1 className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
            AI Resume Analyzer
          </h1>

          <p className="mt-3 text-gray-600 dark:text-gray-400">
            Upload your resume to identify skill gaps, evaluate its
            structure and discover opportunities to improve it.
          </p>
        </div>

        <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="text-center">
            <div className="text-4xl">📄</div>

            <h2 className="mt-4 text-xl font-semibold text-gray-900 dark:text-white">
              Upload your resume
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
              onClick={handleAnalyze}
              disabled={!resume || loading}
              className="mt-6 w-full rounded-lg bg-indigo-600 px-6 py-3 font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Analysing your resume..." : "Analyse Resume"}
            </button>

            {loading && (
              <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                AI is reviewing your resume. Please wait...
              </p>
            )}

            {error && (
              <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950 dark:text-red-300">
                {error}
              </p>
            )}
          </div>
        </div>

        {analysis && (
          <div className="mt-8 space-y-6">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Resume Analysis Results
              </h2>

              <p className="mt-4 text-4xl font-bold text-indigo-600">
                {analysis.overallScore}/100
              </p>

              <p className="mt-4 text-gray-600 dark:text-gray-300">
                {analysis.summary}
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
                <h3 className="text-lg font-semibold text-green-600">
                  Strengths
                </h3>
                <ul className="mt-4 list-disc space-y-2 pl-5 text-gray-600 dark:text-gray-300">
                  {analysis.strengths.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
                <h3 className="text-lg font-semibold text-orange-600">
                  Areas to Improve
                </h3>
                <ul className="mt-4 list-disc space-y-2 pl-5 text-gray-600 dark:text-gray-300">
                  {analysis.improvements.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Skills Identified
              </h3>
              <div className="mt-4 flex flex-wrap gap-2">
                {analysis.skillsFound.map((skill, index) => (
                  <span
                    key={index}
                    className="rounded-full bg-indigo-50 px-3 py-2 text-sm font-medium text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Section-by-Section Feedback
              </h3>

              <div className="mt-4 space-y-4">
                {analysis.sectionFeedback.map((section, index) => (
                  <div
                    key={index}
                    className="border-b border-gray-100 pb-4 last:border-0 dark:border-gray-800"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        {section.section}
                      </h4>
                      <span className="font-semibold text-indigo-600">
                        {section.score}/100
                      </span>
                    </div>

                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                      {section.feedback}
                    </p>
                  </div>
                ))}
              </div>
            </div>


            {/* Resume Optimization */}
            <div className="rounded-2xl border border-indigo-200 bg-white p-6 shadow-sm dark:border-indigo-500/30 dark:bg-gray-900">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    Improve Your Resume with AI
                  </h2>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    Generate improvements based on your analysis and choose which
                    suggestions to accept.
                  </p>
                </div>

                <button
                  onClick={handleOptimize}
                  disabled={optimizing}
                  className="rounded-lg bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {optimizing ? "Generating..." : "✨ Improve My Resume"}
                </button>
              </div>

              {optimizing && (
                <p className="mt-4 text-sm text-indigo-600 dark:text-indigo-400">
                  Gemini is preparing improvements for your resume...
                </p>
              )}

              {suggestions.length > 0 && (
                <div className="mt-8 space-y-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                      Suggested Improvements
                    </h3>

                    <span className="rounded-full bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                      {acceptedSuggestions.length} / {suggestions.length} accepted
                    </span>
                  </div>

                  {suggestions.map((suggestion, index) => {
                    const accepted = acceptedSuggestions.includes(index);

                    return (
                      <div
                        key={index}
                        className="rounded-xl border border-gray-200 p-5 dark:border-gray-800"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <h4 className="font-semibold text-gray-900 dark:text-white">
                            {suggestion.section}
                          </h4>

                          <button
                            onClick={() => toggleSuggestion(index)}
                            className={`rounded-lg px-4 py-2 text-sm font-semibold ${
                              accepted
                                ? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300"
                                : "bg-indigo-600 text-white hover:bg-indigo-700"
                            }`}
                          >
                            {accepted ? "✓ Accepted" : "Accept suggestion"}
                          </button>
                        </div>

                        <div className="mt-4 grid gap-4 md:grid-cols-2">
                          <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
                            <p className="text-xs font-bold uppercase text-gray-500">
                              Original
                            </p>
                            <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300">
                              {suggestion.original}
                            </p>
                          </div>

                          <div className="rounded-lg bg-indigo-50 p-4 dark:bg-indigo-950/40">
                            <p className="text-xs font-bold uppercase text-indigo-600 dark:text-indigo-400">
                              Improved
                            </p>
                            <p className="mt-2 whitespace-pre-wrap text-sm text-gray-800 dark:text-gray-200">
                              {suggestion.improved}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            Why this change?
                          </p>
                          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                            {suggestion.reason}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <div className="border-t border-gray-200 pt-6 dark:border-gray-800">
                    <button
                      onClick={handleGenerateFinalResume}
                      disabled={
                        generatingFinal ||
                        acceptedSuggestions.length === 0
                      }
                      className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {generatingFinal
                        ? "Generating Your Resume..."
                        : "Generate Final Resume"}
                    </button>
                  </div>
                  {finalResume && (
                    <div className="mt-8 rounded-2xl border border-green-200 bg-white p-6 shadow-sm dark:border-green-500/30 dark:bg-gray-900">
                      <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                            Your Improved Resume
                          </h2>
                          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                            Your resume has been generated using the suggestions you accepted.
                          </p>
                          
                        </div>
                      </div>

                      <div className="mt-6 max-h-175 overflow-y-auto rounded-xl border border-gray-200 bg-gray-50 p-6 dark:border-gray-800 dark:bg-gray-800">
                        <pre className="whitespace-pre-wrap font-sans text-sm leading-7 text-gray-800 dark:text-gray-200">
                          {finalResume}
                        </pre>
                      </div>

                      <div className="flex flex-wrap gap-3 mt-4">
                        <button
                          onClick={handleDownloadResume}
                          className="rounded-lg bg-gray-700 px-5 py-3 text-sm font-semibold text-white hover:bg-gray-800"
                        >
                          Download TXT
                        </button>

                        <button
                          onClick={handleDownloadPDF}
                          className="rounded-lg bg-red-600 px-5 py-3 text-sm font-semibold text-white hover:bg-red-700"
                        >
                          Download PDF
                        </button>

                        <button
                          onClick={handleDownloadDOCX}
                          className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
                        >
                          Download Word
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>
        )}
      </div>
    </div>
  );
}

export default ResumeAnalyzer;
