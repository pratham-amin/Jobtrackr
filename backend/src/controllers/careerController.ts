import type { Request, Response } from 'express';
import { generateCareerRoadmap } from '../services/openaiService.js';

export async function createCareerRoadmap(
  req: Request,
  res: Response
) {
  try {
    const {
      currentRole,
      targetRole,
      experienceLevel,
      currentSkills,
      weeklyHours,
    } = req.body;

    if (
      !currentRole?.trim() ||
      !targetRole?.trim() ||
      !experienceLevel?.trim() ||
      !currentSkills?.trim() ||
      !weeklyHours
    ) {
      return res.status(400).json({
        message: 'Please provide all required career details.',
      });
    }

    const hours = Number(weeklyHours);

    if (!Number.isFinite(hours) || hours <= 0 || hours > 168) {
      return res.status(400).json({
        message: 'Weekly learning hours must be between 1 and 168.',
      });
    }

    const roadmap = await generateCareerRoadmap(
      currentRole.trim(),
      targetRole.trim(),
      experienceLevel.trim(),
      currentSkills.trim(),
      hours
    );

    return res.status(200).json({
      message: 'Career roadmap generated successfully.',
      roadmap,
    });
  } catch (error) {
    console.error('Career roadmap error:', error);

    return res.status(500).json({
      message: 'Failed to generate career roadmap.',
    });
  }
}