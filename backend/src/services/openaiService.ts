
import { GoogleGenAI } from '@google/genai';

interface CoverLetterInput {
  name: string;
  jobTitle: string;
  company: string;
  jobDescription: string;
  skills: string;
  experience: string;
  tone: 'professional' | 'confident' | 'enthusiastic';
}

export interface CareerRoadmap {
  title: string;
  overview: string;
  estimatedDuration: string;
  phases: {
    phase: string;
    duration: string;
    objectives: string[];
    skillsToLearn: string[];
    activities: string[];
    milestones: string[];
  }[];
  recommendations: string[];
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function generateCoverLetter(
  data: CoverLetterInput
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured.');
  }

  const ai = new GoogleGenAI({ apiKey });

  
const prompt = `
  You are an expert professional cover letter writer.

  Write a personalised, compelling cover letter tailored
  specifically to the advertised position.

  CANDIDATE INFORMATION:
  Name: ${data.name}
  Skills: ${data.skills || "Not provided"}
  Work Experience: ${data.experience || "Not provided"}

  JOB INFORMATION:
  Position: ${data.jobTitle}
  Company: ${data.company}

  Job Description:
  ${data.jobDescription}

  WRITING INSTRUCTIONS:
  - Address the requirements of the advertised position.
  - Select the candidate's most relevant skills.
  - Connect their actual experience to the job requirements.
  - Explain how their skills could contribute to the company.
  - Use a ${data.tone} writing tone.
  - Do not invent qualifications, employment history,
    achievements, or technical skills.
  - Do not claim experience that the candidate has not provided.
  - Avoid generic openings and repetitive statements.
  - Use professional paragraphs and natural language.
  - Keep the letter between 250 and 400 words.
  - Return only the completed cover letter.
`;


let response;

for (let attempt = 1; attempt <= 3; attempt++) {
  try {
    response = await ai.interactions.create({
     model: 'gemini-3.5-flash-lite',
      input: prompt,
      store: false,
    });

    break;
  } catch (error: any) {
    const status = error.status;

    if (status !== 503 || attempt === 3) {
      throw error;
    }

    await sleep(2000 * Math.pow(2, attempt - 1));
  }
}

const coverLetter = response?.output_text?.trim();


  if (!coverLetter) {
    throw new Error('Gemini did not generate a cover letter.');
  }

  return coverLetter;
}


export interface ResumeAnalysis {
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

export async function generateResumeAnalysis(
  resumeText: string
): Promise<ResumeAnalysis> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured.');
  }

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `
    You are an expert resume reviewer and ATS optimisation specialist.

    Analyse the following resume and return an honest,
    constructive evaluation.

    RESUME:
    ${resumeText}

    Evaluate:
    1. Resume structure and organisation.
    2. Professional experience and achievements.
    3. Skills presentation.
    4. Education details.
    5. Readability and ATS compatibility.

    IMPORTANT:
    - Do not invent qualifications or experience.
    - Do not assume missing information.
    - Give practical improvement suggestions.
    - The score must be between 0 and 100.
    - The score is an indicative resume-quality score,
      not a guarantee of passing an actual ATS.
    - Return valid JSON only, without Markdown.

    Use exactly this JSON structure:
    {
      "overallScore": 75,
      "summary": "Short resume evaluation",
      "strengths": ["Strength 1", "Strength 2"],
      "improvements": ["Suggestion 1", "Suggestion 2"],
      "skillsFound": ["Skill 1", "Skill 2"],
      "sectionFeedback": [
        {
          "section": "Professional Experience",
          "score": 75,
          "feedback": "Section evaluation"
        }
      ]
    }
  `;

  const response = await ai.interactions.create({
    model: 'gemini-3.5-flash-lite',
    input: prompt,
    store: false,
  });

  const output = response.output_text?.trim();

  if (!output) {
    throw new Error('Gemini did not generate a resume analysis.');
  }

  const analysis = JSON.parse(output) as ResumeAnalysis;

  if (
    typeof analysis.overallScore !== 'number' ||
    analysis.overallScore < 0 ||
    analysis.overallScore > 100 ||
    typeof analysis.summary !== 'string' ||
    !Array.isArray(analysis.strengths) ||
    !Array.isArray(analysis.improvements) ||
    !Array.isArray(analysis.skillsFound) ||
    !Array.isArray(analysis.sectionFeedback)
  ) {
    throw new Error('Gemini returned an invalid resume analysis.');
  }

  return analysis;
}


interface ResumeSuggestion {
  section: string;
  original: string;
  improved: string;
  reason: string;
}

interface ResumeOptimization {
  suggestions: ResumeSuggestion[];
}


