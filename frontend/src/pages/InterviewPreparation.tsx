import React, { useState } from "react";
import { Link } from "react-router-dom";

interface InterviewQuestion {
  question: string;
  category: string;
  difficulty: string;
  suggestedAnswer: string;
  explanation: string;
}

interface InterviewPreparationResult {
  jobRole: string;
  interviewType: string;
  questions: InterviewQuestion[];
  preparationTips: string[];
}

interface InterviewAnswerFeedback {
  relevanceScore: number;
  clarityScore: number;
  accuracyScore: number;
  overallScore: number;
  strengths: string[];
  improvements: string[];
  feedback: string;
}

interface MockInterviewFeedback {
  question: string;
  answer: string;
  feedback: InterviewAnswerFeedback;
}

const InterviewPreparation: React.FC = () => {
  const [jobRole, setJobRole] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [interviewType, setInterviewType] = useState("Mixed");

  const [mockStarted, setMockStarted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [mockAnswer, setMockAnswer] = useState("");
  const [mockFeedback, setMockFeedback] = useState<MockInterviewFeedback[]>([]);
  const [evaluatingAnswer, setEvaluatingAnswer] = useState(false);
  const [mockError, setMockError] = useState("");
  const [mockCompleted, setMockCompleted] = useState(false);

  const [result, setResult] =
  useState<InterviewPreparationResult | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event: React.FormEvent) => {
  event.preventDefault();

  setLoading(true);
  setError("");
  setResult(null);

  try {
    const response = await fetch(
      "http://localhost:5000/interview/generate",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jobRole,
          jobDescription,
          interviewType,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || "Failed to generate interview questions."
      );
    }

    setResult(data.result as InterviewPreparationResult);
  } catch (error) {
    setError(
      error instanceof Error
        ? error.message
        : "Something went wrong. Please try again."
    );
  } finally {
    setLoading(false);
  }
};

const handleStartMockInterview = () => {
  console.log("Start Mock Interview clicked");
  console.log("Result:", result);

  if (!result || result.questions.length === 0) {
    console.error("No interview questions available.");
    return;
  }

  setMockStarted(true);
  setCurrentQuestionIndex(0);
  setMockAnswer("");
  setMockFeedback([]);
  setMockError("");
  setMockCompleted(false);

  console.log("Mock interview started");
};

const handleSubmitMockAnswer = async () => {
  if (!result || !mockAnswer.trim()) {
    setMockError("Please enter your answer before submitting.");
    return;
  }

  const currentQuestion = result.questions[currentQuestionIndex];

  setEvaluatingAnswer(true);
  setMockError("");

  try {
    const response = await fetch(
      "http://localhost:5000/mock-interview/evaluate",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: currentQuestion.question,
          answer: mockAnswer.trim(),
          jobRole: result.jobRole,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to evaluate your answer.");
    }

    setMockFeedback((previous) => [
      ...previous,
      {
        question: currentQuestion.question,
        answer: mockAnswer.trim(),
        feedback: data.feedback as InterviewAnswerFeedback,
      },
    ]);
  } catch (error) {
    setMockError(
      error instanceof Error
        ? error.message
        : "Something went wrong while evaluating your answer."
    );
  } finally {
    setEvaluatingAnswer(false);
  }
};

const handleNextMockQuestion = () => {
  if (!result) return;

  setMockAnswer("");
  setMockError("");

  if (currentQuestionIndex < result.questions.length - 1) {
    setCurrentQuestionIndex((previous) => previous + 1);
  } else {
    setMockStarted(false);
    setMockCompleted(true);
  }
};

const handleFinishMockInterview = () => {
  if (mockFeedback.length === 0) {
    setMockError("Please answer at least one question before finishing.");
    return;
  }

  setMockStarted(false);
  setMockCompleted(true);
  setMockError("");
};

const averageScore = mockFeedback.length
  ? Math.round(
      mockFeedback.reduce(
        (total, item) => total + item.feedback.overallScore,
        0
      ) / mockFeedback.length
    )
  : 0;

const averageRelevance = mockFeedback.length
  ? Math.round(
      mockFeedback.reduce(
        (total, item) => total + item.feedback.relevanceScore,
        0
      ) / mockFeedback.length
    )
  : 0;

const averageClarity = mockFeedback.length
  ? Math.round(
      mockFeedback.reduce(
        (total, item) => total + item.feedback.clarityScore,
        0
      ) / mockFeedback.length
    )
  : 0;

