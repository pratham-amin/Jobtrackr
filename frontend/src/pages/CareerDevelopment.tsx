
import React, { useState } from "react";
import { Link } from "react-router-dom";

interface CareerPhase {
  phase: string;
  duration: string;
  objectives: string[];
  skillsToLearn: string[];
  activities: string[];
  milestones: string[];
}

interface CareerRoadmap {
  title: string;
  overview: string;
  estimatedDuration: string;
  phases: CareerPhase[];
  recommendations: string[];
}

const CareerDevelopment: React.FC = () => {
  const [currentRole, setCurrentRole] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("Beginner");
  const [currentSkills, setCurrentSkills] = useState("");
  const [weeklyHours, setWeeklyHours] = useState("10");

  const [roadmap, setRoadmap] = useState<CareerRoadmap | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event: React.FormEvent) => {
  event.preventDefault();

  setLoading(true);
  setError("");
  setRoadmap(null);

  try {
    const token = localStorage.getItem("token");

    const response = await fetch(
      "http://localhost:5000/career/roadmap",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentRole,
          targetRole,
          experienceLevel,
          currentSkills,
          weeklyHours: Number(weeklyHours),
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to generate career roadmap.");
    }

    setRoadmap(data.roadmap as CareerRoadmap);
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

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-10 dark:bg-gray-950">
      <div className="mx-auto max-w-4xl">
        <div className="mb-2 flex items-center justify-between py-3">
          <Link
            to="/ai-assistant"
            className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 "
          >
            ← Back to AI Assistant
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            AI Career Development Planner
          </h1>

          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Build a personalised career roadmap and take the next step
            towards your professional goals.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-2xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-gray-900"
          >
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Tell us about your career goals
            </h2>

            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Provide a few details so AI can create a roadmap tailored to you.
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">
              Current Role
            </label>

            <input
              type="text"
              value={currentRole}
              onChange={(e) => setCurrentRole(e.target.value)}
              placeholder="e.g. Computer Science Student"
              required
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">
              Target Career Role
            </label>

            <input
              type="text"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              placeholder="e.g. Full-Stack Developer"
              required
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">
              Experience Level
            </label>

            <select
              value={experienceLevel}
              onChange={(e) => setExperienceLevel(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            >
              <option>Beginner</option>
              <option>Intermediate</option>
              <option>Advanced</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">
              Current Skills
            </label>

            <textarea
              value={currentSkills}
              onChange={(e) => setCurrentSkills(e.target.value)}
              placeholder="e.g. JavaScript, React, TypeScript, SQL"
              rows={4}
              required
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">
              Weekly Learning Availability
            </label>

            <select
              value={weeklyHours}
              onChange={(e) => setWeeklyHours(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            >
              <option value="5">5 hours per week</option>
              <option value="10">10 hours per week</option>
              <option value="15">15 hours per week</option>
              <option value="20">20 hours per week</option>
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
            {loading ? "Generating Your Career Roadmap..." : "Generate My Career Roadmap"}
          </button>
          
        </form>
        
                {roadmap && (
          <div className="mt-10 space-y-8">

            {/* Roadmap Overview */}
            <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {roadmap.title}
              </h2>

              <p className="mt-3 text-gray-600 dark:text-gray-400">
                {roadmap.overview}
              </p>

              <div className="mt-5 inline-flex rounded-lg bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
                Estimated Duration: {roadmap.estimatedDuration}
              </div>
            </div>

            {/* Learning Phases */}
            <div>
              <h2 className="mb-5 text-2xl font-bold text-gray-900 dark:text-white">
                Your Learning Roadmap
              </h2>

              <div className="space-y-6">
                {roadmap.phases.map((phase, index) => (
                  <div
                    key={index}
                    className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                        {phase.phase}
                      </h3>

                      <span className="rounded-full bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
                        {phase.duration}
                      </span>
                    </div>

                    <div className="mt-5 space-y-5">

                      <div>
                        <h4 className="font-semibold text-gray-800 dark:text-gray-200">
                          Objectives
                        </h4>
                        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-600 dark:text-gray-400">
                          {phase.objectives.map((item: string, i: number) => (
                            <li key={i}>{item}</li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-semibold text-gray-800 dark:text-gray-200">
                          Skills to Learn
                        </h4>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {phase.skillsToLearn.map((skill: string, i: number) => (
                            <span
                              key={i}
                              className="rounded-lg bg-gray-100 px-3 py-1 text-sm text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold text-gray-800 dark:text-gray-200">
                          Practical Activities
                        </h4>
                        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-600 dark:text-gray-400">
                          {phase.activities.map((item: string, i: number) => (
                            <li key={i}>{item}</li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-semibold text-gray-800 dark:text-gray-200">
                          Milestones
                        </h4>
                        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-600 dark:text-gray-400">
                          {phase.milestones.map((item: string, i: number) => (
                            <li key={i}>{item}</li>
                          ))}
                        </ul>
                      </div>

                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommendations */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Personalised Recommendations
              </h2>

              <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-gray-600 dark:text-gray-400">
                {roadmap.recommendations.map((item: string, index: number) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>

          </div>
        )}
      </div>
    </div>
  );
};

export default CareerDevelopment;
