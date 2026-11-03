
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

    Generate a personalised, well-structured cover letter
    based on the candidate's information and job description.

    Requirements:
    - Use the candidate's actual name.
    - Highlight relevant skills and experience.
    - Connect strengths to job requirements.
    - Maintain the requested writing tone.
    - Do not invent qualifications or achievements.
    - Avoid generic and repetitive statements.
    - Keep the letter between 250 and 400 words.
    - Return only the cover letter.

    Candidate name: ${data.name}
    Job title: ${data.jobTitle}
    Company: ${data.company}
    Skills: ${data.skills}
    Experience: ${data.experience}
    Writing tone: ${data.tone}

    Job description:
    ${data.jobDescription}
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
