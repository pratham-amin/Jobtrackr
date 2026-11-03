
import type { Response } from 'express';
import pool from '../config/db.js';
import type { AuthRequest } from '../types/custom.js';
import { generateCoverLetter } from '../services/openaiService.js';

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

    res.status(200).json({
      message: 'Cover letter generated successfully.',
      coverLetter,
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
