
import type { Response } from 'express';
import pool from '../config/db.js';
import type { AuthRequest } from '../types/custom.js';
import { generateCoverLetter } from '../services/openaiService.js';

import { extractResumeText } from '../services/resumeParser.js';
import { generateResumeAnalysis } from '../services/openaiService.js';
import { generateResumeSuggestions } from '../services/openaiService.js';
import { generateFinalResume } from '../services/openaiService.js';
import { generateJobMatch } from '../services/openaiService.js';

export async function createCoverLetter(
  req: AuthRequest,
  res: Response
): Promise<void> {
  const {
    jobTitle,
    company,
    jobDescription,
    skills = '',
    experience = '',
    tone = 'professional',
  } = req.body;

  if (
    typeof jobTitle !== 'string' ||
    typeof company !== 'string' ||
    typeof jobDescription !== 'string' ||
    typeof skills !== 'string' ||
    typeof experience !== 'string'
  ) {
    res.status(400).json({
      error: 'Please provide valid cover letter details.',
    });
    return;
  }

  if (
    !jobTitle.trim() ||
    !company.trim() ||
    !jobDescription.trim()
  ) {
    res.status(400).json({
      error: 'Job title, company and job description are required.',
    });
    return;
  }

  if (
    jobTitle.length > 150 ||
    company.length > 150 ||
    jobDescription.length > 12000 ||
    skills.length > 3000 ||
    experience.length > 3000
  ) {
    res.status(400).json({
      error: 'One or more fields exceed the allowed length.',
    });
    return;
  }

  const allowedTones = [
    'professional',
    'confident',
    'enthusiastic',
  ];

  if (!allowedTones.includes(tone)) {
    res.status(400).json({
      error: 'Invalid writing tone.',
    });
    return;
  }

  try {
    const userId =
      typeof req.user === 'object' && req.user !== null
        ? req.user.id
        : undefined;

    if (!userId) {
      res.status(401).json({
        error: 'Authentication required.',
      });
      return;
    }

    const userResult = await pool.query(
      'SELECT name FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      res.status(404).json({
        error: 'User not found.',
      });
      return;
    }

    const coverLetter = await generateCoverLetter({
      name: userResult.rows[0].name,
      jobTitle: jobTitle.trim(),
      company: company.trim(),
      jobDescription: jobDescription.trim(),
      skills: skills.trim(),
      experience: experience.trim(),
      tone,
    });

    const savedLetter = await pool.query(
  `INSERT INTO cover_letters (
    user_id,
    job_title,
    company,
    job_description,
    skills,
    experience,
    tone,
    content
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, created_at`,
      [
        userId,
        jobTitle.trim(),
        company.trim(),
        jobDescription.trim(),
        skills.trim(),
        experience.trim(),
        tone,
        coverLetter,
      ]
    );

      res.status(200).json({
      message: 'Cover letter generated and saved successfully.',
      coverLetter,
      historyId: savedLetter.rows[0].id,
    });
  } catch (error: any) {
    console.error('Cover letter generation failed:', error);

    res.status(500).json({
      error: error.message || 'Unknown server error',
      errorType: error.name,
      status: error.status,
    });
  }
}

