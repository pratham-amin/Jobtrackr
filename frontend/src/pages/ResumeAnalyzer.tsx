
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

type ResumeTemplate = "classic" | "modern" | "minimal";

interface ResumeSuggestion {
  section: string;
  original: string;
  improved: string;
  reason: string;
}

interface JobMatchResult {
  matchScore: number;
  matchingSkills: string[];
  missingSkills: string[];
  matchingExperience: string[];
  recommendations: string[];
  summary: string;
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
  const [selectedTemplate, setSelectedTemplate] =
  useState<ResumeTemplate>("classic");

  const [jobDescription, setJobDescription] = useState("");
  const [matching, setMatching] = useState(false);
  const [matchError, setMatchError] = useState("");
  const [matchResult, setMatchResult] = useState<JobMatchResult | null>(null);
  const [originalMatchResult, setOriginalMatchResult] =
  useState<JobMatchResult | null>(null);
  const [updatedMatchResult, setUpdatedMatchResult] =
  useState<JobMatchResult | null>(null);

  const handleFileChange = (
  event: React.ChangeEvent<HTMLInputElement>
) => {
  const file = event.target.files?.[0];

  setAnalysis(null);
  setError("");

  setJobDescription("");
  

  // Reset previous job matching results
  setMatchResult(null);
  setOriginalMatchResult(null);
  setUpdatedMatchResult(null);
  setMatchError("");

  // Reset previous optimisation results
  setSuggestions([]);
  setAcceptedSuggestions([]);
  setFinalResume("");

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



const handleJobMatch = async () => {
  if (!resume) {
    setMatchError("Please upload your resume first.");
    return;
  }

  if (!jobDescription.trim()) {
    setMatchError("Please paste a job description.");
    return;
  }

  setMatching(true);
  setMatchError("");

  try {
    const formData = new FormData();

    if (finalResume) {
      formData.append("resumeText", finalResume);
    } else {
      formData.append("resume", resume);
    }

    formData.append("jobDescription", jobDescription);

    const response = await fetch(
      "http://localhost:5000/ai/resume/match-job",
      {
        method: "POST",
        credentials: "include",
        body: formData,
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Job matching failed.");
    }

    // Preserve the original resume's match result
   // Store the original resume's match result
    if (!finalResume) {
      setOriginalMatchResult(data.result);
    } else {
      // Store the optimised resume's match result
      setUpdatedMatchResult(data.result);
    }

    // Update the latest match result
    setMatchResult(data.result);

  } catch (err) {
    setMatchError(
      err instanceof Error
        ? err.message
        : "Unable to match your resume. Please try again."
    );
  } finally {
    setMatching(false);
  }
};



  
const handleOptimize = async () => {
  if (!resume) {
    setError("Please upload your resume first.");
    return;
  }

  if (!jobDescription.trim()) {
    setError("Please enter a job description first.");
    return;
  }

  if (!matchResult) {
    setError("Please match your resume with the job description first.");
    return;
  }

  setOptimizing(true);
  setError("");
  setSuggestions([]);
  setAcceptedSuggestions([]);
  setFinalResume("");

  try {
    const formData = new FormData();
    formData.append("resume", resume);
    formData.append("jobDescription", jobDescription);
    formData.append("matchResult", JSON.stringify(matchResult));

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
  setAcceptedSuggestions((current) =>
    current.includes(index)
      ? current.filter((suggestionIndex) => suggestionIndex !== index)
      : [...current, index]
  );
  setFinalResume("");
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
    formData.append("jobDescription", jobDescription);
    formData.append("matchResult", JSON.stringify(matchResult));

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

  const paragraphs = finalResume.split(/\r?\n/);

  paragraphs.forEach((paragraph) => {
    const text = paragraph.trim();
    const displayText = text.replace(/^▹\s*/, "• ");

    if (!text) {
      y += 3;
      return;
    }

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);
    pdf.setTextColor(40, 40, 40);

    const wrappedLines = pdf.splitTextToSize(displayText, maxWidth);

    wrappedLines.forEach((line: string) => {
      if (y + lineHeight > pageHeight - margin) {
        pdf.addPage();
        y = margin;
      }

      pdf.text(line, margin, y);
      y += lineHeight;
    });

    y += 2;
  });

  pdf.save("JobTrackr-Resume.pdf");
};




const handleDownloadDOCX = async () => {
  if (!finalResume) return;

  const lines = finalResume.split(/\r?\n/);

  const headingPattern =
    /^(PROFESSIONAL SUMMARY|SUMMARY|TECHNICAL SKILLS|SKILLS|EXPERIENCE|WORK EXPERIENCE|PROJECTS|EDUCATION|CERTIFICATIONS|ACHIEVEMENTS)$/i;

  const firstLineIndex = lines.findIndex((line) => line.trim().length > 0);

  const paragraphs = lines.map((line, index) => {
    const text = line.trim();
    const isHeading = headingPattern.test(text);
    const isName = index === firstLineIndex && text.length > 0;

    const headingColor =
      selectedTemplate === "modern" ? "1E406E" : "000000";

    const nameColor =
      selectedTemplate === "modern" ? "1E406E" : "111111";

    return new Paragraph({
      alignment:
        isName && selectedTemplate === "classic"
          ? "center"
          : "left",

      children: [
        new TextRun({
          text: text || " ",
          font: "Arial",
          size: isName
            ? selectedTemplate === "minimal" ? 36 : 44
            : isHeading
            ? selectedTemplate === "minimal" ? 20 : 22
            : selectedTemplate === "minimal" ? 19 : 20,
          bold: isName || isHeading,
          color: isName
            ? nameColor
            : isHeading
            ? headingColor
            : "333333",
        }),
      ],

      spacing: {
        after: isName
          ? 240
          : isHeading
          ? selectedTemplate === "minimal" ? 160 : 180
          : selectedTemplate === "minimal" ? 140 : 100,
        before: isHeading
          ? selectedTemplate === "minimal" ? 200 : 120
          : 0,
      },

      border: isHeading && selectedTemplate === "modern"
        ? {
            bottom: {
              color: "B4C7E7",
              space: 4,
              style: "single",
              size: 4,
            },
          }
        : undefined,
    });
  });

  const margin =
    selectedTemplate === "minimal" ? 1100 : 900;

  const resumeDocument = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: margin,
              bottom: margin,
              left: 1000,
              right: 1000,
            },
          },
        },
        children: paragraphs,
      },
    ],
  });

  const blob = await Packer.toBlob(resumeDocument);

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `JobTrackr-${selectedTemplate}-Resume.docx`;

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
            
            <div className="mt-8 space-y-6">
                            
              <div className="mt-8 rounded-2xl border border-indigo-200 bg-white p-6 shadow-sm dark:border-indigo-500/30 dark:bg-gray-900">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Job Description Matching
                </h2>

                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  Compare your resume with a specific job description to understand how well you match the role.
                </p>

                <textarea
                  value={jobDescription}
                  onChange={(event) => {
                    setJobDescription(event.target.value);

                    // Reset job matching
                    setMatchResult(null);
                    setOriginalMatchResult(null);
                    setUpdatedMatchResult(null);
                    setMatchError("");

                    // Reset optimisation
                    setSuggestions([]);
                    setAcceptedSuggestions([]);
                    setFinalResume("");

                    
                  }}
                  placeholder="Paste the complete job description here..."
                  rows={8}
                  className="mt-5 w-full rounded-xl border border-gray-300 bg-white p-4 text-sm text-gray-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />

                {matchError && (
                  <p className="mt-3 text-sm text-red-600">
                    {matchError}
                  </p>
                )}

                <button
                  onClick={handleJobMatch}
                  disabled={matching}
                  className="mt-4 rounded-lg bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {matching ? "Matching..." : "Match My Resume"}
                </button>

                {matching && (
                  <p className="mt-3 text-sm text-indigo-600 dark:text-indigo-400">
                    AI is comparing your resume with the job requirements...
                  </p>
                )}

                {matchResult && (
                  <div className="mt-10 space-y-6">

                    {/* Match Score */}
                    <div className="rounded-2xl border border-indigo-100 bg-linear-to-br from-indigo-50 to-white p-6 shadow-sm dark:border-indigo-900 dark:from-indigo-950/50 dark:to-gray-900">
                      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                            Resume Match Score
                          </p>
                          <h2 className="mt-2 text-4xl font-bold text-gray-900 dark:text-white">
                            {matchResult.matchScore}
                            <span className="text-xl font-medium text-gray-500 dark:text-gray-400">
                              /100
                            </span>
                          </h2>
                          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                            How closely your resume aligns with this job description.
                          </p>
                        </div>

                        <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full border-8 border-indigo-200 bg-white dark:border-indigo-800 dark:bg-gray-900">
                          <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                            {matchResult.matchScore}%
                          </span>
                        </div>
                      </div>

                      <div className="mt-6 h-3 overflow-hidden rounded-full bg-indigo-100 dark:bg-gray-800">
                        <div
                          className="h-full rounded-full bg-indigo-600 transition-all duration-700"
                          style={{
                            width: `${Math.min(100, Math.max(0, matchResult.matchScore))}%`,
                          }}
                        />
                        </div>


                      <p className="mt-5 text-sm leading-6 text-gray-700 dark:text-gray-300">
                        {matchResult.summary}
                      </p>
                      </div>


                    {/* Skills */}
                    <div className="grid gap-5 md:grid-cols-2">
                      <div className="rounded-2xl border border-green-200 bg-white p-6 shadow-sm dark:border-green-900 dark:bg-gray-900">
                        <div className="flex items-center gap-2">
                          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400">
                            ✓
                          </span>
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            Matching Skills
                          </h3>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                          {matchResult.matchingSkills.length > 0 ? (
                            matchResult.matchingSkills.map((skill, index) => (
                              <span
                                key={index}
                                className="rounded-full bg-green-50 px-3 py-1.5 text-sm font-medium text-green-700 dark:bg-green-950/50 dark:text-green-300"
                              >
                                {skill}
                              </span>
                            ))
                          ) : (
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              No matching skills identified.
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="rounded-2xl border border-orange-200 bg-white p-6 shadow-sm dark:border-orange-900 dark:bg-gray-900">
                        <div className="flex items-center gap-2">
                          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400">
                            !
                          </span>
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            Missing Skills
                          </h3>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                          {matchResult.missingSkills.length > 0 ? (
                            matchResult.missingSkills.map((skill, index) => (
                              <span
                                key={index}
                                className="rounded-full bg-orange-50 px-3 py-1.5 text-sm font-medium text-orange-700 dark:bg-orange-950/50 dark:text-orange-300"
                              >
                                {skill}
                              </span>
                            ))
                          ) : (
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              No missing skills identified.
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Relevant Experience */}
                    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                          <span className="text-lg">▤</span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            Relevant Experience
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Experience from your resume that relates to the role
                          </p>
                        </div>
                      </div>

                      <ul className="mt-5 space-y-3">
                        {matchResult.matchingExperience.length > 0 ? (
                          matchResult.matchingExperience.map((item, index) => (
                            <li key={index} className="flex gap-3 text-sm leading-6 text-gray-700 dark:text-gray-300">
                              <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
                              {item}
                            </li>
                          ))
                        ) : (
                          <li className="text-sm text-gray-500 dark:text-gray-400">
                            No relevant experience identified.
                          </li>
                        )}
                      </ul>
                    </div>

                    {/* AI Recommendations */}
                    <div className="rounded-2xl border border-purple-200 bg-white p-6 shadow-sm dark:border-purple-900 dark:bg-gray-900">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                          ✦
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            AI Recommendations
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Suggestions to improve your resume for this role
                          </p>
                        </div>
                      </div>

                      <ul className="mt-5 space-y-3">
                        {matchResult.recommendations.length > 0 ? (
                          matchResult.recommendations.map((item, index) => (
                            <li key={index} className="flex gap-3 rounded-xl bg-purple-50 p-4 text-sm leading-6 text-gray-700 dark:bg-purple-950/30 dark:text-gray-300">
                              <span className="font-bold text-purple-600 dark:text-purple-400">
                                {index + 1}.
                              </span>
                              {item}
                            </li>
                          ))
                        ) : (
                          <li className="text-sm text-gray-500 dark:text-gray-400">
                            No recommendations available.
                          </li>
                        )}
                      </ul>
                    </div>

                  </div>
                )}

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
                  AI is preparing improvements for your resume...
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

                      <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                          Your Improved Resume
                        </h2>
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                          Your resume has been generated using the suggestions you accepted.
                        </p>
                      </div>

                      {/* Resume Preview */}
                      <div
                        className={`mt-6 max-h-750px overflow-y-auto rounded-xl border p-6 ${
                          selectedTemplate === "modern"
                            ? "border-blue-200 bg-blue-50"
                            : selectedTemplate === "minimal"
                            ? "border-gray-100 bg-white"
                            : "border-gray-300 bg-gray-50"
                        }`}
                        >
                        <div
                          className={`mx-auto min-h-900px max-w-650px bg-white text-gray-800 shadow-sm ${
                            selectedTemplate === "minimal" ? "px-10 py-12" : "px-10 py-8"
                          }`}
                        >
                          {finalResume.split(/\r?\n/).map((line, index) => {
                            const trimmedLine = line.trim();
                            console.log("Resume line:", trimmedLine);

                            const isName = index === 0 && trimmedLine.length > 0;

                            const isContactLine =
                              index === 1 || index === 2;

                            const isHeading =
                            /^(PROFESSIONAL SUMMARY|SUMMARY|CAREER OBJECTIVE|OBJECTIVE|TECHNICAL SKILLS|SKILLS|CORE SKILLS|EXPERIENCE|WORK EXPERIENCE|PROFESSIONAL EXPERIENCE|INTERNSHIP EXPERIENCE|PROJECTS|PERSONAL PROJECTS|EDUCATION|ACADEMIC QUALIFICATIONS|CERTIFICATIONS|ACHIEVEMENTS|AWARDS|LANGUAGES|INTERESTS|VOLUNTEER EXPERIENCE|PUBLICATIONS|REFERENCES)$/i.test(
                              trimmedLine.replace(/[:\-]+$/, "").trim()
                            );

                            if (!trimmedLine) {
                              return <div key={index} className="h-3" />;
                            }

                            return (
                            
                                  <p
                                    key={index}
                                    className={
                                      isName
                                        ? `mb-3 text-2xl font-bold ${
                                            selectedTemplate === "modern"
                                              ? "text-blue-900"
                                              : "text-gray-950"
                                          } ${
                                            selectedTemplate === "classic"
                                              ? "text-center"
                                              : selectedTemplate === "modern"
                                              ? "border-b-2 border-blue-800 pb-3"
                                              : "text-left"
                                          }`
                                        : isContactLine
                                        ? `mb-2 text-xs leading-5 text-gray-600 ${
                                            selectedTemplate === "classic"
                                              ? "text-center"
                                              : "text-center"
                                          }`
                                        : isHeading
                                        ? `mb-3 mt-6 border-b pb-2 text-sm font-bold uppercase tracking-wider ${
                                            selectedTemplate === "modern"
                                              ? "border-blue-200 text-blue-800"
                                              : selectedTemplate === "minimal"
                                              ? "border-gray-200 text-gray-700"
                                              : "border-gray-400 text-black"
                                          }`
                                        : `mb-2 text-sm leading-6 ${
                                            selectedTemplate === "minimal"
                                              ? "text-gray-700"
                                              : "text-gray-800"
                                          }`
                                    }
                                  >
                                    {trimmedLine}
                                  </p>
                                
                            );
                          })}
                        </div>
                      </div>

                      {/* Recheck generated resume against the JD */}
                      <div className="mt-10 border-t border-gray-200 pt-6 dark:border-gray-700">
                        <button
                          onClick={handleJobMatch}
                          disabled={matching || !jobDescription.trim()}
                          className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                        {matching
                        ? "Analysing Improved Resume..."
                        : "Recheck Job Match"}
                        </button>

                        <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                          {matching
                            ? "AI is analysing your improved resume against the job description. Please wait..."
                            : "Check how your newly generated resume matches the same job description."}
                        </p>
                      </div>

                          {!updatedMatchResult && (
                          <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950/30">
                            <p className="text-sm font-semibold text-blue-800 dark:text-blue-300">
                              Your improved resume is ready!
                            </p>

                            <p className="mt-1 text-sm text-blue-700 dark:text-blue-400">
                              Recheck your job match to compare your original and optimised resume scores.
                            </p>
                          </div>
                        )}
                                             
                        {/* Resume Match Score Comparison */}
                        {originalMatchResult && updatedMatchResult && (
                          <div className="mt-8 rounded-2xl border border-indigo-200 bg-indigo-50/50 p-6 dark:border-indigo-800 dark:bg-indigo-950/20">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                              Resume Match Score Comparison
                            </h3>

                            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                              See how your optimised resume performs against the original.
                            </p>

                            <div className="mt-5 grid gap-4 sm:grid-cols-2">
                              <div className="rounded-xl bg-white p-5 dark:bg-gray-900">
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  Original Resume
                                </p>
                                <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                                  {originalMatchResult.matchScore}/100
                                </p>
                              </div>

                              <div className="rounded-xl bg-white p-5 dark:bg-gray-900">
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  Optimised Resume
                                </p>
                                <p className="mt-2 text-3xl font-bold text-indigo-600 dark:text-indigo-400">
                                  {updatedMatchResult.matchScore}/100
                                </p>
                              </div>
                            </div>

                            <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-indigo-200 pt-4 dark:border-indigo-800">
                              <span className="font-semibold text-gray-700 dark:text-gray-300">
                                Overall Score Improvement
                              </span>

                              <span
                                className={`text-xl font-bold ${
                                  updatedMatchResult.matchScore >= originalMatchResult.matchScore
                                    ? "text-green-600 dark:text-green-400"
                                    : "text-red-600 dark:text-red-400"
                                }`}
                              >
                                {updatedMatchResult.matchScore > originalMatchResult.matchScore
                                  ? "+"
                                  : ""}
                                {updatedMatchResult.matchScore - originalMatchResult.matchScore} points
                              </span>
                            </div>
                          </div>
                        )}

                      {/* Template Selector */}
                      <div className="mt-8 ">
                        <h3 className="mb-4 text-lg font-bold text-gray-900 dark:text-white">
                          Choose Your Resume Template
                        </h3>

                        <div className="grid gap-4 sm:grid-cols-3">
                          {[
                            {
                              id: "classic",
                              name: "Classic ATS",
                              description: "Traditional professional layout",
                            },
                            {
                              id: "modern",
                              name: "Modern ATS",
                              description: "Subtle navy headings",
                            },
                            {
                              id: "minimal",
                              name: "Minimal ATS",
                              description: "Clean and spacious layout",
                            },
                          ].map((template) => (
                            <button
                              key={template.id}
                              type="button"
                              onClick={() =>
                                setSelectedTemplate(template.id as ResumeTemplate)
                              }
                              className={`rounded-xl border p-4 text-left transition  ${
                                selectedTemplate === template.id
                                  ? "border-blue-600 bg-blue-50 ring-2 ring-blue-200 dark:bg-blue-950/30"
                                  : "border-gray-200 hover:border-blue-400 dark:border-gray-700"
                              }`}
                            >
                                                            <div
                                className={`mx-auto mb-4 h-32 w-24 rounded-md border bg-white p-2 shadow-sm ${
                                  template.id === "modern"
                                    ? "border-blue-300"
                                    : "border-gray-300"
                                }`}
                              >
                                {/* Name preview */}
                                <div
                                  className={`mb-2 h-2 w-12 rounded ${
                                    template.id === "modern"
                                      ? "mx-auto bg-blue-800"
                                      : template.id === "classic"
                                      ? "mx-auto bg-gray-800"
                                      : "bg-gray-800"
                                  }`}
                                />

                                {/* Contact details */}
                                <div className="mx-auto mb-3 h-1 w-16 rounded bg-gray-300" />

                                {/* Section headings and content */}
                                {[1, 2, 3].map((item) => (
                                  <div key={item} className="mb-2">
                                    <div
                                      className={`mb-1 h-1 w-10 rounded ${
                                        template.id === "modern"
                                          ? "bg-blue-700"
                                          : "bg-gray-700"
                                      }`}
                                    />
                                    <div className="mb-1 h-1 w-full rounded bg-gray-200" />
                                    <div className="h-1 w-4/5 rounded bg-gray-200" />
                                  </div>
                                ))}
                              </div>

                              <div className="flex items-center justify-between ">
                                <span className="font-semibold text-gray-900 dark:text-white">
                                  {template.name}
                                </span>

                                {selectedTemplate === template.id && (
                                  <span className="text-sm font-bold text-blue-600">
                                    Selected ✓
                                  </span>
                                )}
                              </div>

                              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                                {template.description}
                              </p>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Download Buttons */}
                      <div className="mt-6 flex flex-wrap gap-4">
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
