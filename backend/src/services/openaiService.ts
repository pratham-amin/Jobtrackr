
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
