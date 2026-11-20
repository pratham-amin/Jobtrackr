import type{ Request, Response } from 'express';
import { generateInterviewQuestions } from '../services/openaiService.js';

export async function createInterviewPreparation(
  req: Request,
  res: Response
) {
  try {
    const { jobRole, jobDescription, interviewType } = req.body;

    if (
      !jobRole?.trim() ||
      !jobDescription?.trim() ||
      !interviewType?.trim()
    ) {
      return res.status(400).json({
        message: 'Please provide the job role, job description and interview type.',
      });
    }

    const allowedTypes = ['Technical', 'Behavioural', 'Mixed'];

    if (!allowedTypes.includes(interviewType)) {
      return res.status(400).json({
        message: 'Invalid interview type.',
      });
    }

    const result = await generateInterviewQuestions(
      jobRole.trim(),
      jobDescription.trim(),
      interviewType
    );

    return res.status(200).json({
      message: 'Interview questions generated successfully.',
      result,
    });
  } catch (error) {
    console.error('Interview preparation error:', error);

    return res.status(500).json({
      message: 'Failed to generate interview questions.',
    });
  }
}