export async function generateResumeSuggestions(
  resumeText: string,
  analysis: ResumeAnalysis,
  jobDescription: string,
  matchResult: JobMatchResult
): Promise<ResumeOptimization> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured.');
  }

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `
You are an expert professional resume writer and ATS optimisation specialist.

Your task is to improve the candidate's resume specifically for the
provided job description, using the resume matching feedback.

ORIGINAL RESUME:
${resumeText}

GENERAL RESUME ANALYSIS:
${JSON.stringify(analysis, null, 2)}

TARGET JOB DESCRIPTION:
${jobDescription}

INITIAL JOB MATCHING FEEDBACK:
${JSON.stringify(matchResult, null, 2)}

Your objective is to improve the resume by addressing both the
general weaknesses identified in the resume analysis and the
job-specific gaps identified in the matching feedback.

Requirements:

1. Prioritise the missing skills and keywords identified in the
   matching feedback.
2. Identify relevant experience already present in the resume that
   can be better highlighted.
3. Improve weak experience and project descriptions using language
   relevant to the target role.
4. Improve the professional summary to reflect the target role.
5. Incorporate relevant job-description keywords only when supported
   by the candidate's actual experience or qualifications.
6. Address the AI recommendations from the initial matching feedback.
7. Preserve all actual qualifications, employers, dates and facts.
8. Never invent skills, certifications, achievements, metrics or
   professional experience.
9. If a required skill is genuinely missing, do not pretend the
   candidate possesses it. Explain the gap in the reason.
10. Do not rewrite content that is already relevant and effective.
11. Provide between 3 and 10 useful suggestions.
12. Each suggestion must be specific to this job description.

Return ONLY valid JSON using exactly this structure:

{
  "suggestions": [
    {
      "section": "Professional Summary",
      "original": "Original resume content",
      "improved": "Job-specific improved content",
      "reason": "Explain how this improvement addresses the job requirements"
    }
  ]
}
`;

  const response = await ai.interactions.create({
    model: 'gemini-3.5-flash-lite',
    input: prompt,
    store: false,
  });

  const output = response.output_text?.trim();

  if (!output) {
    throw new Error('Gemini did not generate resume suggestions.');
  }

  const cleanedOutput = output
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();

  let result: ResumeOptimization;

  try {
    result = JSON.parse(cleanedOutput) as ResumeOptimization;
  } catch {
    console.error("Gemini returned invalid JSON:", output);
    throw new Error("Gemini returned an invalid JSON response.");
  }

  if (
    !Array.isArray(result.suggestions) ||
    result.suggestions.length === 0 ||
    !result.suggestions.every(
      (item) =>
        typeof item.section === 'string' &&
        typeof item.original === 'string' &&
        typeof item.improved === 'string' &&
        typeof item.reason === 'string'
    )
  ) {
    throw new Error('Gemini returned invalid resume suggestions.');
  }

  return result;
}


export async function generateFinalResume(
  resumeText: string,
  analysis: ResumeAnalysis,
  acceptedSuggestions: ResumeSuggestion[],
  jobDescription: string,
  matchResult: JobMatchResult
): Promise<string> {
  if (!acceptedSuggestions.length) {
    throw new Error('Please accept at least one resume suggestion.');
  }

  if (!jobDescription.trim()) {
    throw new Error('Job description is required.');
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured.');
  }

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `
You are an expert professional resume writer.

Create a complete, polished, ATS-friendly resume tailored to the
target job description, using the original resume and only the
improvements approved by the user.

ORIGINAL RESUME:
${resumeText}

GENERAL RESUME ANALYSIS:
${JSON.stringify(analysis, null, 2)}

TARGET JOB DESCRIPTION:
${jobDescription}

INITIAL JOB MATCHING FEEDBACK:
${JSON.stringify(matchResult, null, 2)}

USER-APPROVED IMPROVEMENTS:
${JSON.stringify(acceptedSuggestions, null, 2)}

REQUIREMENTS:
1. Apply only the improvements provided in the approved suggestions.
2. Tailor wording and relevant keywords to the target job description.
3. Preserve all factual information from the original resume.
4. Do not invent qualifications, skills, employers, dates, metrics,
   certifications or achievements.
5. Do not add skills merely because they appear in the job description.
6. Preserve important original information that was not targeted
   by the suggestions.
7. Use professional language and clear section headings.
8. Keep formatting simple and ATS-friendly.
9. Return the complete resume as plain text.
10. Do not include explanations, commentary or markdown code fences.
`;

  const response = await ai.interactions.create({
    model: 'gemini-3.5-flash-lite',
    input: prompt,
    store: false,
  });

  const finalResume = response.output_text?.trim();

  if (!finalResume) {
    throw new Error('Gemini could not generate the final resume.');
  }

  return finalResume;
}


export interface JobMatchResult {
  matchScore: number;
  matchingSkills: string[];
  missingSkills: string[];
  matchingExperience: string[];
  recommendations: string[];
  summary: string;
}

