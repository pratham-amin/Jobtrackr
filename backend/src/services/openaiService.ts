
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
  analysis: ResumeAnalysis
): Promise<ResumeOptimization> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured.');
  }

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `
You are an expert professional resume writer and ATS optimisation specialist.

Review the original resume and its AI analysis.

ORIGINAL RESUME:
${resumeText}

RESUME ANALYSIS:
${JSON.stringify(analysis, null, 2)}

Generate actionable improvements for the resume.

Requirements:
1. Address the weaknesses identified in the analysis.
2. Improve weak sentences and professional descriptions.
3. Improve the professional summary where appropriate.
4. Improve experience and project descriptions without inventing achievements.
5. Suggest relevant skills only when supported by the original resume.
6. Preserve the user's actual qualifications, experience, dates and facts.
7. Never invent employers, certifications, metrics or achievements.
8. Do not rewrite content that is already strong without a reason.
9. Return between 3 and 10 useful suggestions.

Return ONLY valid JSON using this structure:

{
  "suggestions": [
    {
      "section": "Professional Summary",
      "original": "Original resume content",
      "improved": "Improved resume content",
      "reason": "Explanation of the improvement"
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
  acceptedSuggestions: ResumeSuggestion[]
): Promise<string> {
  if (!acceptedSuggestions.length) {
    throw new Error('Please accept at least one resume suggestion.');
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured.');
  }

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `
You are an expert professional resume writer.

Create a complete, polished, ATS-friendly resume using the
original resume and only the improvements approved by the user.

ORIGINAL RESUME:
${resumeText}

USER-APPROVED IMPROVEMENTS:
${JSON.stringify(acceptedSuggestions, null, 2)}

REQUIREMENTS:
1. Apply only the improvements provided in the approved suggestions.
2. Preserve all factual information from the original resume.
3. Do not invent qualifications, skills, employers, dates, metrics,
   certifications or achievements.
4. Preserve important original information that was not targeted
   by the suggestions.
5. Use professional language and clear section headings.
6. Keep the formatting simple and ATS-friendly.
7. Return the complete resume as plain text.
8. Do not include explanations, commentary or markdown code fences.
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