export async function getCoverLetterHistory(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const userId =
      typeof req.user === 'object' && req.user !== null
        ? req.user.id
        : undefined;

    if (!userId) {
      res.status(401).json({
        error: 'Authentication required.',
      });
      return;
    }

    const result = await pool.query(
      `SELECT
        id,
        job_title,
        company,
        tone,
        content,
        created_at
       FROM cover_letters
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );

    res.status(200).json({
      history: result.rows,
    });
  } catch (error) {
    console.error('Unable to fetch cover letter history:', error);

    res.status(500).json({
      error: 'Unable to load cover letter history.',
    });
  }
}

export async function deleteCoverLetterHistory(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const userId =
      typeof req.user === "object" && req.user !== null
        ? req.user.id
        : undefined;

    const letterId = Number(req.params.id);

    if (!userId) {
      res.status(401).json({
        error: "Authentication required.",
      });
      return;
    }

    if (!Number.isInteger(letterId) || letterId <= 0) {
      res.status(400).json({
        error: "Invalid cover letter ID.",
      });
      return;
    }

    const result = await pool.query(
      `DELETE FROM cover_letters
       WHERE id = $1 AND user_id = $2
       RETURNING id`,
      [letterId, userId]
    );

    if (result.rowCount === 0) {
      res.status(404).json({
        error: "Cover letter not found.",
      });
      return;
    }

    res.status(200).json({
      message: "Cover letter deleted successfully.",
    });
  } catch (error) {
    console.error("Unable to delete cover letter:", error);

    res.status(500).json({
      error: "Unable to delete cover letter.",
    });
  }
}

export async function updateCoverLetterHistory(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const userId =
      typeof req.user === 'object' && req.user !== null
        ? req.user.id
        : undefined;

    const letterId = Number(req.params.id);
    const { content } = req.body;

    if (!userId) {
      res.status(401).json({
        error: 'Authentication required.',
      });
      return;
    }

    if (!Number.isInteger(letterId) || letterId <= 0) {
      res.status(400).json({
        error: 'Invalid cover letter ID.',
      });
      return;
    }

    if (
      typeof content !== 'string' ||
      !content.trim() ||
      content.length > 20000
    ) {
      res.status(400).json({
        error: 'Please provide valid cover letter content.',
      });
      return;
    }

    const result = await pool.query(
      `UPDATE cover_letters
       SET content = $1
       WHERE id = $2 AND user_id = $3
       RETURNING id, job_title, company, tone, content, created_at`,
      [content.trim(), letterId, userId]
    );

    if (result.rowCount === 0) {
      res.status(404).json({
        error: 'Cover letter not found.',
      });
      return;
    }

    res.status(200).json({
      message: 'Cover letter updated successfully.',
      historyItem: result.rows[0],
    });
  } catch (error) {
    console.error('Unable to update cover letter:', error);

    res.status(500).json({
      error: 'Unable to update cover letter.',
    });
  }
}

export async function analyzeResume(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const userId =
      typeof req.user === 'object' && req.user !== null
        ? req.user.id
        : undefined;

    if (!userId) {
      res.status(401).json({
        error: 'Authentication required.',
      });
      return;
    }

    if (!req.file) {
      res.status(400).json({
        error: 'Please upload a resume.',
      });
      return;
    }

    const resumeText = await extractResumeText(req.file);

    const analysis = await generateResumeAnalysis(resumeText);

    res.status(200).json({
      message: 'Resume analysed successfully.',
      fileName: req.file.originalname,
      analysis,
    });
  } catch (error) {
    console.error('Resume analysis failed:', error);

    res.status(500).json({
      error: 'Unable to analyse your resume. Please try again.',
    });
  }
}


export async function optimizeResume(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const userId =
      typeof req.user === 'object' && req.user !== null
        ? req.user.id
        : undefined;

    if (!userId) {
      res.status(401).json({
        error: 'Authentication required.',
      });
      return;
    }

    if (!req.file) {
      res.status(400).json({
        error: 'Please upload a resume.',
      });
      return;
    }

    const { jobDescription } = req.body;

    if (
      typeof jobDescription !== 'string' ||
      !jobDescription.trim()
    ) {
      res.status(400).json({
        error: 'Please provide a job description.',
      });
      return;
    }

    const resumeText = await extractResumeText(req.file);

    const parsedMatchResult = await generateJobMatch(
      resumeText,
      jobDescription.trim()
    );

    const analysis = await generateResumeAnalysis(resumeText);

    const optimization = await generateResumeSuggestions(
      resumeText,
      analysis,
      jobDescription,
      parsedMatchResult
      
    );

    res.status(200).json({
      message: 'Resume suggestions generated successfully.',
      fileName: req.file.originalname,
      suggestions: optimization.suggestions,
    });
  } catch (error) {
    console.error('Resume optimization failed:', error);

    res.status(500).json({
      error: 'Unable to generate resume suggestions. Please try again.',
    });
  }
}



export async function createFinalResume(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const userId =
      typeof req.user === 'object' && req.user !== null
        ? req.user.id
        : undefined;

    if (!userId) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }

    if (!req.file) {
      res.status(400).json({
        error: 'Please upload your original resume.',
      });
      return;
    }

    const jobDescription = req.body.jobDescription;

    if (!jobDescription?.trim()) {
      res.status(400).json({
        error: 'Job description is required.',
      });
      return;
    }

    let acceptedSuggestions;
    let matchResult;

    try {
      acceptedSuggestions = JSON.parse(
        req.body.acceptedSuggestions || '[]'
      );

      matchResult = JSON.parse(
        req.body.matchResult || '{}'
      );
    } catch {
      res.status(400).json({
        error: 'Invalid suggestions or matching feedback format.',
      });
      return;
    }

    if (
      !Array.isArray(acceptedSuggestions) ||
      acceptedSuggestions.length === 0 ||
      !acceptedSuggestions.every(
        (item) =>
          item &&
          typeof item.section === 'string' &&
          typeof item.original === 'string' &&
          typeof item.improved === 'string' &&
          typeof item.reason === 'string'
      )
    ) {
      res.status(400).json({
        error: 'Please accept at least one valid suggestion.',
      });
      return;
    }

    if (
      typeof matchResult.matchScore !== 'number' ||
      !Array.isArray(matchResult.matchingSkills) ||
      !Array.isArray(matchResult.missingSkills) ||
      !Array.isArray(matchResult.matchingExperience) ||
      !Array.isArray(matchResult.recommendations) ||
      typeof matchResult.summary !== 'string'
    ) {
      res.status(400).json({
        error: 'Valid job matching feedback is required.',
      });
      return;
    }

    const resumeText = await extractResumeText(req.file);

    // Generate general resume analysis
    const analysis = await generateResumeAnalysis(resumeText);

    // Generate the final resume using all feedback
    const finalResume = await generateFinalResume(
      resumeText,
      analysis,
      acceptedSuggestions,
      jobDescription,
      matchResult
    );

    res.status(200).json({
      message: 'Improved resume generated successfully.',
      fileName: req.file.originalname,
      finalResume,
    });
  } catch (error) {
    console.error('Final resume generation failed:', error);

    res.status(500).json({
      error: 'Unable to generate your improved resume.',
    });
  }
}




export async function matchResumeToJob(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const userId =
      typeof req.user === 'object' && req.user !== null
        ? req.user.id
        : undefined;

    if (!userId) {
      res.status(401).json({
        error: 'Authentication required.',
      });
      return;
    }

    const { jobDescription, resumeText } = req.body;

    if (
      typeof jobDescription !== 'string' ||
      !jobDescription.trim()
    ) {
      res.status(400).json({
        error: 'Please provide a job description.',
      });
      return;
    }

    let extractedResumeText: string;
    let fileName: string | undefined;

    if (typeof resumeText === 'string' && resumeText.trim()) {
      // Match the generated resume text
      extractedResumeText = resumeText.trim();
      fileName = 'Generated Resume';
    } else if (req.file) {
      // Match the originally uploaded resume
      extractedResumeText = await extractResumeText(req.file);
      fileName = req.file.originalname;
    } else {
      res.status(400).json({
        error: 'Please upload a resume or provide resume text.',
      });
      return;
    }

    const matchResult = await generateJobMatch(
      extractedResumeText,
      jobDescription.trim()
    );

    res.status(200).json({
      message: 'Resume matched with job description successfully.',
      fileName,
      result: matchResult,
    });
  } catch (error) {
    console.error('Resume job matching failed:', error);

    res.status(500).json({
      error: 'Unable to match resume with job description. Please try again.',
    });
  }
}