export async function generateJobMatch(
  resumeText: string,
  jobDescription: string
): Promise<JobMatchResult> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured.');
  }

  if (!resumeText.trim() || !jobDescription.trim()) {
    throw new Error('Resume and job description are required.');
  }

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `
You are an expert recruitment analyst and resume-to-job matching specialist.

Compare the candidate's resume with the supplied job description.

CANDIDATE RESUME:
${resumeText}

JOB DESCRIPTION:
${jobDescription}

Evaluate:
1. Skills that directly match the job requirements.
2. Required skills that are missing from the resume.
3. Relevant experience demonstrated in the resume.
4. Practical recommendations to improve alignment.

IMPORTANT:
- Only identify skills supported by the supplied information.
- Do not assume the candidate has skills or experience not mentioned.
- Distinguish missing information from confirmed lack of ability.
- Calculate an indicative match score between 0 and 100.
- Do not guarantee interview selection or ATS success.
- Give specific and constructive recommendations.
- Return valid JSON only, without Markdown.

Use exactly this structure:
{
  "matchScore": 75,
  "matchingSkills": ["React", "TypeScript"],
  "missingSkills": ["AWS", "Jest"],
  "matchingExperience": ["Experience building React applications"],
  "recommendations": ["Add relevant project details"],
  "summary": "Short explanation of the match."
}
`;

  const response = await ai.interactions.create({
    model: 'gemini-3.5-flash-lite',
    input: prompt,
    store: false,
  });

  const output = response.output_text?.trim();

  if (!output) {
    throw new Error('Gemini did not generate a job match analysis.');
  }

  const cleanedOutput = output
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();

  let result: JobMatchResult;

  try {
    result = JSON.parse(cleanedOutput) as JobMatchResult;
  } catch {
    throw new Error('Gemini returned an invalid job match response.');
  }

  if (
    typeof result.matchScore !== 'number' ||
    result.matchScore < 0 ||
    result.matchScore > 100 ||
    !Array.isArray(result.matchingSkills) ||
    !Array.isArray(result.missingSkills) ||
    !Array.isArray(result.matchingExperience) ||
    !Array.isArray(result.recommendations) ||
    typeof result.summary !== 'string'
  ) {
    throw new Error('Gemini returned an invalid job match analysis.');
  }

  return result;
}


export async function generateCareerRoadmap(
  currentRole: string,
  targetRole: string,
  experienceLevel: string,
  currentSkills: string,
  weeklyHours: number
): Promise<CareerRoadmap> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured.');
  }

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `
You are an expert career advisor and professional development planner.

Create a personalised career development roadmap using the following details.

CURRENT ROLE: ${currentRole}
TARGET ROLE: ${targetRole}
EXPERIENCE LEVEL: ${experienceLevel}
CURRENT SKILLS: ${currentSkills}
WEEKLY LEARNING AVAILABILITY: ${weeklyHours} hours

Requirements:
1. Identify the skills required for the target role.
2. Identify learning gaps based on the current skills.
3. Create a realistic, progressive learning roadmap.
4. Divide the roadmap into clear phases.
5. Include practical projects and activities.
6. Define measurable milestones for each phase.
7. Adapt the timeline to the available weekly learning hours.
8. Avoid assuming the candidate has skills not listed.

Return valid JSON only, without Markdown.

Use exactly this structure:
{
  "title": "Full-Stack Developer Career Roadmap",
  "overview": "A short personalised overview.",
  "estimatedDuration": "6 months",
  "phases": [
    {
      "phase": "Phase 1: Foundations",
      "duration": "Month 1",
      "objectives": ["Build programming fundamentals"],
      "skillsToLearn": ["JavaScript"],
      "activities": ["Complete practical exercises"],
      "milestones": ["Build a small application"]
    }
  ],
  "recommendations": ["Practise consistently"]
}
`;

  const response = await ai.interactions.create({
    model: 'gemini-3.5-flash-lite',
    input: prompt,
    store: false,
  });

  const output = response.output_text?.trim();

  if (!output) {
    throw new Error('Gemini did not generate a career roadmap.');
  }

  const cleanedOutput = output
    .replace(/^```(?:json)?\\s*/i, '')
    .replace(/\\s*```$/, '')
    .trim();

  let result: CareerRoadmap;

  try {
    result = JSON.parse(cleanedOutput) as CareerRoadmap;
  } catch {
    throw new Error('Gemini returned an invalid career roadmap.');
  }

  if (
    typeof result.title !== 'string' ||
    typeof result.overview !== 'string' ||
    typeof result.estimatedDuration !== 'string' ||
    !Array.isArray(result.phases) ||
    !Array.isArray(result.recommendations)
  ) {
    throw new Error('Gemini returned an invalid career roadmap structure.');
  }

  return result;
}