const averageAccuracy = mockFeedback.length
  ? Math.round(
      mockFeedback.reduce(
        (total, item) => total + item.feedback.accuracyScore,
        0
      ) / mockFeedback.length
    )
  : 0;

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-10 dark:bg-gray-950">
      <div className="mx-auto max-w-4xl">

        <div className="mb-8">
          <Link
                    to="/ai-assistant"
                    className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 mb-4"
                  >
                    ← Back to AI Assistant
          </Link>

          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mt-5">
            AI Interview Preparation
          </h1>

          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Prepare confidently with personalised interview questions
            tailored to your target job.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-2xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-gray-900"
          >
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Tell us about your interview
            </h2>

            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Enter the job details to generate relevant interview questions.
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">
              Target Job Role
            </label>

            <input
              type="text"
              value={jobRole}
              onChange={(e) => setJobRole(e.target.value)}
              placeholder="e.g. Full-Stack Developer"
              required
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">
              Job Description
            </label>

            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the job description here..."
              rows={6}
              required
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">
              Interview Type
            </label>

            <select
              value={interviewType}
              onChange={(e) => setInterviewType(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            >
              <option value="Technical">Technical</option>
              <option value="Behavioural">Behavioural</option>
              <option value="Mixed">Mixed</option>
            </select>
          </div>

          {error && (
          <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </p>
          )}

          <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-indigo-600 px-6 py-3 font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
          {loading
            ? "Generating Interview Questions..."
            : "Generate Interview Questions"}
          </button>
        </form>

        {result && (
        <div className="mt-10 space-y-8">

          {/* Results Header */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Your Interview Questions
            </h2>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Personalised preparation for {result.jobRole}
            </p>
          </div>

          {/* Interview Questions */}
          <div className="space-y-5">
            {result.questions.map((item, index) => (
              <div
                key={index}
                className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                    Question {index + 1}
                  </span>

                  <div className="flex gap-2">
                    <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                      {item.category}
                    </span>

                    <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
                      {item.difficulty}
                    </span>
                  </div>
                </div>

                <h3 className="mt-4 text-lg font-bold text-gray-900 dark:text-white">
                  {item.question}
                </h3>

                <div className="mt-5">
                  <h4 className="font-semibold text-gray-800 dark:text-gray-200">
                    Suggested Answer
                  </h4>

                  <p className="mt-2 whitespace-pre-line text-sm leading-7 text-gray-600 dark:text-gray-400">
                    {item.suggestedAnswer}
                  </p>
                </div>

                <div className="mt-5 rounded-lg bg-indigo-50 p-4 dark:bg-indigo-900/20">
                  <h4 className="font-semibold text-indigo-800 dark:text-indigo-300">
                    What the interviewer evaluates
                  </h4>

                  <p className="mt-2 text-sm leading-6 text-indigo-700 dark:text-indigo-200">
                    {item.explanation}
                  </p>
                </div>
              </div>
            ))}
          </div>

            {!mockStarted && (
            <div className="flex justify-center">
              <button
                onClick={handleStartMockInterview}
                className="rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white transition hover:bg-indigo-700"
              >
                🎯 Start Mock Interview
              </button>
            </div>
          )}

          {mockStarted && result && (
            <div className="rounded-2xl border border-indigo-200 bg-white p-6 shadow-sm dark:border-indigo-900 dark:bg-gray-900">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                🎯 Mock Interview
              </h2>

              <p className="mt-2 text-sm text-gray-500">
                Question {currentQuestionIndex + 1} of {result.questions.length}
              </p>

              <h3 className="mt-5 text-lg font-semibold text-gray-900 dark:text-white">
                {result.questions[currentQuestionIndex].question}
              </h3>

              <textarea
                value={mockAnswer}
                onChange={(e) => setMockAnswer(e.target.value)}
                placeholder="Type your answer here..."
                rows={6}
                disabled={evaluatingAnswer}
                className="mt-4 w-full rounded-xl border border-gray-300 bg-white p-4 text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />

              {mockError && (
                <p className="mt-3 text-sm text-red-600">{mockError}</p>
              )}

              <button
                onClick={handleSubmitMockAnswer}
                disabled={evaluatingAnswer || !mockAnswer.trim()}
                className="mt-4 rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white disabled:opacity-50"
              >
                {evaluatingAnswer ? "Evaluating..." : "Submit Answer"}
              </button>

              <button
                onClick={handleFinishMockInterview}
                disabled={evaluatingAnswer}
                className="mt-4 ml-3 rounded-xl border border-red-300 bg-red-100 px-6 py-3 font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50 dark:border-red-900 dark:bg-red-600 dark:text-white  dark:hover:bg-red-800"
              >
                End Interview
              </button>

              {mockFeedback[currentQuestionIndex] && (
              <div className="mt-8 space-y-6 border-t border-gray-200 pt-6 dark:border-gray-700">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  AI Interview Feedback
                </h3>

                {/* Score Cards */}
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  {[
                    {
                      label: "Relevance",
                      score: mockFeedback[currentQuestionIndex].feedback.relevanceScore,
                    },
                    {
                      label: "Clarity",
                      score: mockFeedback[currentQuestionIndex].feedback.clarityScore,
                    },
                    {
                      label: "Accuracy",
                      score: mockFeedback[currentQuestionIndex].feedback.accuracyScore,
                    },
                    {
                      label: "Overall",
                      score: mockFeedback[currentQuestionIndex].feedback.overallScore,
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800"
                    >
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        {item.label}
                      </p>

                      <p className="mt-2 text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                        {item.score}/100
                      </p>
                    </div>
                  ))}
                </div>

                {/* Strengths */}
                <div className="rounded-xl border border-green-200 bg-green-50 p-5 dark:border-green-900 dark:bg-green-950/30">
                  <h4 className="font-semibold text-green-800 dark:text-green-300">
                    Strengths
                  </h4>

                  <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-green-800 dark:text-green-200">
                    {mockFeedback[currentQuestionIndex].feedback.strengths.map(
                      (item, index) => (
                        <li key={index}>{item}</li>
                      )
                    )}
                  </ul>
                </div>

                {/* Improvements */}
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-900 dark:bg-amber-950/30">
                  <h4 className="font-semibold text-amber-800 dark:text-amber-300">
                    Areas to Improve
                  </h4>

                  <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-amber-800 dark:text-amber-200">
                    {mockFeedback[currentQuestionIndex].feedback.improvements.map(
                      (item, index) => (
                        <li key={index}>{item}</li>
                      )
                    )}
                  </ul>
                </div>

                {/* Detailed Feedback */}
                <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-5 dark:border-indigo-900 dark:bg-indigo-950/30">
                  <h4 className="font-semibold text-indigo-800 dark:text-indigo-300">
                    Detailed AI Feedback
                  </h4>

                  <p className="mt-3 text-sm leading-7 text-indigo-900 dark:text-indigo-200">
                    {mockFeedback[currentQuestionIndex].feedback.feedback}
                  </p>
                </div>

                <button
                  onClick={handleNextMockQuestion}
                  className="rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white transition hover:bg-indigo-700"
                >
                  {currentQuestionIndex === result.questions.length - 1
                    ? "Finish Interview"
                    : "Next Question"}
                </button>

                <button
                onClick={handleFinishMockInterview}
                disabled={evaluatingAnswer}
                className="mt-4 ml-3 rounded-xl border border-red-300  bg-red-100 px-6 py-3 font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50 dark:border-red-900 dark:bg-red-600 dark:text-white  dark:hover:bg-red-800"
              >
                End Interview
              </button>

                
              </div>
            )}
            </div>
          )}

          {mockCompleted && (
          <div className="space-y-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">

            <div className="text-center">
              <div className="text-4xl">🏆</div>

              <h2 className="mt-3 text-2xl font-bold text-gray-900 dark:text-white">
                Mock Interview Completed!
              </h2>

              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Here is your AI-powered interview performance report.
              </p>
            </div>

            {/* Overall Score */}
            <div className="rounded-2xl bg-indigo-50 p-6 text-center dark:bg-indigo-950/30">
              <p className="text-sm font-medium text-indigo-700 dark:text-indigo-300">
                Average Overall Score
              </p>

              <p className="mt-2 text-5xl font-bold text-indigo-600 dark:text-indigo-400">
                {averageScore}/100
              </p>

              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Based on {mockFeedback.length} answered questions
              </p>
            </div>

            {/* Average Scores */}
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              {[
                { label: "Relevance", score: averageRelevance },
                { label: "Clarity", score: averageClarity },
                { label: "Accuracy", score: averageAccuracy },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-center dark:border-gray-700 dark:bg-gray-800"
                >
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {item.label}
                  </p>

                  <p className="mt-2 text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                    {item.score}/100
                  </p>
                </div>
              ))}
            </div>

            {/* Overall Strengths */}
            <div className="rounded-xl border border-green-200 bg-green-50 p-5 dark:border-green-900 dark:bg-green-950/30">
              <h3 className="font-bold text-green-800 dark:text-green-300">
                Your Overall Strengths
              </h3>

              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-green-800 dark:text-green-200">
                {Array.from(
                  new Set(mockFeedback.flatMap((item) => item.feedback.strengths))
                ).map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>

            {/* Areas to Improve */}
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-900 dark:bg-amber-950/30">
              <h3 className="font-bold text-amber-800 dark:text-amber-300">
                Areas to Improve
              </h3>

              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-amber-800 dark:text-amber-200">
                {Array.from(
                  new Set(mockFeedback.flatMap((item) => item.feedback.improvements))
                ).map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>

            {/* Restart */}
            <div className="flex justify-center">
              <button
                onClick={handleStartMockInterview}
                className="rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white transition hover:bg-indigo-700"
              >
                🔄 Retake Mock Interview
              </button>
            </div>

          </div>
        )}

          {/* Preparation Tips */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Interview Preparation Tips
            </h2>

            <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-6 text-gray-600 dark:text-gray-400">
              {result.preparationTips.map((tip, index) => (
                <li key={index}>{tip}</li>
              ))}
            </ul>
          </div>

        </div>
      )}

      </div>
    </div>
  );
};

export default InterviewPreparation;