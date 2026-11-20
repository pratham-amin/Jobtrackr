import type{ Request, Response } from 'express';
import { evaluateInterviewAnswer } from '../services/openaiService.js';

export async function evaluateMockAnswer(
  req: Request,
  res: Response
) {
  try {
    const { question, answer, jobRole } = req.body;

    if (
      typeof question !== 'string' ||
      typeof answer !== 'string' ||
      typeof jobRole !== 'string' ||
      !question.trim() ||
      !answer.trim() ||
      !jobRole.trim()
    ) {
      return res.status(400).json({
        message: 'Question, answer and job role are required.',
      });
    }

    const feedback = await evaluateInterviewAnswer(
      question.trim(),
      answer.trim(),
      jobRole.trim()
    );

    return res.status(200).json({
      message: 'Interview answer evaluated successfully.',
      feedback,
    });
  } catch (error) {
    console.error('Mock interview evaluation error:', error);

    return res.status(500).json({
      message: 'Failed to evaluate interview answer.',
    });
  }
}